import { create } from 'zustand'

export type Screen = 'landing' | 'missions' | 'briefing' | 'construction' | 'legacy-construction' | 'library' | 'settings'
export type MissionId = 'first-footprint' | 'ares-01' | 'solar-apocalypse' | 'new-frontier' | 'sandbox'

type GameState = {
  screen: Screen
  selectedMission: MissionId
  hasProgress: boolean
  tutorialOpen: boolean
  setScreen: (screen: Screen) => void
  selectMission: (mission: MissionId) => void
  setTutorialOpen: (open: boolean) => void
  markProgress: () => void
}

const saved = localStorage.getItem('mars-last-frontier-progress') === 'true'
export const useGameStore = create<GameState>((set) => ({
  screen: 'landing', selectedMission: 'first-footprint', hasProgress: saved, tutorialOpen: false,
  setScreen: (screen) => set({ screen }),
  selectMission: (selectedMission) => set({ selectedMission, screen: 'briefing' }),
  setTutorialOpen: (tutorialOpen) => set({ tutorialOpen }),
  markProgress: () => { localStorage.setItem('mars-last-frontier-progress', 'true'); set({ hasProgress: true }) },
}))
