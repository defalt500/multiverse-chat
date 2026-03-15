import { create } from 'zustand'

interface AppState {
    isConnected: boolean
    setConnected: (status: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
    isConnected: false,
    setConnected: (status) => set({ isConnected: status }),
}))
