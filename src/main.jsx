import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDownToLine, Atom, BatteryCharging, Check, ChevronDown, CircleHelp, CloudSun,
  Coins, Dumbbell, FlaskConical, Heart, Leaf, Menu, Moon, Orbit, Plus,
  Rocket, Shield, Sparkles, Sun, TentTree, Trash2, Waves, X, Zap, Droplets, HeartPulse,
  Radiation, Info, TriangleAlert, Star, Pause, Play, FastForward, AlarmClock,
  Volume2, VolumeX, Award, RotateCcw, CircleCheck, CircleX, Bot, Send,
  MessageCircle, LoaderCircle, Lightbulb, ChevronRight,
} from 'lucide-react'
import { buildMentorFallback } from './mentorFallback.js'
import './styles.css'

const LIMIT_KG = 10000
const LIMIT_COST = 100
const MODULES = [
  { id: 'crew', name: 'Crew Quarters', weight: 1500, cost: 15, desc: 'Cozy sleeping pods give your astronaut crew a place to rest.', icon: TentTree, tint: 'violet', badge: 'REQUIRED', badgeIcon: Heart },
  { id: 'solar', name: 'Solar Array', weight: 1000, cost: 10, desc: 'Sun-catching panels generate +40 Power every day.', icon: Sun, tint: 'gold' },
  { id: 'reactor', name: 'Nuclear Micro-Reactor', weight: 3500, cost: 35, desc: 'Makes +90 Power a day, even during dusty storms.', icon: Atom, tint: 'cyan' },
  { id: 'farm', name: 'Hydroponic Farm', weight: 2000, cost: 20, desc: 'Grows fresh food and oxygen using −20 Power.', icon: Leaf, tint: 'green' },
  { id: 'recycler', name: 'Water Recycler', weight: 1500, cost: 15, desc: 'Recycles 98% of water, like the real ISS! Uses −15 Power.', icon: Waves, tint: 'blue' },
  { id: 'shield', name: 'Regolith Radiation Shield', weight: 3000, cost: 10, desc: 'Thick Martian dirt walls help block dangerous solar flares.', icon: Shield, tint: 'orange' },
  { id: 'gym', name: 'Zero-G Gym', weight: 1200, cost: 12, desc: 'Exercise gear keeps astronaut muscles and bones strong.', icon: Dumbbell, tint: 'pink' },
  { id: 'snacks', name: 'Snack & Entertainment Vault', weight: 800, cost: 8, desc: 'Tasty treats and fun games keep crew spirits up.', icon: Sparkles, tint: 'purple' },
]
const GRID = [
  { icon: Orbit, label: 'COMMAND', color: 'violet' }, { icon: Sun, label: 'POWER', color: 'gold' }, { icon: Shield, label: 'SHIELDING', color: 'orange' }, { icon: FlaskConical, label: 'SCIENCE', color: 'cyan' },
  { icon: Leaf, label: 'GROW', color: 'green' }, { icon: Waves, label: 'WATER', color: 'blue' }, { icon: TentTree, label: 'HABITAT', color: 'pink' }, { icon: BatteryCharging, label: 'ENERGY', color: 'gold' },
  { icon: FlaskConical, label: 'LAB', color: 'cyan' }, { icon: Shield, label: 'SAFETY', color: 'orange' }, { icon: Leaf, label: 'GARDEN', color: 'green' }, { icon: Moon, label: 'REST', color: 'violet' },
  { icon: Dumbbell, label: 'WELLNESS', color: 'pink' }, { icon: Waves, label: 'RECYCLE', color: 'blue' }, { icon: Orbit, label: 'AIRLOCK', color: 'cyan' }, { icon: Sparkles, label: 'LIFE', color: 'purple' },
]
const format = (number) => new Intl.NumberFormat('en-US').format(number)
const NASA_FACTS = {
  crew: 'Astronauts aboard the ISS sleep in small, private crew quarters secured to the walls.',
  solar: 'Solar arrays turn sunlight into electricity. Mars gets less sunlight than Earth, especially in dusty weather.',
  reactor: 'NASA studies fission power systems because they can provide steady electricity through long nights and dust storms.',
  farm: 'Plants can help provide fresh food and oxygen on long missions, while careful lighting and water keep them growing.',
  recycler: 'Real NASA Fact: Astronauts on the ISS recycle about 98% of their water—including moisture from breath and sweat!',
  shield: 'Mars has a thin atmosphere, so habitat walls and shielding help protect astronauts from space radiation.',
  gym: 'Astronauts exercise about two hours a day in space to help keep their muscles and bones strong.',
  snacks: 'Sharing favorite foods and fun activities can help a crew feel connected during a long mission far from Earth.',
}
const ADJACENT = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1
const PRESETS = {
  science: { label: 'Heavy Science Base', modules: [{ id: 'crew', tile: 0 }, { id: 'reactor', tile: 1 }, { id: 'solar', tile: 2 }, { id: 'farm', tile: 4 }, { id: 'recycler', tile: 5 }] },
  balanced: { label: 'Balanced Explorer', modules: [{ id: 'crew', tile: 0 }, { id: 'shield', tile: 1 }, { id: 'solar', tile: 2 }, { id: 'farm', tile: 4 }, { id: 'recycler', tile: 5 }, { id: 'snacks', tile: 8 }] },
}

