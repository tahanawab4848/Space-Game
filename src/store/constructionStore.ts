import { create } from 'zustand'

export type ModuleCategory = 'Habitat' | 'Life support' | 'Power' | 'Science' | 'Safety'
export type ModuleId = 'crew' | 'farm' | 'shield' | 'solar' | 'reactor' | 'recycler' | 'medical' | 'exercise' | 'oxygen' | 'lab' | 'shelter' | 'comms'
export type ModuleSpec = { id: ModuleId; name: string; category: ModuleCategory; purpose: string; mass: number; cost: number; power: number; water: number; oxygen: number; food: number; radiation: number; science: number; dimensions: [number, number]; color: string; fact: string }
export type PlacedModule = { instanceId: string; moduleId: ModuleId; row: number; col: number; rotation: 0 | 90 | 180 | 270 }

export const MODULE_SPECS: ModuleSpec[] = [
  { id: 'crew', name: 'Crew Quarters', category: 'Habitat', purpose: 'Sleeping, hygiene, and crew recovery.', mass: 1500, cost: 15, power: -8, water: -4, oxygen: -3, food: 0, radiation: 0, science: 0, dimensions: [1, 1], color: '#a78bfa', fact: 'Astronauts need private sleep stations because good rest helps crews make safe decisions.' },
  { id: 'farm', name: 'Hydroponic Farm', category: 'Life support', purpose: 'Grows food and helps refresh cabin air.', mass: 2000, cost: 20, power: -20, water: -8, oxygen: 24, food: 28, radiation: 0, science: 4, dimensions: [1, 1], color: '#65d896', fact: 'Plants can contribute food and oxygen, but they need water, light, and careful care.' },
  { id: 'shield', name: 'Regolith Shield', category: 'Safety', purpose: 'Piled Martian soil protection for habitat modules.', mass: 3000, cost: 10, power: 0, water: 0, oxygen: 0, food: 0, radiation: 50, science: 0, dimensions: [1, 1], color: '#e89258', fact: 'Martian soil can act as useful mass between astronauts and space radiation.' },
  { id: 'solar', name: 'Solar Array', category: 'Power', purpose: 'Produces power during clear Martian days.', mass: 1000, cost: 10, power: 40, water: 0, oxygen: 0, food: 0, radiation: 0, science: 0, dimensions: [2, 1], color: '#f8ca68', fact: 'Solar panels on Mars produce less energy during dusty weather.' },
  { id: 'reactor', name: 'Nuclear Microreactor', category: 'Power', purpose: 'Reliable fission power independent of sunlight.', mass: 3500, cost: 35, power: 90, water: 0, oxygen: 0, food: 0, radiation: 0, science: 4, dimensions: [1, 1], color: '#53d4e5', fact: 'Fission surface-power concepts are studied for places where sunlight is unreliable.' },
  { id: 'recycler', name: 'Water Recycler', category: 'Life support', purpose: 'Recovers water for repeat use.', mass: 1500, cost: 15, power: -15, water: 35, oxygen: 0, food: 0, radiation: 0, science: 0, dimensions: [1, 1], color: '#56bdf0', fact: 'The ISS recovers water from several sources to reduce resupply needs.' },
  { id: 'medical', name: 'Medical Bay', category: 'Habitat', purpose: 'Treats injuries and monitors crew health.', mass: 1300, cost: 18, power: -9, water: -2, oxygen: 0, food: 0, radiation: 0, science: 2, dimensions: [1, 1], color: '#fb8396', fact: 'Medical equipment helps crews respond to problems when Earth is far away.' },
  { id: 'exercise', name: 'Exercise Module', category: 'Habitat', purpose: 'Keeps bones and muscles strong.', mass: 1200, cost: 12, power: -6, water: -1, oxygen: 0, food: 0, radiation: 0, science: 0, dimensions: [1, 1], color: '#f49cc2', fact: 'Astronauts exercise regularly because low gravity can weaken muscles and bones.' },
  { id: 'oxygen', name: 'Oxygen Generator', category: 'Life support', purpose: 'Maintains breathable air reserve.', mass: 1100, cost: 14, power: -14, water: -4, oxygen: 35, food: 0, radiation: 0, science: 0, dimensions: [1, 1], color: '#6ce1dd', fact: 'Life-support machines carefully control the gases astronauts breathe.' },
  { id: 'lab', name: 'Research Laboratory', category: 'Science', purpose: 'Supports planetary science and experiments.', mass: 1800, cost: 23, power: -18, water: -3, oxygen: 0, food: 0, radiation: 0, science: 30, dimensions: [1, 1], color: '#8e92f4', fact: 'Mars research can help scientists understand the planet’s past climate and geology.' },
  { id: 'shelter', name: 'Emergency Shelter', category: 'Safety', purpose: 'Protected safe room for dangerous events.', mass: 2200, cost: 19, power: -4, water: 0, oxygen: 8, food: 0, radiation: 35, science: 0, dimensions: [1, 1], color: '#eab47b', fact: 'A storm shelter gives a crew a protected place to wait out a serious event.' },
  { id: 'comms', name: 'Communications Tower', category: 'Science', purpose: 'Sends science and status data to mission control.', mass: 700, cost: 9, power: -5, water: 0, oxygen: 0, food: 0, radiation: 0, science: 16, dimensions: [1, 1], color: '#a8d7f4', fact: 'Mars communication can be delayed by several minutes because of the distance from Earth.' },
]
export const byId = (id: ModuleId) => MODULE_SPECS.find((module) => module.id === id)!
const GRID_SIZE = 4
const cellsFor = (module: ModuleSpec, row: number, col: number, rotation: PlacedModule['rotation']) => {
  const [baseW, baseH] = module.dimensions
  const [w, h] = rotation % 180 === 0 ? [baseW, baseH] : [baseH, baseW]
  return Array.from({ length: w * h }, (_, index) => ({ row: row + Math.floor(index / w), col: col + (index % w) }))
}
export type ResourceSummary = { mass: number; cost: number; power: number; water: number; oxygen: number; food: number; radiation: number; science: number; crewCapacity: number; shieldBonus: number }
export const calculateResources = (placed: PlacedModule[]): ResourceSummary => {
  const base = placed.reduce((summary, item) => { const module = byId(item.moduleId); return { ...summary, mass: summary.mass + module.mass, cost: summary.cost + module.cost, power: summary.power + module.power, water: summary.water + module.water, oxygen: summary.oxygen + module.oxygen, food: summary.food + module.food, radiation: summary.radiation + module.radiation, science: summary.science + module.science, crewCapacity: summary.crewCapacity + (module.id === 'crew' ? 3 : 0) } }, { mass: 0, cost: 0, power: 0, water: 0, oxygen: 0, food: 0, radiation: 0, science: 0, crewCapacity: 0, shieldBonus: 0 })
  const shieldBonus = placed.filter((item) => item.moduleId === 'shield').some((shield) => placed.some((other) => other.moduleId === 'crew' && Math.abs(other.row - shield.row) + Math.abs(other.col - shield.col) === 1)) ? 15 : 0
  return { ...base, radiation: Math.min(100, base.radiation + shieldBonus), shieldBonus }
}
type ConstructionState = { placed: PlacedModule[]; selectedId: string | null; selectedModule: ModuleId | null; notification: string | null; setSelectedModule: (id: ModuleId | null) => void; selectPlaced: (id: string | null) => void; place: (moduleId: ModuleId, row: number, col: number) => { ok: boolean; reason?: string }; move: (id: string, row: number, col: number) => { ok: boolean; reason?: string }; rotate: (id: string) => { ok: boolean; reason?: string }; remove: (id: string) => void; clear: () => void; dismissNotification: () => void }
export const useConstructionStore = create<ConstructionState>((set, get) => {
  const valid = (moduleId: ModuleId, row: number, col: number, rotation: PlacedModule['rotation'], ignore?: string) => {
    const module = byId(moduleId); const cells = cellsFor(module, row, col, rotation)
    if (cells.some((cell) => cell.row < 0 || cell.col < 0 || cell.row >= GRID_SIZE || cell.col >= GRID_SIZE)) return 'This module would extend beyond the landing zone.'
    const occupied = new Set(get().placed.filter((item) => item.instanceId !== ignore).flatMap((item) => cellsFor(byId(item.moduleId), item.row, item.col, item.rotation).map((cell) => `${cell.row}:${cell.col}`)))
    if (cells.some((cell) => occupied.has(`${cell.row}:${cell.col}`))) return 'That grid space is already occupied.'
    const candidate = ignore ? get().placed.map((item) => item.instanceId === ignore ? { ...item, row, col, rotation } : item) : [...get().placed, { instanceId: 'preview', moduleId, row, col, rotation }]
    const totals = calculateResources(candidate)
    if (totals.mass > 10000) return 'Placement exceeds the 10,000 kg payload limit.'
    if (totals.cost > 100) return 'Placement exceeds the $100M mission budget.'
    return null
  }
  return { placed: [], selectedId: null, selectedModule: null, notification: null,
    setSelectedModule: (selectedModule) => set({ selectedModule, selectedId: null }), selectPlaced: (selectedId) => set({ selectedId, selectedModule: null }),
    place: (moduleId, row, col) => { const reason = valid(moduleId, row, col, 0); if (reason) { set({ notification: reason }); return { ok: false, reason } }; const instanceId = crypto.randomUUID(); const fact = byId(moduleId).fact; set((state) => ({ placed: [...state.placed, { instanceId, moduleId, row, col, rotation: 0 }], selectedId: instanceId, selectedModule: null, notification: `${byId(moduleId).name} deployed. ${fact}` })); return { ok: true } },
    move: (id, row, col) => { const item = get().placed.find((entry) => entry.instanceId === id); if (!item) return { ok: false, reason: 'Module not found.' }; const reason = valid(item.moduleId, row, col, item.rotation, id); if (reason) { set({ notification: reason }); return { ok: false, reason } }; set((state) => ({ placed: state.placed.map((entry) => entry.instanceId === id ? { ...entry, row, col } : entry), notification: 'Module moved and snapped to the construction grid.' })); return { ok: true } },
    rotate: (id) => { const item = get().placed.find((entry) => entry.instanceId === id); if (!item) return { ok: false }; const rotation = ((item.rotation + 90) % 360) as PlacedModule['rotation']; const reason = valid(item.moduleId, item.row, item.col, rotation, id); if (reason) { set({ notification: reason }); return { ok: false, reason } }; set((state) => ({ placed: state.placed.map((entry) => entry.instanceId === id ? { ...entry, rotation } : entry), notification: 'Module rotated 90°.' })); return { ok: true } },
    remove: (id) => set((state) => ({ placed: state.placed.filter((entry) => entry.instanceId !== id), selectedId: null, notification: 'Module removed. Payload and budget refunded.' })), clear: () => set({ placed: [], selectedId: null, selectedModule: null, notification: 'Landing zone cleared.' }), dismissNotification: () => set({ notification: null }),
  }
})
