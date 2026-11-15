import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDownToLine, Atom, BatteryCharging, Check, ChevronDown, CircleHelp, CloudSun,
  Coins, Dumbbell, FlaskConical, Heart, Leaf, Menu, Minus, Moon, Orbit, Plus,
  Rocket, Shield, Sparkles, Sun, TentTree, Trash2, Waves, X,
} from 'lucide-react'
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

function App() {
  const [placements, setPlacements] = useState({})
  const [selected, setSelected] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [toast, setToast] = useState('')
  const [showLaunch, setShowLaunch] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const placed = Object.values(placements)
  const weight = placed.reduce((sum, part) => sum + part.weight, 0)
  const cost = placed.reduce((sum, part) => sum + part.cost, 0)
  const hasCrew = placed.some((part) => part.id === 'crew')
  const percent = Math.min(weight / LIMIT_KG * 100, 100)
  const weightOver = weight > LIMIT_KG
  const costOver = cost > LIMIT_COST
  const canLaunch = hasCrew && !weightOver && !costOver
  const counts = useMemo(() => MODULES.reduce((map, module) => {
    map[module.id] = placed.filter((part) => part.id === module.id).length
    return map
  }, {}), [placements])

  const announce = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2300) }
  const placeModule = (index, moduleId) => {
    const module = MODULES.find((item) => item.id === moduleId)
    if (!module) return
    if (placements[index]) { announce('That spot is already taken. Choose an empty tile!'); return }
    const nextWeight = weight + module.weight
    const nextCost = cost + module.cost
    if (nextWeight > LIMIT_KG) { announce('That module would put your payload over the 10,000 kg limit!'); return }
    if (nextCost > LIMIT_COST) { announce('That module would put you over the $100M budget!'); return }
    setPlacements((current) => ({ ...current, [index]: module }))
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
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-mark"><Rocket size={19} strokeWidth={2.5} /></div>
        <div className="brand-copy"><div className="brand-kicker">NASA SPACE APPS CHALLENGE <span>·</span> MISSION 01</div><h1>Space Plate <i>&</i> Shielding Builder <span className="title-divider">/</span> <em>Mars Outpost</em></h1></div>
        <div className="topbar-right">
          <div className="mission-pill"><span className="live-dot" /> MISSION CONTROL <ChevronDown size={13} /></div>
          <button className="help-button" title="Mission guide"><CircleHelp size={18} /></button>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle module palette"><Menu size={20} /></button>
        </div>
      </header>

      <section className="dashboard" aria-label="Mission status">
        <div className="dashboard-label"><span className="orbit-dot" /> OUTPOST STATUS</div>
        <div className="metric mass-metric">
          <div className="metric-icon mass-icon"><ArrowDownToLine size={17} /></div>
          <div className="metric-body"><div className="metric-label">PAYLOAD MASS <span className="limit-note">/ 10,000 kg MAX</span></div><div className="metric-value"><strong className={weightOver ? 'danger-text' : ''}>{format(weight)}</strong><span> / 10,000 kg</span></div><div className="mass-track"><div className={`mass-fill ${weightOver ? 'over' : ''}`} style={{ width: `${percent}%` }} /></div></div>
        </div>
        <div className="metric-divider" />
        <div className="metric budget-metric">
          <div className="metric-icon budget-icon"><Coins size={17} /></div>
          <div className="metric-body"><div className="metric-label">MISSION BUDGET <span className="limit-note">/ $100M MAX</span></div><div className="metric-value"><strong className={costOver ? 'danger-text' : ''}>${cost}</strong><span> / $100M</span></div><div className="budget-caption"><span className="budget-dot" /> {costOver ? 'Budget exceeded' : `$${LIMIT_COST - cost}M remaining`}</div></div>
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
                return <div key={index} className={`terrain-cell ${module ? `occupied ${module.tint}` : `empty ${tile.color}`} ${selected && !module ? 'placeable' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOnTile(event, index)} onClick={() => module ? undefined : selected && placeModule(index, selected)} role="button" tabIndex={0} aria-label={module ? `${module.name}, tile ${index + 1}` : `Empty tile ${index + 1}, ${tile.label}${selected ? ', place selected module' : ''}`} onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && selected && !module) placeModule(index, selected) }}>
                  {module ? <><div className="placed-icon"><Icon size={19} /></div><span className="placed-name">{module.name}</span><span className="placed-mass">{format(module.weight)} KG</span><button className="remove-tile" title={`Remove ${module.name}`} aria-label={`Remove ${module.name}`} onClick={(event) => { event.stopPropagation(); removeModule(index) }}><X size={12} /></button></> : <><span className="cell-plus"><Plus size={15} /></span><span className="cell-number">{String(index + 1).padStart(2, '0')}</span></>}
                </div>
              })}
            </div></div>
            <div className="terrain-footer"><span><span className="footer-pulse" /> ALL SYSTEMS NOMINAL</span><span>LANDING ZONE GRID <b>04 × 04</b></span><span>SECTOR <b>OLYMPUS MONS</b></span></div>
          </div>
          <div className="stage-bottom"><div className="stage-note"><span className="note-icon"><CloudSun size={16} /></span><span><b>Watch the skies, explorer!</b> Solar power dips during dust storms. A reactor keeps your lights on.</span></div><div className="tile-count"><span>{Object.keys(placements).length}</span> / 16 TILES USED</div></div>
        </section>
      </div>

      <footer className="action-bar"><div className="launch-checks"><span className="check-title">PRE-FLIGHT CHECK</span><span className={hasCrew ? 'check-pass' : 'check-pending'}>{hasCrew ? <Check size={13} /> : <span className="empty-check" />} Crew quarters</span><span className={!weightOver ? 'check-pass' : 'check-pending'}>{!weightOver ? <Check size={13} /> : <span className="empty-check" />} Mass limit</span><span className={!costOver ? 'check-pass' : 'check-pending'}>{!costOver ? <Check size={13} /> : <span className="empty-check" />} Budget</span></div><button className={`launch-button ${canLaunch ? 'ready' : ''}`} disabled={!canLaunch} onClick={() => setShowLaunch(true)}><Rocket size={18} /> LAUNCH & RUN 30-DAY SIMULATION <span className="launch-arrow">↗</span></button><div className="launch-caption">{canLaunch ? 'Your outpost is ready for liftoff' : !hasCrew ? 'Add Crew Quarters to prepare your outpost' : 'Adjust your loadout to meet mission limits'}</div></footer>

      {selected && <div className="selection-tray"><div className="tray-info"><span className="tray-pulse" /><span>MODULE SELECTED <b>·</b> Choose an empty tile</span></div><button onClick={() => setSelected(null)}><X size={14} /> CANCEL</button></div>}
      {toast && <div className="toast-message"><CircleHelp size={16} /> {toast}</div>}
      {showLaunch && <div className="modal-backdrop" onClick={() => setShowLaunch(false)}><div className="launch-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowLaunch(false)} aria-label="Close"><X size={18} /></button><div className="launch-illustration"><Rocket size={34} /><span>✦</span></div><div className="section-eyebrow">MISSION READY · ELYSIUM PLANITIA</div><h2>Ready to make Mars home?</h2><p>Your outpost is packed with <b>{format(weight)} kg</b> of gear and a <b>${cost}M</b> budget. The crew is ready for their 30-day adventure!</p><div className="modal-summary"><span><ArrowDownToLine size={15} /> {format(weight)} kg payload</span><span><Coins size={15} /> ${cost}M budget</span><span><Check size={15} /> Crew quarters secured</span></div><button className="launch-button ready modal-launch" onClick={() => { setShowLaunch(false); announce('Mission launch sequence is ready for Part 2!') }}><Rocket size={17} /> BEGIN MISSION <span className="launch-arrow">↗</span></button></div></div>}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
