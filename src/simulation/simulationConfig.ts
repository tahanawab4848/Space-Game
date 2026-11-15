import type { PlacedModule } from '../store/constructionStore'
import type { SimulationConfig } from './simulationTypes'
export function configFromBuild(placed: PlacedModule[], seed = 2089): SimulationConfig {
 const count = (id: PlacedModule['moduleId']) => placed.filter(x => x.moduleId === id).length
 return { crew: count('crew') * 3, solar: count('solar'), reactor: count('reactor'), recycler: count('recycler'), oxygenGenerator: count('oxygen'), farm: count('farm'), shielding: Math.min(90, count('shield') * 35), shelter: count('shelter'), medical: count('medical'), exercise: count('exercise'), initialPower: 65 + count('reactor') * 130, seed }
}
