import { useEffect, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertTriangle, ArrowLeft, ArrowUpRight, FastForward, Gauge, HeartPulse, Pause, Play, Radio, Shield, Sparkles, Thermometer, Zap } from 'lucide-react'
import type { PlacedModule } from '../store/constructionStore'
import { MarsConstructionScene } from '../components/MarsConstructionScene'
import { configFromBuild } from './simulationConfig'
import { SimulationEngine } from './SimulationEngine'
import { scoreMission } from './ScoringEngine'

const COLORS = { power: '#ffc274', water: '#74d6f0', oxygen: '#89e3cf', food: '#b6e28d', health: '#e8a5ac', radiation: '#ff9a76' }

export function SimulationDashboard({ placed, onClose }: { placed: PlacedModule[]; onClose: () => void }) {
  const engine = useMemo(() => new SimulationEngine(configFromBuild(placed)), [placed])
  const [, refresh] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const s = engine.state
  const crew = placed.filter(item => item.moduleId === 'crew').length * 3
  const score = scoreMission(s)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!running || s.failed || s.pending || s.sol >= 30) return
    timer.current = window.setInterval(() => { engine.step(); refresh(value => value + 1) }, 1500 / speed)
    return () => window.clearInterval(timer.current)
  }, [engine, running, speed, s.failed, s.pending, s.sol])

  const meter = (name: string, value: number, max: number, unit: string, why: string, tone: string, inverse = false) => {
    const ratio = Math.max(0, Math.min(1, value / max))
    const warning = inverse ? ratio > .7 : ratio < .22
    const historyKey: Record<string, string> = { 'BATTERY RESERVE': 'power', WATER: 'water', OXYGEN: 'oxygen', FOOD: 'food', 'CREW WELLNESS': 'health', 'RADIATION DOSE': 'radiation' }
    const points = s.history.slice(-12).map((entry, index, list) => {
      const key = historyKey[name]
      const top = Math.max(1, ...list.map(row => row[key] ?? 0))
      return `${index * (100 / Math.max(1, list.length - 1))},${28 - ((entry[key] ?? 0) / top) * 23}`
    }).join(' ')
    return <article className={`mf-resource ${warning ? 'is-warning' : ''}`} key={name} style={{ '--resource-color': tone } as React.CSSProperties}>
      <div className="mf-resource-heading"><span>{name}</span><span className="mf-resource-icon"><i /></span></div>
      <div className="mf-resource-value">{Math.round(value)}<small>{unit}</small></div>
      <div className="mf-resource-viz"><div className="mf-track"><i style={{ width: `${ratio * 100}%` }} /></div>{points && <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} /></svg>}</div>
      <p>{why}</p>
      <span className="mf-resource-state">{warning ? 'ATTENTION REQUIRED' : ratio > .72 ? 'NOMINAL MARGIN' : 'MONITORING'}</span>
    </article>
  }
  const chart = (title: string, key: string, color: string, unit: string) => <article className="mf-chart-card" key={key}>
    <div className="mf-chart-heading"><span><i style={{ background: color }} />{title}</span><small>30 SOL WINDOW</small></div>
    <div className="mf-chart"><ResponsiveContainer><AreaChart data={s.history.map(point => ({ ...point }))}>
      <defs><linearGradient id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={.34}/><stop offset="92%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
      <CartesianGrid stroke="rgba(207,222,255,.075)" vertical={false}/><XAxis dataKey="sol" stroke="#737e9c" tick={{ fontSize: 9 }} tickLine={false} axisLine={false}/><YAxis stroke="#737e9c" tick={{ fontSize: 9 }} width={34} tickLine={false} axisLine={false}/><Tooltip contentStyle={{ background: '#111829', border: '1px solid #ffffff20', borderRadius: 10, fontSize: 11 }} labelFormatter={value => `SOL ${value}`} formatter={(value) => [`${value} ${unit}`, title]}/><Area type="monotone" dataKey={key} stroke={color} strokeWidth={2} fill={`url(#fill-${key})`} isAnimationActive={false} dot={false} activeDot={{ r: 4, strokeWidth: 0 }}/>
    </AreaChart></ResponsiveContainer></div>
  </article>

  const event = s.pending
  const operatingLabel = s.sheltering ? 'Shelter active' : s.storm === 2 ? 'Planetary dust front' : s.storm ? 'Regional storm' : s.equipment < 45 ? 'Equipment degraded' : 'All systems nominal'
  return <div className="mf-app">
    <header className="mf-topbar"><div className="mf-top-inner">
      <button className="mf-back" aria-label="Return to construction" onClick={onClose}><ArrowLeft size={16}/><span>OUTPOST</span></button>
      <div className="mf-brand"><span className="mf-brand-mark"><Sparkles size={16}/></span><div><small>MISSION CONTROL / ELYSIUM</small><strong>FIELD OPERATIONS</strong></div></div>
      <div className={`mf-live ${running ? 'is-live' : ''}`}><i />{s.failed ? 'MISSION LOST' : s.sol >= 30 ? 'MISSION COMPLETE' : s.pending ? 'DECISION REQUIRED' : running ? 'LIVE TELEMETRY' : 'STANDBY'}</div>
      <div className="mf-controls"><button className="mf-abort" onClick={() => { setRunning(false); onClose() }}>ABORT</button><button className="mf-speed" aria-label="Cycle simulation speed" onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)}><FastForward size={14}/><span>{speed}×</span></button><button className="mf-run" onClick={() => setRunning(value => !value)} disabled={!!s.failed || s.sol >= 30}>{running ? <><Pause size={14}/> PAUSE</> : <><Play size={14}/>{s.sol ? 'RESUME' : 'BEGIN MISSION'}</>}</button></div>
    </div></header>

    <main className="mf-main">
      <section className="mf-title-row"><div><div className="mf-eyebrow"><span /> ARES SURFACE EXPEDITION <b>·</b> ELYSIUM PLANITIA</div><h1>{s.failed ? 'The outpost has gone silent.' : s.sol >= 30 ? 'Thirty sols. One new frontier.' : 'A home on another world.'}</h1><p>Every system is connected. Every Sol tells the story.</p></div><div className="mf-sol-card"><div className="mf-sol-orbit"><div className="mf-orbit-ring"/><span>{String(s.sol).padStart(2, '0')}</span><small>SOL</small></div><div className="mf-sol-info"><strong>MISSION DAY {s.sol} <em>/ 30</em></strong><div className="mf-sol-track">{Array.from({ length: 30 }, (_, i) => <i key={i} className={i < s.sol ? 'passed' : i === s.sol ? 'current' : ''}/>)}</div><small>{s.sol >= 30 ? 'MISSION WINDOW COMPLETE' : `${30 - s.sol} SOLS REMAINING`}</small></div></div></section>

      <section className="mf-hero-grid">
        <div className={`mf-stage ${s.storm ? 'in-storm' : ''}`}>
          <div className="mf-stage-top"><span><i className="mf-stage-dot"/>{operatingLabel.toUpperCase()}</span><span>18.65° N&nbsp; / &nbsp;133.8° E</span></div>
          <div className="mf-stage-scene"><MarsConstructionScene cameraMode="inspect" operating={{ dust: s.dust, storm: s.storm, equipment: s.equipment, sheltering: s.sheltering, cropHealth: s.cropHealth, farmMode: s.farmMode }}/></div>
          <div className="mf-stage-grid" aria-hidden="true"/><div className="mf-stage-vignette" aria-hidden="true"/>
          <div className="mf-stage-bottom"><div><small>LOCAL SURFACE CONDITIONS</small><strong>{s.storm ? 'Wind driven dust' : 'Thin atmosphere · Low pressure'}</strong></div><div className="mf-weather"><span><Thermometer size={14}/>{Math.round(s.outsideTemperature)}°<small>OUTSIDE</small></span><span><Gauge size={14}/>{Math.round(s.dust * 100)}%<small>DUST LOAD</small></span><span><Radio size={14}/>{s.storm ? 'WEAK' : 'CLEAR'}<small>UPLINK</small></span></div></div>
        </div>

        <aside className="mf-director">
          <div className="mf-director-head"><div><small>MISSION DIRECTOR</small><strong>{event ? 'Decision window' : 'Outpost status'}</strong></div><span className={event ? 'is-alert' : ''}>{event ? 'ACTION' : 'SOL  ' + String(s.sol).padStart(2, '0')}</span></div>
          {event ? <div className="mf-event-card"><div className="mf-event-label"><AlertTriangle size={14}/>{event.severity} INCIDENT {event.warningSols > 0 && <b>· {event.warningSols} SOL TO IMPACT</b>}</div><h2>{event.title}</h2><p>{event.description}</p><div className="mf-lesson"><span>ENGINEERING PRINCIPLE</span>{event.lesson}</div><div className="mf-responses">{event.actions.map((action, index) => <button key={action.id} className={index === 0 ? 'recommended' : ''} onClick={() => { engine.resolve(action.id); refresh(value => value + 1) }}><span className="mf-response-number">0{index + 1}</span><span><b>{action.label}</b><small>{action.reasoning}</small></span><ArrowUpRight size={15}/></button>)}</div></div> : <div className="mf-status-body"><div className="mf-status-orb"><div className="mf-status-core"><Activity size={25}/></div><i/><i/><i/></div><strong>{s.failed ? 'CRITICAL FAILURE' : s.sol >= 30 ? 'EXPEDITION COMPLETE' : running ? 'SYSTEMS IN MOTION' : 'AWAITING COMMAND'}</strong><p>{s.storm ? 'A dust front is suppressing your solar harvest. Storage and reactor output are carrying the habitat.' : s.water < 100 ? 'Water margin is tightening. Recovered water is buying time, but leakage still drains the reserve.' : s.food < crew * 12 ? 'Food margin is low. Crop yield depends on power, plant health, and light.' : 'Power, water, air and food are exchanging load across the habitat. The design is being tested.'}</p><div className="mf-status-metrics"><span><b>{crew.toString().padStart(2, '0')}</b><small>CREW</small></span><span><b>{s.events.length.toString().padStart(2, '0')}</b><small>INCIDENTS</small></span><span><b>{Math.round(s.health).toString().padStart(2, '0')}%</b><small>WELLNESS</small></span></div>{s.sol >= 30 && !s.failed && <div className="mf-score"><b>{score.total}</b><span><strong>{score.rank} MISSION</strong><small>DEBRIEF SCORE / GAME RATING</small></span></div>}</div>}
          <div className="mf-director-foot"><span><i/>DELAY TO EARTH: 12m 41s</span><span>SEED / 2089</span></div>
        </aside>
      </section>

      {s.failed && <section className="mf-failure"><AlertTriangle size={19}/><div><b>MISSION FAILURE · {s.failed}</b><span>Critical thresholds are based on simulated habitat conditions. Return to the build bay to redesign your outpost.</span></div><button onClick={onClose}>RETURN TO OUTPOST</button></section>}

      <section className="mf-resources-section"><div className="mf-section-heading"><div><div className="mf-eyebrow"><span/> LIFE SUPPORT TELEMETRY</div><h2>What keeps the crew alive.</h2></div><span className="mf-update-stamp"><i/>UPDATED EACH SOL</span></div>
        <div className="mf-resources-grid">{meter('BATTERY RESERVE', s.battery, 220, 'kWh', 'Daylight generation and nighttime load are balanced through storage.', COLORS.power)}{meter('WATER', s.water, 500, 'L', `Crew demand reduced by ${placed.some(item => item.moduleId === 'recycler') ? 'closed-loop recovery' : 'no recycler installed'}.`, COLORS.water)}{meter('OXYGEN', s.oxygen, 300, 'UNITS', 'Crew metabolism, plant contribution, generator output and leakage.', COLORS.oxygen)}{meter('FOOD', s.food, Math.max(1, crew * 70), 'RATIONS', 'Stored food bridges crop growth and harvest failures.', COLORS.food)}{meter('CREW WELLNESS', s.health, 100, '%', 'Hydration, nutrition, temperature, exposure and medical support.', COLORS.health)}{meter('RADIATION DOSE', s.radiation, 100, 'GAME UNITS', 'Simplified educational model. Not medical or mission-certified.', COLORS.radiation, true)}{meter('HABITAT TEMPERATURE', Math.max(0, s.temperature), 42, '°C', 'Heating demand competes for power as the exterior cools.', '#eccb97')}{meter('EQUIPMENT CONDITION', s.equipment, 100, '%', 'Failures and unmet power loads degrade life support.', '#b4b5d9')}{meter('MUSCLE & BONE CONDITION', s.conditioning, 100, '%', 'Daily exercise slows simplified low-gravity deconditioning.', '#aad5bd')}</div>
      </section>

      <section className="mf-analysis"><div className="mf-section-heading"><div><div className="mf-eyebrow"><span/> SYSTEM PERFORMANCE</div><h2>Small margins. Big consequences.</h2></div><span className="mf-update-stamp"><Activity size={13}/> {s.history.length} DATA POINTS</span></div>
        <div className="mf-charts-grid">{chart('POWER RESERVE', 'power', COLORS.power, 'kWh')}{chart('WATER INVENTORY', 'water', COLORS.water, 'L')}{chart('OXYGEN INVENTORY', 'oxygen', COLORS.oxygen, 'units')}{chart('FOOD STORES', 'food', COLORS.food, 'rations')}{chart('ACCUMULATED DOSE', 'radiation', COLORS.radiation, 'units')}{chart('CREW WELLNESS', 'health', COLORS.health, '%')}</div>
      </section>

      <footer className="mf-footer"><span><Shield size={14}/> RADIATION VALUES ARE EDUCATIONAL APPROXIMATIONS</span><span>OUTPOST ENGINE / DETERMINISTIC ENVIRONMENTAL SEED</span></footer>
    </main>
  </div>
}
