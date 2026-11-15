import type { EventAction, EventKind, MissionEvent, SimulationConfig, SimulationState } from './simulationTypes'

// Rates are simplified gameplay values per Sol, designed to demonstrate coupled systems.
export class SimulationEngine {
  readonly config: SimulationConfig
  state: SimulationState
  private randomState: number

  constructor(config: SimulationConfig) {
    this.config = config
    this.randomState = config.seed >>> 0
    this.state = { sol: 0, power: config.initialPower, water: 420, oxygen: 190 + config.shelter * 24, food: config.crew * 38, radiation: 0, health: 100, temperature: 21, outsideTemperature: -65, battery: Math.min(220, config.initialPower), dust: 0, equipment: 100, morale: 82, conditioning: 100, storm: 0, stormSols: 0, oxygenFaultSols: 0, solarEventImpact: false, cropHealth: 100, farmMode: 1, sheltering: false, loadShed: 0, failed: null, history: [], events: [], logs: ['Sol 0: Surface systems initialized.'], pending: null }
  }

  private random() { this.randomState = (1664525 * this.randomState + 1013904223) >>> 0; return this.randomState / 4294967296 }

  resolve(actionId: string) {
    const s = this.state
    const event = s.pending
    if (!event) return
    s.pending = null
    const actions: Record<string, () => void> = {
      shelter: () => { s.sheltering = true; s.logs.push(`Sol ${s.sol}: Crew moved to the emergency shelter.`) },
      suspend: () => { s.loadShed = Math.max(s.loadShed, 18); s.logs.push(`Sol ${s.sol}: Nonessential experiments suspended; 18 kWh load removed for this Sol.`) },
      'reduce-farm': () => { s.farmMode = .5; s.logs.push(`Sol ${s.sol}: Greenhouse lighting reduced; power demand falls while crop output and plant oxygen contribution are halved this Sol.`) },
      conserve: () => { s.water = Math.min(500, s.water + 24); s.morale = Math.max(0, s.morale - 4); s.logs.push(`Sol ${s.sol}: Emergency water reserve supplied 24 L; morale decreased.`) },
      ration: () => { s.food = Math.min(this.config.crew * 70, s.food + this.config.crew * 2); s.morale = Math.max(0, s.morale - 3); s.logs.push(`Sol ${s.sol}: Ration protocol conserved food; morale decreased.`) },
      backup: () => { s.battery = Math.min(220, s.battery + 65); s.equipment = Math.max(0, s.equipment - 3); s.logs.push(`Sol ${s.sol}: Backup storage supplied 65 kWh; equipment wear increased.`) },
      continue: () => s.logs.push(`Sol ${s.sol}: Mission control accepted the nominal response.`),
    }
    actions[actionId]?.()
  }