export default function LegacyConstructionGame() {
  const [placements, setPlacements] = useState({})
  const [selected, setSelected] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [toast, setToast] = useState('')
  const [factToast, setFactToast] = useState(null)
  const seenFacts = useRef(new Set())
  const [showLaunch, setShowLaunch] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [muted, setMuted] = useState(false)
  const [mentorOpen, setMentorOpen] = useState(false)
  const [mentorRequest, setMentorRequest] = useState({ id: 0, question: '' })
  const [missionTelemetry, setMissionTelemetry] = useState(null)
  const audioContext = useRef(null)
  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const playSound = useCallback((kind = 'click') => {
    if (mutedRef.current) return
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      const context = audioContext.current || (audioContext.current = new AudioContextClass())
      if (context.state === 'suspended') context.resume()
      const now = context.currentTime
      const notes = kind === 'alarm' ? [[440, 0, .18], [330, .22, .2], [440, .46, .18], [330, .68, .27]]
        : kind === 'victory' ? [[523, 0, .15], [659, .14, .15], [784, .28, .18], [1047, .47, .38]]
          : kind === 'countdown' ? [[kind === 'countdown' ? 660 : 660, 0, .1]]
            : kind === 'launch' ? [[784, 0, .09], [988, .12, .09], [1175, .24, .16]]
              : [[700, 0, .045]]
      notes.forEach(([frequency, offset, duration]) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = kind === 'alarm' ? 'sawtooth' : 'sine'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(kind === 'click' ? .018 : .045, now + offset)
        gain.gain.exponentialRampToValueAtTime(.001, now + offset + duration)
        oscillator.connect(gain).connect(context.destination)
        oscillator.start(now + offset)
        oscillator.stop(now + offset + duration)
      })
    } catch { /* Audio is an optional enhancement; the game works without it. */ }
  }, [])
  const placed = Object.values(placements)
  const weight = placed.reduce((sum, part) => sum + part.weight, 0)
  const cost = placed.reduce((sum, part) => sum + part.cost, 0)
  const hasCrew = placed.some((part) => part.id === 'crew')
  const counts = useMemo(() => MODULES.reduce((map, module) => {
    map[module.id] = placed.filter((part) => part.id === module.id).length
    return map
  }, {}), [placements])
  const percent = Math.min(weight / LIMIT_KG * 100, 100)
  const weightOver = weight > LIMIT_KG
  const costOver = cost > LIMIT_COST
  const canLaunch = hasCrew && !weightOver && !costOver
  const placedEntries = Object.entries(placements).map(([index, module]) => ({ index: Number(index), module, row: Math.floor(Number(index) / 4), col: Number(index) % 4 }))
  const nearbyShieldBonus = placedEntries.some(({ index, module }) => module.id === 'shield' && placedEntries.some((entry) => entry.module.id === 'crew' && ADJACENT({ row: Math.floor(index / 4), col: index % 4 }, entry)))
  const solarPower = counts.solar * 40
  const reactorPower = counts.reactor * 90
  const powerUsed = counts.farm * 20 + counts.recycler * 15
  const powerBalance = solarPower + reactorPower - powerUsed
  const lifeSupport = Math.min(100, counts.farm * 50 + counts.recycler * 50)
  const shielding = Math.min(100, counts.shield * 50 + (nearbyShieldBonus ? 15 : 0))
  const crewWellbeing = Math.min(100, counts.gym * 55 + counts.snacks * 45)
  const mentorSnapshot = useMemo(() => {
    const crewHealth = missionTelemetry?.survival?.health ?? 100
    const morale = missionTelemetry?.survival?.morale ?? 100
    const sol = missionTelemetry?.sol ?? null
    const solarGenerated = counts.solar * 40
    const reactorGenerated = counts.reactor * 90
    const warnings = []
    if (weight > LIMIT_KG) warnings.push(`Payload is ${weight - LIMIT_KG} kg over the launch limit`)
    if (cost > LIMIT_COST) warnings.push(`Budget is $${cost - LIMIT_COST}M over the mission limit`)
    if (powerBalance < 0) warnings.push(`Power deficit: ${powerBalance} per day`)
    if (shielding < 50) warnings.push(`Radiation shielding is below 50% (${shielding}%)`)
    if (lifeSupport < 100) warnings.push(`Life support readiness is ${lifeSupport}%`)
    if (!counts.gym) warnings.push('No Zero-G Gym: Sol 23 health penalty risk')
    if (!counts.snacks) warnings.push('No Snack Vault: Sol 23 morale penalty risk')
    return {
      modules: {
        counts,
        selected: MODULES.find((module) => module.id === selected)?.name || 'None',
        layout: Object.entries(placements).map(([tile, module]) => ({ tile: Number(tile) + 1, row: Math.floor(Number(tile) / 4) + 1, column: Number(tile) % 4 + 1, module: module.name })),
      },
      payload: { usedKg: weight, limitKg: LIMIT_KG, remainingKg: LIMIT_KG - weight },
      budget: { usedM: cost, limitM: LIMIT_COST, remainingM: LIMIT_COST - cost },
      power: { generated: solarGenerated + reactorGenerated, solarGenerated, reactorGenerated, consumed: powerUsed, balance: powerBalance },
      lifeSupport: { readiness: lifeSupport, water: Math.min(100, counts.recycler * 50), oxygen: Math.min(100, counts.farm * 50), food: counts.farm ? `${counts.farm} farm module(s) active` : 'No farm installed' },
      radiation: { shielding },
      mission: { sol, environmentalEvent: missionTelemetry?.environmentalEvent || 'No active event', recentEvents: missionTelemetry?.recentEvents || [] },
      crew: { health: crewHealth, morale, condition: crewHealth < 30 || morale < 30 ? 'Critical' : crewHealth < 60 || morale < 60 ? 'Strained' : 'Stable' },
      warnings,
    }
  }, [counts, selected, weight, cost, powerUsed, powerBalance, lifeSupport, shielding, missionTelemetry])
  const announce = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2300) }
  const askMentor = (question = '') => {
    setMentorRequest({ id: Date.now(), question })
    setMentorOpen(true)
  }
  const loadPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    const next = Object.fromEntries(preset.modules.map(({ id, tile }) => [tile, MODULES.find((module) => module.id === id)]))
    setPlacements(next)
    setSelected(null)
    setMenuOpen(false)
    announce(`${preset.label} loaded. Explore the grid and make it your own!`)
  }
  const placeModule = (index, moduleId) => {
    const module = MODULES.find((item) => item.id === moduleId)
    if (!module) return
    if (placements[index]) { announce('That spot is already taken. Choose an empty tile!'); return }
    const nextWeight = weight + module.weight
    const nextCost = cost + module.cost
    if (nextWeight > LIMIT_KG) { announce('That module would put your payload over the 10,000 kg limit!'); return }
    if (nextCost > LIMIT_COST) { announce('That module would put you over the $100M budget!'); return }
    setPlacements((current) => ({ ...current, [index]: module }))
    if (!seenFacts.current.has(moduleId)) {
      seenFacts.current.add(moduleId)
      setFactToast({ moduleId, name: module.name, fact: NASA_FACTS[moduleId] })
    }
    setSelected(null)
  }
  const removeModule = (index) => {
    setPlacements((current) => { const next = { ...current }; delete next[index]; return next })
  }
  const selectModule = (moduleId) => {
    setSelected((current) => current === moduleId ? null : moduleId)
    setMenuOpen(false)
  }
  const dropOnTile = (event, index) => {
    event.preventDefault()
    const moduleId = event.dataTransfer.getData('moduleId') || dragging
    if (moduleId) placeModule(index, moduleId)
    setDragging(null)
  }

  return (
    <main className="app-shell" onClickCapture={(event) => { if (event.target.closest('button:not(.mute-toggle), select, .terrain-cell')) playSound('click') }}>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-mark"><Rocket size={19} strokeWidth={2.5} /></div>
        <div className="brand-copy"><div className="brand-kicker">NASA SPACE APPS CHALLENGE <span>·</span> MISSION 01</div><h1>Space Plate <i>&</i> Shielding Builder <span className="title-divider">/</span> <em>Mars Outpost</em></h1></div>
        <div className="topbar-right">
          <label className="preset-select-wrap"><span>LOAD SAMPLE ROCKET</span><select defaultValue="" onChange={(event) => { loadPreset(event.target.value); event.target.value = '' }} aria-label="Load sample rocket"><option value="" disabled>Choose a blueprint…</option><option value="science">Heavy Science Base</option><option value="balanced">Balanced Explorer</option></select></label>
          <div className="mission-pill"><span className="live-dot" /> MISSION CONTROL <ChevronDown size={13} /></div>
          <button className="mentor-header-button" onClick={() => askMentor()}><Bot size={15} /> AI Mentor</button>
          <button className="mute-toggle" onClick={() => setMuted((current) => !current)} title={muted ? 'Turn sound on' : 'Mute sounds'} aria-label={muted ? 'Turn sound on' : 'Mute sounds'}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
          <button className="help-button" title="Mission guide"><CircleHelp size={18} /></button>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle module palette"><Menu size={20} /></button>
        </div>
      </header>

      <section className="dashboard" aria-label="Mission status">
        <div className="dashboard-label"><span className="orbit-dot" /> OUTPOST STATUS</div>
        <div className="metric mass-metric">
          <div className="metric-icon mass-icon"><ArrowDownToLine size={17} /></div>
          <div className="metric-body"><div className="metric-label">PAYLOAD MASS <span className="limit-note">/ 10,000 kg MAX</span></div><div className="metric-value"><strong className={weightOver ? 'danger-text' : ''}>{format(weight)}</strong><span> / 10,000 kg</span>{weightOver && <button className="why-button counter-why" onClick={() => askMentor('Why is my payload over the 10,000 kg limit?')}>Why?</button>}</div><div className="mass-track"><div className={`mass-fill ${weightOver ? 'over' : ''}`} style={{ width: `${percent}%` }} /></div></div>
        </div>
        <div className="metric-divider" />
        <div className="metric budget-metric">
          <div className="metric-icon budget-icon"><Coins size={17} /></div>
          <div className="metric-body"><div className="metric-label">MISSION BUDGET <span className="limit-note">/ $100M MAX</span></div><div className="metric-value"><strong className={costOver ? 'danger-text' : ''}>${cost}</strong><span> / $100M</span></div><div className="budget-caption"><span className="budget-dot" /> {costOver ? 'Budget exceeded' : `$${LIMIT_COST - cost}M remaining`} {costOver && <button className="why-button counter-why" onClick={() => askMentor('Why am I over the $100M mission budget?')}>Why?</button>}</div></div>
        </div>
        <div className="dashboard-spacer" />
        <div className="crew-status"><div className="crew-avatars"><span>👩‍🚀</span><span>👨‍🚀</span><span>👩‍🚀</span></div><div><div className="crew-label">CREW READINESS</div><div className={`crew-value ${hasCrew ? 'ready' : ''}`}><span className="readiness-dot" /> {hasCrew ? 'HABITAT SECURED' : 'AWAITING HABITAT'}</div></div></div>
      </section>

      <div className={`workspace ${menuOpen ? 'palette-open' : ''}`}>
        <aside className="sidebar">
          <div className="sidebar-header"><div><div className="section-eyebrow">OUTPOST LOADOUT</div><h2>Build your base<span className="heading-star">✳</span></h2></div><span className="module-count">{placed.length}<span> / 16</span></span></div>
          <p className="sidebar-hint">Pick a module, then choose a landing tile.</p>
          <div className="module-list">
            {MODULES.map((module) => {
              const Icon = module.icon
              const BadgeIcon = module.badgeIcon
              return <button key={module.id} className={`module-card ${selected === module.id ? 'selected' : ''} ${module.tint}`} onClick={() => selectModule(module.id)} draggable onDragStart={(event) => { setDragging(module.id); event.dataTransfer.setData('moduleId', module.id); event.dataTransfer.effectAllowed = 'copy' }} onDragEnd={() => setDragging(null)}>
                <div className="module-card-top"><span className="module-icon"><Icon size={19} strokeWidth={1.9} /></span><span className="module-quantity">×{counts[module.id] || 0}</span></div>
                <div className="module-name-row"><span className="module-name">{module.name}</span>{module.badge && <span className="required-badge"><BadgeIcon size={10} fill="currentColor" /> {module.badge}</span>}</div>
                <p className="module-description">{module.desc}</p>
                <div className="module-meta"><span><ArrowDownToLine size={11} /> {format(module.weight)} kg</span><span><Coins size={11} /> ${module.cost}M</span></div>
              </button>
            })}
          </div>
          <div className="drag-tip"><span className="tip-spark">✳</span><span><b>Pro tip</b> — drag a module onto the landing zone, or tap to select.</span></div>
        </aside>

        <section className="build-area" aria-label="Mars habitat building grid">
          <div className="build-heading"><div><div className="section-eyebrow"><span className="location-dot" /> ELYSIUM PLANITIA <span className="coord">18.65° N / 133.8° E</span></div><h2>Your Martian landing zone</h2></div><div className="grid-legend"><span><i className="legend-empty" /> OPEN TILE</span><span><i className="legend-occupied" /> MODULE PLACED</span></div></div>
          <div className="terrain-frame"><div className="terrain-topline"><span><span className="terrain-led" /> SURFACE MAP <b>·</b> ZONE 01</span><span className="terrain-weather"><Sun size={13} /> CLEAR SKIES <b>−63°C</b></span></div>
            <div className="terrain-scene"><div className="horizon-glow" /><div className="planet-disc" /><div className="distant-ridge ridge-one" /><div className="distant-ridge ridge-two" /><div className="rock rock-one" /><div className="rock rock-two" /><div className="rock rock-three" /><div className="rock rock-four" /><div className="terrain-grid">
              {GRID.map((tile, index) => {
                const module = placements[index]
                const Icon = module?.icon || tile.icon
                const hasBonus = module?.id === 'shield' && placedEntries.some((entry) => entry.module.id === 'crew' && ADJACENT({ row: Math.floor(index / 4), col: index % 4 }, entry))
                return <div key={index} className={`terrain-cell ${module ? `occupied ${module.tint}` : `empty ${tile.color}`} ${hasBonus ? 'bonus-shield' : ''} ${selected && !module ? 'placeable' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOnTile(event, index)} onClick={() => module ? undefined : selected && placeModule(index, selected)} role="button" tabIndex={0} title={hasBonus ? 'Shielding bonus! Martian soil piled beside living quarters helps block space radiation. +15% shielding.' : undefined} aria-label={module ? `${module.name}, tile ${index + 1}${hasBonus ? ', plus 15 percent adjacency shielding bonus' : ''}` : `Empty tile ${index + 1}, ${tile.label}${selected ? ', place selected module' : ''}`} onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && selected && !module) placeModule(index, selected) }}>
                  {module ? <><div className="placed-icon"><Icon size={19} /></div><span className="placed-name">{module.name}</span><span className="placed-mass">{format(module.weight)} KG</span>{hasBonus && <span className="bonus-chip"><Sparkles size={9} /> +15% BONUS</span>}<button className="remove-tile" title={`Remove ${module.name}`} aria-label={`Remove ${module.name}`} onClick={(event) => { event.stopPropagation(); removeModule(index) }}><X size={12} /></button></> : <><span className="cell-plus"><Plus size={15} /></span><span className="cell-number">{String(index + 1).padStart(2, '0')}</span></>}
                </div>
              })}
            </div></div>
            <div className="terrain-footer"><span><span className="footer-pulse" /> ALL SYSTEMS NOMINAL</span><span>LANDING ZONE GRID <b>04 × 04</b></span><span>SECTOR <b>OLYMPUS MONS</b></span></div>
          </div>
          <div className="stage-bottom"><div className="stage-note"><span className="note-icon"><CloudSun size={16} /></span><span><b>Watch the skies, explorer!</b> Solar power dips during dust storms. A reactor keeps your lights on.</span></div><div className="tile-count"><span>{Object.keys(placements).length}</span> / 16 TILES USED</div></div>
        </section>

        <aside className="readiness-panel" aria-label="Live outpost readiness">
          <div className="readiness-header"><div><div className="section-eyebrow">LIVE ENGINEERING</div><h2>Outpost readiness</h2></div><span className="live-tag"><i /> LIVE</span></div>
          <p className="readiness-intro">Your build updates these mission systems in real time.</p>
          <div className={`power-card ${powerBalance < 0 ? 'power-warning' : ''}`}>
            <div className="readiness-row"><span className="readiness-icon power-color"><Zap size={16} /></span><div className="readiness-name">Power balance <span className="info-tip" title="Generated power minus the power used by the farm and water recycler."><Info size={12} /></span></div>{powerBalance < 0 && <><span className="warning-badge"><TriangleAlert size={11} /> LOW</span><button className="why-button" onClick={() => askMentor('Why is my power system failing?')}>Why?</button></>}</div>
            <div className={`power-number ${powerBalance < 0 ? 'negative' : ''}`}>{powerBalance > 0 ? '+' : ''}{powerBalance}<small> power / day</small></div>
            <div className="power-equation"><span>☼ {solarPower + reactorPower} generated</span><span>− {powerUsed} used</span></div>
          </div>
          <div className="readiness-meters">
            <ReadinessMeter icon={Droplets} title="Life support" detail="Food · water · oxygen" value={lifeSupport} tone="life" tip="Hydroponic Farms add food and oxygen. Water Recyclers add water support." warning={lifeSupport < 100 ? 'Why is life support low?' : ''} onWhy={askMentor} />
            <ReadinessMeter icon={Radiation} title="Radiation shielding" detail={shielding === 100 ? 'STORM-PROOF' : shielding >= 50 ? 'MODERATE' : 'DANGER'} value={shielding} tone="shield" tip="Each Regolith Shield adds 50%. Two shields reach full storm protection; adjacency adds a 15% bonus, capped at 100%." warning={shielding < 50 ? 'Should I install more radiation shielding?' : ''} onWhy={askMentor} />
            <ReadinessMeter icon={HeartPulse} title="Crew health & morale" detail="Fitness · happiness" value={crewWellbeing} tone="crew" tip="A Zero-G Gym adds 55%. The Snack & Entertainment Vault adds 45%." warning={crewWellbeing < 100 ? 'How can I improve crew health and morale?' : ''} onWhy={askMentor} />
          </div>
          <div className="readiness-footnote"><Info size={12} /> These are simplified learning meters, not mission engineering specs.</div>
          {nearbyShieldBonus && <div className="bonus-note"><Sparkles size={14} /><span><b>Smart shielding!</b> Piling Martian soil beside crew quarters helps block space radiation.</span></div>}
        </aside>
      </div>

      <footer className="action-bar"><div className="launch-checks"><span className="check-title">PRE-FLIGHT CHECK</span><span className={hasCrew ? 'check-pass' : 'check-pending'}>{hasCrew ? <Check size={13} /> : <span className="empty-check" />} Crew quarters</span><span className={!weightOver ? 'check-pass' : 'check-pending'}>{!weightOver ? <Check size={13} /> : <span className="empty-check" />} Mass limit</span><span className={!costOver ? 'check-pass' : 'check-pending'}>{!costOver ? <Check size={13} /> : <span className="empty-check" />} Budget</span></div><button className={`launch-button ${canLaunch ? 'ready' : ''}`} disabled={!canLaunch} onClick={() => { playSound('launch'); setShowLaunch(true) }}><Rocket size={18} /> LAUNCH & RUN 30-DAY SIMULATION <span className="launch-arrow">↗</span></button><div className="launch-caption">{canLaunch ? 'Your outpost is ready for liftoff' : !hasCrew ? 'Add Crew Quarters to prepare your outpost' : 'Adjust your loadout to meet mission limits'}</div></footer>

      {selected && <div className="selection-tray"><div className="tray-info"><span className="tray-pulse" /><span>MODULE SELECTED <b>·</b> Choose an empty tile</span></div><button onClick={() => setSelected(null)}><X size={14} /> CANCEL</button></div>}
      {toast && <div className="toast-message"><CircleHelp size={16} /> {toast}</div>}
      {factToast && <div className="fact-toast" role="status"><div className="fact-icon"><Star size={16} fill="currentColor" /></div><div className="fact-copy"><div className="fact-title">NASA FACT <span>·</span> {factToast.name}</div><p>{factToast.fact}</p></div><button className="fact-close" onClick={() => setFactToast(null)} aria-label="Dismiss NASA fact"><X size={16} /></button></div>}
      {showLaunch && <SimulationOverlay counts={counts} shielding={shielding} onClose={() => setShowLaunch(false)} onReset={() => { setPlacements({}); setShowLaunch(false) }} playSound={playSound} onAskMentor={askMentor} onTelemetry={setMissionTelemetry} />}
      <MentorPanel open={mentorOpen} onOpen={() => setMentorOpen(true)} onClose={() => setMentorOpen(false)} request={mentorRequest} state={mentorSnapshot} />
    </main>
  )
}

function ReadinessMeter({ icon: Icon, title, detail, value, tone, tip, warning, onWhy }) {
  return <div className={`readiness-meter ${tone}`} title={tip}>
    <div className="readiness-row"><span className="readiness-icon"><Icon size={15} /></span><span className="readiness-name">{title}</span><span className="meter-info" aria-label={tip}><Info size={12} /></span></div>
    <div className="meter-detail">{detail}{warning && <button className="why-button meter-why" title={warning} onClick={() => onWhy(warning)}>Why?</button>}</div>
    <div className="meter-value-row"><div className="readiness-track"><div className="readiness-fill" style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>
  </div>
}

const clampBar = (value) => Math.max(0, Math.min(100, Math.round(value)))

function SimulationOverlay({ counts, shielding, onClose, onReset, playSound, onAskMentor, onTelemetry }) {
  const [sol, setSol] = useState(1)
  const [survival, setSurvival] = useState({ power: 100, life: 100, health: 100, morale: 100 })
  const [minimums, setMinimums] = useState({ power: 100, life: 100, health: 100, morale: 100 })
  const [paused, setPaused] = useState(false)
  const [fast, setFast] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [event, setEvent] = useState(null)
  const [events, setEvents] = useState([])
  const [outcome, setOutcome] = useState(null)
  const modulePowerDemand = counts.farm * 20 + counts.recycler * 15
  const powerDemand = modulePowerDemand || (counts.solar + counts.reactor === 0 ? 10 : 0)
  const hasLifeSupport = counts.farm > 0 || counts.recycler > 0

  useEffect(() => {
    const environmentalEvent = sol >= 8 && sol <= 12
      ? 'Global Martian Dust Storm: solar output reduced by 70%'
      : event?.title || 'No active event'
    const health = survival.health
    const morale = survival.morale
    onTelemetry({ sol, survival, environmentalEvent, recentEvents: events, crewCondition: health < 30 || morale < 30 ? 'Critical' : health < 60 || morale < 60 ? 'Strained' : 'Stable' })
  }, [sol, survival, event, events, onTelemetry])

  useEffect(() => {
    if (countdown <= 0) return undefined
    const timer = window.setTimeout(() => {
      playSound('countdown')
      setCountdown((current) => current - 1)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [countdown, playSound])

  useEffect(() => {
    if (event?.type === 'flare' && shielding < 50) playSound('alarm')
  }, [event, shielding, playSound])

  useEffect(() => {
    if (outcome?.type === 'complete') playSound('victory')
    if (outcome?.type === 'abort') playSound('alarm')
  }, [outcome, playSound])

  useEffect(() => {
    if (countdown > 0 || paused || outcome) return undefined
    const timer = window.setTimeout(() => {
      const nextSol = sol + 1
      const inStorm = nextSol >= 8 && nextSol <= 12
      const solarOutput = counts.solar * 40 * (inStorm ? 0.3 : 1)
      const powerOutput = solarOutput + counts.reactor * 90
      const powerGap = powerDemand - powerOutput
      const delta = {
        power: powerGap > 0 ? -Math.max(3, powerGap * (inStorm ? 0.62 : 0.48)) : powerOutput > powerDemand ? 2 : 0,
        life: hasLifeSupport ? 0 : -4,
        health: survival.life <= 15 ? -4 : 0,
        morale: counts.snacks > 0 ? 0 : -1,
      }
      if (inStorm && powerGap > 0) delta.life -= 15

      let crisis = null
      if (nextSol === 8) {
        crisis = { type: 'storm', title: 'GLOBAL MARTIAN DUST STORM', icon: CloudSun,
          text: counts.solar > 0 ? 'Solar output is down 70% through Sol 12.' : 'Dust blankets the landing zone for five sols. Your reactor is unaffected.',
          result: powerGap > 0 ? 'Power reserves are falling; life support is drawing emergency energy.' : 'Reactor or spare power is carrying the outpost through the storm.' }
      }
      if (nextSol === 16) {
        const damage = shielding < 50 ? 60 : 0
        delta.health -= damage
        crisis = { type: 'flare', title: 'MASSIVE SOLAR FLARE', icon: Radiation,
          text: shielding < 50 ? `Only ${shielding}% shielding! The crew takes 60 health damage.` : `${shielding}% shielding holds. The crew rides out the radiation wave safely.`,
          result: shielding < 50 ? 'Radiation alarm: crew health has dropped sharply.' : 'Regolith shielding protected the habitat.' }
      }
      if (nextSol === 23) {
        const healthDamage = counts.gym > 0 ? 0 : 40
        const moraleDamage = counts.snacks > 0 ? 0 : 40
        delta.health -= healthDamage
        delta.morale -= moraleDamage
        crisis = { type: 'crew', title: 'MUSCLE DRAIN & CABIN FEVER', icon: HeartPulse,
          text: `${counts.gym ? 'The gym keeps muscles strong.' : 'No gym: crew health −40.'} ${counts.snacks ? 'Crew games lift spirits.' : 'No snack vault: morale −40.'}`,
          result: healthDamage + moraleDamage > 0 ? 'Crew wellness took a hit. Check health and morale.' : 'Gym time and crew treats keep everyone feeling strong.' }
      }

      const nextBars = {
        power: clampBar(survival.power + delta.power),
        life: clampBar(survival.life + delta.life),
        health: clampBar(survival.health + delta.health),
        morale: clampBar(survival.morale + delta.morale),
      }
      setSol(nextSol)
      setSurvival(nextBars)
      setMinimums((current) => Object.fromEntries(Object.keys(current).map((key) => [key, Math.min(current[key], nextBars[key])])))
      if (crisis) {
        setEvent(crisis)
        setEvents((current) => [...current, `Sol ${nextSol}: ${crisis.title} — ${crisis.result}`].slice(-4))
      }
      const failed = Object.entries(nextBars).find(([, value]) => value <= 0)
      if (failed) {
        const reasons = {
          power: 'Power reserves reached 0%. The habitat lost electricity and life-support systems shut down.',
          life: 'Oxygen and water reserves reached 0%. The crew could no longer breathe or stay hydrated.',
          health: 'Crew health reached 0%. The astronauts need emergency medical evacuation.',
          morale: 'Crew morale reached 0%. Isolation and stress overwhelmed the crew.',
        }
        setOutcome({ type: 'abort', reason: reasons[failed[0]], sol: nextSol, minimums: Object.fromEntries(Object.keys(minimums).map((key) => [key, Math.min(minimums[key], nextBars[key])])) })
      } else if (nextSol >= 30) setOutcome({ type: 'complete', sol: 30, minimums: Object.fromEntries(Object.keys(minimums).map((key) => [key, Math.min(minimums[key], nextBars[key])])) })
    }, fast ? 210 : 450)
    return () => window.clearTimeout(timer)
  }, [sol, survival, paused, fast, outcome, counts, shielding, powerDemand, hasLifeSupport, countdown, minimums])

  const progress = Math.min(((sol - 1) / 29) * 100, 100)
  const bars = [
    { key: 'power', label: 'POWER', icon: Zap, color: 'power' },
    { key: 'life', label: 'OXYGEN / WATER', icon: Droplets, color: 'life' },
    { key: 'health', label: 'CREW HEALTH', icon: HeartPulse, color: 'health' },
    { key: 'morale', label: 'MORALE', icon: Sparkles, color: 'morale' },
  ]
  const EventIcon = event?.icon || AlarmClock
  const debrief = outcome && <MissionDebrief outcome={outcome} counts={counts} shielding={shielding} survival={survival} onModify={onClose} onReset={onReset} />

  return <div className={`simulation-overlay ${outcome?.type === 'abort' ? 'aborted' : ''}`} role="dialog" aria-modal="true" aria-label="30-day Mars simulation">
    <div className="simulation-stars" />
    <header className="sim-topbar"><div className="sim-brand"><span className="sim-brand-icon"><Orbit size={19} /></span><div><div className="sim-eyebrow">NASA SPACE APPS · LIVE SIMULATION</div><b>30-Day Mars Outpost Mission</b></div></div><div className="sim-top-actions"><button className="sim-mentor-button" onClick={() => onAskMentor()}><Bot size={14} /> ASK MENTOR</button><div className="sim-live"><i /> {outcome?.type === 'abort' ? 'MISSION ABORTED' : outcome?.type === 'complete' ? 'MISSION COMPLETE' : paused ? 'SIMULATION PAUSED' : countdown > 0 ? 'LAUNCH COUNTDOWN' : 'SIMULATION LIVE'}</div></div></header>
    {debrief || (countdown > 0 ? <div className="countdown-overlay"><div className="countdown-ring">{countdown}</div><div className="sim-eyebrow">CREW SEALED · LAUNCH SEQUENCE</div><p>Preparing the outpost for Sol 1</p></div>
      : <div className="sim-content">
        <section className="sim-main">
          <div className="sim-day-label"><span className="sim-day-dot" /> MISSION ELAPSED <span>·</span> SOL {String(sol).padStart(2, '0')} <span className="sol-of">/ 30</span></div>
          <div className="sim-progress"><div className="sim-progress-fill" style={{ width: `${progress}%` }} /><span className="progress-spark" style={{ left: `${progress}%` }}>✦</span></div>
          <div className="sol-markers"><span>SOL 1</span><span>SOL 8 <i>STORM</i></span><span>SOL 16 <i>FLARE</i></span><span>SOL 23 <i>CREW</i></span><span>SOL 30</span></div>
          <div className="sim-scene"><div className="sim-sun" /><div className={`sim-mars-landscape ${event?.type === 'storm' && sol <= 12 ? 'stormy' : ''}`} /><div className="sim-habitat"><div className="habitat-dome" /><div className="habitat-tunnel" /><div className="habitat-module" /><div className="habitat-light" /></div><div className="scene-ground" /><div className="scene-caption"><span><span className="scene-pin" /> ELYSIUM PLANITIA</span><span>LOCAL TIME 14:32 <b>·</b> −63°C</span></div></div>
          <div className="sim-controls"><div className="sim-clock"><AlarmClock size={15} /><span>1 SOL</span><i>≈ 1.03 Earth days</i></div><div className="sim-control-buttons"><button onClick={() => setPaused(!paused)} className="sim-control-button">{paused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />} {paused ? 'RESUME' : 'PAUSE'}</button><button onClick={() => setFast(!fast)} className={`sim-control-button ${fast ? 'active' : ''}`}><FastForward size={14} /> {fast ? '2× SPEED' : '1× SPEED'}</button></div></div>
          {event && <div key={event.type} className={`crisis-card ${event.type} ${event.type === 'flare' && shielding < 50 ? 'alarm' : ''}`}><div className="crisis-icon"><EventIcon size={18} /></div><div className="crisis-copy"><div className="crisis-title">{event.title}</div><p>{event.text}</p><small>{event.result}</small></div><span className="crisis-sol">SOL {String(sol).padStart(2, '0')}</span></div>}
        </section>
        <aside className="survival-panel"><div className="survival-heading"><div><div className="sim-eyebrow">HABITAT TELEMETRY</div><h2>Crew survival</h2></div><span className="telemetry-live"><i /> LIVE</span></div><p className="survival-caption">Keep every system above zero to bring your crew home.</p>
          {bars.map(({ key, label, icon: Icon, color }) => <div key={key} className={`survival-meter ${color} ${survival[key] <= 25 ? 'critical' : ''}`}><div className="survival-meter-head"><span className="survival-icon"><Icon size={16} /></span><span className="survival-name">{label}</span><strong>{survival[key]}<small>%</small></strong></div><div className="survival-track"><div className="survival-fill" style={{ width: `${survival[key]}%` }} /></div><div className="survival-meter-note">{survival[key] > 70 ? 'NOMINAL' : survival[key] > 30 ? 'RESERVES FALLING' : survival[key] > 0 ? 'CRITICAL' : 'FAILED'}</div></div>)}
          <div className="mission-plan"><div className="sim-eyebrow">YOUR OUTPOST</div><div><span>Solar arrays</span><b>{counts.solar}</b></div><div><span>Nuclear reactor</span><b>{counts.reactor ? 'ONLINE' : 'NONE'}</b></div><div><span>Shielding</span><b>{shielding}%</b></div><div><span>Gym / Snack vault</span><b>{counts.gym ? 'GYM' : '—'} / {counts.snacks ? 'SNACKS' : '—'}</b></div></div>
        </aside>
      </div>)}
  </div>
}

function MissionDebrief({ outcome, counts, shielding, survival, onModify, onReset }) {
  const aborted = outcome.type === 'abort'
  const statsStayedStrong = Object.values(outcome.minimums).every((value) => value > 70)
  const rank = aborted ? 'Trainee — Try Again' : statsStayedStrong ? 'Gold Artemis Commander' : 'Silver Flight Engineer'
  const RankIcon = aborted ? Radiation : Award
  const reachedFlare = outcome.sol >= 16
  const reachedStorm = outcome.sol >= 8
  const reachedCrewEvent = outcome.sol >= 23
  const tradeoffs = [
    shielding >= 50
      ? `Great shielding design: your ${shielding}% Regolith protection guarded the crew during the Sol 16 solar flare.`
      : reachedFlare ? `Trade-off: ${shielding}% shielding left the crew exposed at Sol 16; radiation reduced crew health by 60 points.` : `Trade-off: ${shielding}% shielding would leave the crew exposed to the Sol 16 solar flare.`,
    counts.reactor > 0
      ? 'Your Nuclear Micro-Reactor kept generating power through the five-sol dust storm.'
      : counts.solar > 0
        ? reachedStorm ? `Your ${counts.solar} Solar Array${counts.solar > 1 ? 's' : ''} lost 70% output during the Sol 8 storm, so stored power had to carry the habitat.` : `Your Solar Arrays would lose 70% output during the five-sol dust storm.`
        : 'Without a power generator, the habitat had no way to replenish its energy reserves.',
    `${counts.gym ? 'The Zero-G Gym helped protect crew strength.' : reachedCrewEvent ? 'Skipping the Zero-G Gym cost 40 crew-health points at Sol 23.' : 'A Zero-G Gym would help protect crew strength at Sol 23.'} ${counts.snacks ? 'The Snack Vault supported morale.' : reachedCrewEvent ? 'Skipping the Snack Vault cost 40 morale points at Sol 23.' : 'A Snack Vault would help crew morale at Sol 23.'}`,
  ]
  return <section className={`mission-debrief ${aborted ? 'debrief-loss' : statsStayedStrong ? 'debrief-win rank-gold' : 'debrief-win rank-silver'}`}>
    <div className="debrief-orbit orbit-a" /><div className="debrief-orbit orbit-b" />
    <div className="debrief-content">
      <div className="debrief-rank"><div className="rank-medal"><RankIcon size={31} /></div><div className="rank-copy"><div className="sim-eyebrow">MISSION DEBRIEF · SOL {String(outcome.sol).padStart(2, '0')}</div><h1>{rank}</h1><p>{aborted ? 'The crew was evacuated safely. Review your design and try another blueprint.' : statsStayedStrong ? 'Every survival system stayed above 70%. Outstanding mission planning!' : 'Your crew made it through 30 sols. Review the trade-offs and see how to improve.'}</p></div></div>
      {aborted && <div className="debrief-abort-reason" role="alert"><TriangleAlert size={18} /><span><b>MISSION ABORTED — EMERGENCY EVACUATION</b><small>Halted at Sol {outcome.sol}: {outcome.reason}</small></span></div>}
      <div className="debrief-stats">{[
        ['POWER', survival.power, Zap], ['OXYGEN / WATER', survival.life, Droplets], ['CREW HEALTH', survival.health, HeartPulse], ['MORALE', survival.morale, Sparkles],
      ].map(([label, value, Icon]) => <div key={label} className="debrief-stat"><Icon size={15} /><span>{label}</span><b>{value}%</b></div>)}</div>
      <div className="tradeoff-panel"><div className="tradeoff-heading"><span><FlaskConical size={15} /></span><div><div className="sim-eyebrow">ENGINEERING REVIEW</div><h2>What your design taught us</h2></div></div><ul>{tradeoffs.map((point, index) => <li key={index} className={point.startsWith('Trade-off') || point.startsWith('Skipping') || point.startsWith('Without') ? 'tradeoff-warning' : ''}><span className="tradeoff-bullet">{point.startsWith('Trade-off') || point.startsWith('Skipping') || point.startsWith('Without') ? <CircleX size={15} /> : <CircleCheck size={15} />}</span><span>{point}</span></li>)}</ul></div>
      <div className="debrief-actions"><button className="debrief-primary" onClick={onModify}><RotateCcw size={16} /> MODIFY BASE DESIGN</button><button className="debrief-reset" onClick={onReset}><Trash2 size={15} /> RESET EMPTY GRID</button></div>
      <div className="debrief-footnote">Your layout stays on the grid when you modify your design.</div>
    </div>
  </section>
}

function MentorPanel({ open, onOpen, onClose, request, state }) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi, explorer! I can help you understand your habitat systems and mission trade-offs. I’ll use your current build and won’t change it.' }])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [source, setSource] = useState('')
  const [notice, setNotice] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    if (request?.question) setDraft(request.question)
  }, [request?.id])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [messages, busy])

  const sendQuestion = async (question) => {
    const clean = String(question || '').trim().slice(0, 500)
    if (!clean || busy) return
    setDraft('')
    setMessages((current) => [...current, { role: 'user', text: clean }])
    setBusy(true)
    setNotice('')
    let reply
    let responseSource = 'fallback'
    let responseNotice = ''
    try {
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean, state, history: messages.slice(-8).map(({ role, text }) => ({ role, text })) }),
        signal: AbortSignal.timeout(28_000),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Mentor request failed')
      reply = payload.reply
      responseSource = payload.source || 'fallback'
      responseNotice = payload.notice || ''
    } catch {
      reply = buildMentorFallback(clean, state)
      responseSource = 'fallback'
      responseNotice = 'The AI service is offline, so this answer uses the built-in engineering guide.'
    }
    setMessages((current) => [...current, { role: 'assistant', text: reply || buildMentorFallback(clean, state), source: responseSource }])
    setSource(responseSource)
    setNotice(responseNotice)
    setBusy(false)
  }

  const submit = (event) => {
    event.preventDefault()
    sendQuestion(draft)
  }

  const suggestions = [
    'Should I install more radiation shielding?',
    'Why is my power system failing?',
    'What should I do during a dust storm?',
    'Why do astronauts need exercise equipment?',
  ]

  return <>
    {!open && <button className="mentor-fab" onClick={onOpen} aria-label="Open AI Engineering Mentor"><Bot size={18} /><span>ASK MENTOR</span><i /></button>}
    <aside className={`mentor-panel ${open ? 'open' : ''}`} aria-label="AI Engineering Mentor" aria-hidden={!open}>
      <div className="mentor-heading"><div className="mentor-avatar"><Bot size={19} /></div><div className="mentor-title"><div><span className="mentor-live-dot" /> ENGINEERING MENTOR</div><h2>Mission Guide</h2></div><button className="mentor-close" onClick={onClose} aria-label="Close mentor"><X size={17} /></button></div>
      <div className="mentor-context"><span><Orbit size={12} /> {state?.mission?.sol ? `SOL ${state.mission.sol}` : 'OUTPOST BUILD'}</span><span>{state?.modules?.counts ? Object.values(state.modules.counts).reduce((a, b) => a + b, 0) : 0} MODULES</span></div>
      <div className="mentor-messages" aria-live="polite">
        {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`mentor-message ${message.role}`}><div className="mentor-message-avatar">{message.role === 'assistant' ? <Bot size={13} /> : 'YOU'}</div><div className="mentor-message-body"><p>{message.text}</p>{message.role === 'assistant' && message.source && <span className="message-source">{message.source === 'openai' ? 'AI ENGINEERING MENTOR' : 'BUILT-IN ENGINEERING GUIDE'}</span>}</div></div>)}
        {busy && <div className="mentor-message assistant"><div className="mentor-message-avatar"><Bot size={13} /></div><div className="mentor-thinking"><span /><span /><span /></div></div>}
        <div ref={endRef} />
      </div>
      {notice && <div className="mentor-notice"><Lightbulb size={13} /> {notice}</div>}
      {messages.length === 1 && <div className="mentor-suggestions"><div className="suggestion-label"><Lightbulb size={12} /> TRY ASKING</div>{suggestions.map((suggestion) => <button key={suggestion} onClick={() => setDraft(suggestion)}><ChevronRight size={12} /> {suggestion}</button>)}</div>}
      <div className="mentor-state-card"><div className="mentor-state-title">LIVE HABITAT SNAPSHOT <span>{source === 'openai' ? 'AI' : 'READ ONLY'}</span></div><div className="mentor-state-grid"><span>Payload</span><b>{state.payload.usedKg.toLocaleString()} / {state.payload.limitKg.toLocaleString()} kg</b><span>Budget left</span><b>${state.budget.remainingM}M</b><span>Power balance</span><b className={state.power.balance < 0 ? 'mentor-bad' : ''}>{state.power.balance > 0 ? '+' : ''}{state.power.balance} / day</b><span>Shielding</span><b>{state.radiation.shielding}%</b><span>Water / O₂</span><b>{state.lifeSupport.water}% / {state.lifeSupport.oxygen}%</b></div></div>
      <form className="mentor-input-row" onSubmit={submit}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event) } }} placeholder="Ask about your habitat…" maxLength={500} rows={2} aria-label="Ask the engineering mentor"/><button type="submit" disabled={busy || !draft.trim()} aria-label="Send question"><Send size={16} /></button></form>
      <div className="mentor-privacy">Advice only · Your build is never changed by the mentor.</div>
    </aside>
    {open && <button className="mentor-dismiss-layer" onClick={onClose} aria-label="Close mentor panel" />}
  </>
}

