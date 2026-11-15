import type { SimulationState } from './simulationTypes'

export type MissionScore = { total: number; rank: 'FRAGILE' | 'OPERATIONAL' | 'RESILIENT' | 'EXEMPLARY'; survival: number; wellness: number; lifeSupport: number; equipment: number; protection: number }

/** A gameplay debrief score, not an operational mission-readiness rating. */
export function scoreMission(state: SimulationState): MissionScore {
  const survival = Math.round(Math.max(0, Math.min(1, state.sol / 30)) * 35)
  const wellness = Math.round(state.health / 100 * 25)
  const lifeSupport = Math.round((Math.min(1, state.water / 180) + Math.min(1, state.oxygen / 100) + Math.min(1, state.food / 90)) / 3 * 20)
  const equipment = Math.round(state.equipment / 100 * 10)
  const protection = Math.round(Math.max(0, 1 - state.radiation / 100) * 10)
  const total = survival + wellness + lifeSupport + equipment + protection
  return { total, survival, wellness, lifeSupport, equipment, protection, rank: total >= 90 ? 'EXEMPLARY' : total >= 75 ? 'RESILIENT' : total >= 55 ? 'OPERATIONAL' : 'FRAGILE' }
}