  step(): SimulationState {
    const s = this.state, c = this.config
    if (s.failed || s.sol >= 30 || s.pending) return s
    s.sol++
    if (s.solarEventImpact) { s.radiation += 8; s.solarEventImpact = false }
    s.morale = Math.max(0, Math.min(100, s.morale + (c.exercise ? 1.2 : -.4)))
    s.conditioning = Math.max(0, Math.min(100, s.conditioning + (c.exercise ? .45 : -.8)))
    s.outsideTemperature = -65 + 13 * Math.sin((s.sol / 30) * Math.PI * 2)

    if (s.sol > 2 && this.random() < .23) {
      const pool: EventKind[] = ['dust', 'dust', 'global-dust', 'solar-event', 'panel-damage', 'water-leak', 'oxygen-fault', 'battery-failure', 'thermal-emergency', 'crop-disease', 'comms-blackout', 'impact', 'medical']
      this.raiseEvent(pool[Math.floor(this.random() * pool.length)])
    }

    s.dust = Math.min(1, s.dust + (s.storm === 2 ? .30 : s.storm ? .14 : .008))
    const solar = c.solar * 38 * (1 - s.dust) * (s.storm === 2 ? .18 : s.storm ? .48 : 1)
    const nuclear = c.reactor * 72 * s.equipment / 100
    const heaterNeed = Math.max(0, (18 - s.temperature) * 1.8)
    const load = Math.max(8, 30 + c.crew * 5 + c.farm * 17 * s.farmMode + c.recycler * 7 + c.oxygenGenerator * 8 + heaterNeed - s.loadShed)
    // Daylight generation and nighttime demand are balanced separately; the battery bridges each Sol.
    const transfer = (balance: number) => {
      if (balance < 0) { const discharge = Math.min(s.battery, -balance); s.battery -= discharge; return balance + discharge }
      const charge = Math.min(220 - s.battery, balance); s.battery += charge; return 0
    }
    const dayUnmet = transfer(solar + nuclear * .6 - load * .58)
    const nightUnmet = transfer(nuclear * .4 - load * .42)
    const unmet = dayUnmet + nightUnmet
    s.power = Math.max(0, solar + nuclear - load)
    if (unmet < -0.01) s.equipment = Math.max(0, s.equipment - 8)
    else s.equipment = Math.min(100, s.equipment + .2)
    s.loadShed = 0

    const dailyCrewWater = c.crew * 3.1
    const recycleRate = Math.min(.85, c.recycler * .72)
    const waterUse = dailyCrewWater * (1 - recycleRate + .08) + c.farm * 2
    s.water = Math.max(0, Math.min(500, s.water - waterUse))
    const oxygenProduction = c.oxygenGenerator * 13 * (s.oxygenFaultSols > 0 ? .35 : 1)
    s.oxygen = Math.max(0, Math.min(300, s.oxygen - c.crew * 2.1 + oxygenProduction + c.farm * s.farmMode * (s.cropHealth / 100) * 3 - (s.equipment < 40 ? 8 : 1.5)))
    s.food = Math.max(0, Math.min(c.crew * 70, s.food - c.crew * 1.8 + c.farm * s.farmMode * (s.cropHealth / 100) * 5))
    s.cropHealth = s.power < 8 && c.farm ? Math.max(0, s.cropHealth - 12) : Math.min(100, s.cropHealth + .2)

    const thermalCoupling = (s.outsideTemperature - s.temperature) * .012
    s.temperature += thermalCoupling + (s.power > 0 ? 1.2 : .2) + (s.storm ? -.15 : 0)
    const radiationDose = (1 - c.shielding / 100) * (s.storm === 2 ? 7 : s.storm ? 3 : 1.4)
    s.radiation += radiationDose * (s.sheltering && c.shelter ? .12 : 1)
    if (s.temperature < 8 || s.temperature > 34) s.health -= 8
    if (s.oxygen < c.crew * 8) s.health -= 18
    if (s.water < c.crew * 5) s.health -= 12
    if (s.food < c.crew * 4) s.health -= 10
    if (s.radiation > 65) s.health -= 7
    if (s.morale < 20) s.health -= 2
    if (s.conditioning < 50) s.health -= 1
    s.health = Math.max(0, Math.min(100, s.health + (c.medical ? .5 : 0)))

    if (!s.pending && (s.water < c.crew * 8 || s.power < 5)) this.raiseEvent(s.water < c.crew * 8 ? 'water-leak' : 'thermal-emergency', true)
    if (s.oxygen <= 0 || s.water <= 0 || s.health <= 0 || s.temperature < 0 || s.temperature > 42 || s.radiation > 100) {
      s.failed = s.oxygen <= 0 ? 'Oxygen reserve exhausted' : s.water <= 0 ? 'Water reserve exhausted' : s.health <= 0 ? 'Crew health collapsed' : s.temperature < 0 || s.temperature > 42 ? 'Habitat temperature became unsurvivable' : 'Radiation exceeded the simplified game limit'
    }
    s.history.push({ sol: s.sol, power: Math.round(s.battery), water: Math.round(s.water), oxygen: Math.round(s.oxygen), food: Math.round(s.food), radiation: +s.radiation.toFixed(1), health: Math.round(s.health), temperature: +s.temperature.toFixed(1) })
    s.logs.push(`Sol ${s.sol}: battery ${Math.round(s.battery)} kWh, water ${Math.round(s.water)} L, oxygen ${Math.round(s.oxygen)} units.`)
    s.sheltering = false
    s.farmMode = 1
    if (s.stormSols > 0 && --s.stormSols === 0) s.storm = 0
    if (s.oxygenFaultSols > 0) s.oxygenFaultSols--
    return s
  }

  private raiseEvent(kind: EventKind, forced = false) {
    const s = this.state
    const details: Record<EventKind, [string, string, string]> = {
      dust: ['Regional dust storm', 'Dust is reducing sunlight and solar generation.', 'Power margin depends on both array area and atmospheric clarity.'],
      'global-dust': ['Global dust storm', 'A planet-wide storm sharply reduces solar generation.', 'Dispatchable power and storage buffer variable renewables.'],
      'solar-event': ['Solar particle event', 'A solar particle event is forecast to arrive next Sol.', 'Shielding mass and early sheltering reduce crew exposure.'],
      'panel-damage': ['Solar panel degradation', 'A panel string lost output after dust abrasion.', 'Redundancy preserves power when an array is damaged.'],
      'water-leak': ['Water leak', 'A habitat line is losing stored water.', 'Recovery equipment reduces demand but cannot stop a leak.'],
      'oxygen-fault': ['Oxygen system malfunction', 'The oxygen plant is operating below capacity.', 'Redundant generation protects against single-point failure.'],
      'battery-failure': ['Battery failure', 'Storage capacity has fallen after a thermal fault.', 'Storage bridges intermittent generation and steady demand.'],
      'thermal-emergency': ['Habitat temperature emergency', 'Heating demand is rising as the exterior cools.', 'Thermal control depends on insulation and available power.'],
      'crop-disease': ['Agricultural disease', 'Crop health is falling and food production is reduced.', 'Stored food buffers the time needed to recover a crop.'],
      'comms-blackout': ['Communications blackout', 'A dust front is interrupting the link to mission control.', 'Autonomous procedures matter when Earth is out of contact.'],
      impact: ['Micrometeorite damage', 'An impact has damaged external equipment.', 'Repair capacity and redundant equipment improve resilience.'],
      medical: ['Medical emergency', 'A crew member requires medical support.', 'Crew health depends on prevention, supplies, and treatment.'],
    }
    if (kind === 'dust' || kind === 'global-dust') { s.storm = kind === 'global-dust' ? 2 : 1; s.stormSols = kind === 'global-dust' ? 5 : 2 }
    if (kind === 'solar-event') s.solarEventImpact = true
    if (kind === 'panel-damage') s.dust = Math.min(1, s.dust + .22)
    if (kind === 'water-leak') s.water = Math.max(0, s.water - 28)
    if (kind === 'oxygen-fault' || kind === 'impact') s.equipment = Math.max(0, s.equipment - (kind === 'impact' ? 12 : 18))
    if (kind === 'oxygen-fault') s.oxygenFaultSols = 3
    if (kind === 'battery-failure') s.battery *= .48
    if (kind === 'thermal-emergency') s.temperature -= 5
    if (kind === 'crop-disease') s.cropHealth = Math.max(0, s.cropHealth - 38)
    if (kind === 'medical') s.health = Math.max(0, s.health - (this.config.medical ? 4 : 10))
    if (kind === 'comms-blackout') s.morale = Math.max(0, s.morale - 8)
    const [title, description, lesson] = details[kind]
    {
      const shelterAction: EventAction = this.config.shelter ? { id: 'shelter', label: 'Move crew to shelter', reasoning: 'Shelter reduces radiation exposure, but uses crew time and is only installed on this design.' } : { id: 'continue', label: 'No shelter installed — continue', reasoning: 'This design has no emergency shelter; accept the exposure and use available shielding.' }
      const actions: EventAction[] = kind === 'solar-event' ? [shelterAction, { id: 'suspend', label: 'Suspend experiments', reasoning: 'Shed 18 kWh of nonessential load for this Sol to protect life-support margin.' }, { id: 'continue', label: 'Continue nominally', reasoning: 'Preserve operations and accept the forecast exposure.' }]
        : kind === 'water-leak' ? [{ id: 'conserve', label: 'Use emergency water reserve', reasoning: 'Add 24 L immediately; morale falls because the crew enters ration protocol.' }, { id: 'continue', label: 'Continue nominally', reasoning: 'Preserve routine and risk a faster reserve decline.' }]
          : kind === 'crop-disease' ? [{ id: 'ration', label: 'Start ration protocol', reasoning: 'Protect food inventory while reducing morale slightly.' }, { id: 'continue', label: 'Keep normal rations', reasoning: 'Protect morale now but use stored food faster.' }]
              : kind === 'dust' || kind === 'global-dust' || kind === 'battery-failure' || kind === 'thermal-emergency' ? [{ id: 'backup', label: 'Activate backup / shed load', reasoning: 'Add 65 kWh to storage; equipment wear rises by 3 points.' }, { id: 'suspend', label: 'Suspend experiments', reasoning: 'Remove 18 kWh from the next Sol load.' }, ...(this.config.farm ? [{ id: 'reduce-farm', label: 'Reduce greenhouse lighting', reasoning: 'Save 8.5 kWh this Sol, but halve crop food and oxygen production.' }] : []), { id: 'continue', label: 'Continue nominally', reasoning: 'Keep full operations and rely on current reserves.' }]
              : [shelterAction, { id: 'continue', label: 'Continue nominally', reasoning: 'Keep current operations and manage the consequences with installed systems.' }]
      const event: MissionEvent = { id: `${s.sol}-${kind}`, sol: s.sol, kind, title, severity: kind === 'global-dust' || kind === 'solar-event' || kind === 'thermal-emergency' ? 'SEVERE' : 'WATCH', description, lesson, warningSols: kind === 'solar-event' ? 1 : 0, actions }
      s.events.push(event); s.pending = event; s.logs.push(`Sol ${s.sol}: ${title}.`)
    }
  }
}
