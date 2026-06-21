import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Store, KOL, StoreVisit, LeadRecord, MatchResult, CommissionCalc, User } from '@/types'
import { mockStores, mockKOLs, mockStoreVisits, mockLeads, mockMatches, mockCommissions, mockUser } from '@/data/mockData'

interface AppState {
  currentUser: User
  stores: Store[]
  kols: KOL[]
  storeVisits: StoreVisit[]
  leads: LeadRecord[]
  matches: MatchResult[]
  commissions: CommissionCalc[]
  sidebarCollapsed: boolean

  setSidebarCollapsed: (collapsed: boolean) => void
  addKOL: (kol: KOL) => void
  updateKOL: (id: string, kol: Partial<KOL>) => void
  addStoreVisit: (visit: StoreVisit) => void
  updateStoreVisit: (id: string, visit: Partial<StoreVisit>) => void
  addLeads: (leads: LeadRecord[]) => void
  addMatch: (match: MatchResult) => void
  updateMatch: (id: string, match: Partial<MatchResult>) => void
  addCommission: (calc: CommissionCalc) => void
  updateCommission: (id: string, calc: Partial<CommissionCalc>) => void
  getKOLById: (id: string) => KOL | undefined
  getStoreById: (id: string) => Store | undefined
  getStoreVisitsByKOL: (kolId: string) => StoreVisit[]
  getMatchesByKOL: (kolId: string) => MatchResult[]
  getCommissionsByKOL: (kolId: string) => CommissionCalc[]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: mockUser,
      stores: mockStores,
      kols: mockKOLs,
      storeVisits: mockStoreVisits,
      leads: mockLeads,
      matches: mockMatches,
      commissions: mockCommissions,
      sidebarCollapsed: false,

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      addKOL: (kol) => set((state) => ({ kols: [...state.kols, kol] })),
      updateKOL: (id, kol) => set((state) => ({
        kols: state.kols.map((k) => (k.id === id ? { ...k, ...kol } : k)),
      })),

      addStoreVisit: (visit) => set((state) => ({ storeVisits: [...state.storeVisits, visit] })),
      updateStoreVisit: (id, visit) => set((state) => ({
        storeVisits: state.storeVisits.map((v) => (v.id === id ? { ...v, ...visit } : v)),
      })),

      addLeads: (leads) => set((state) => ({ leads: [...state.leads, ...leads] })),
      addMatch: (match) => set((state) => ({ matches: [...state.matches, match] })),
      updateMatch: (id, match) => set((state) => ({
        matches: state.matches.map((m) => (m.id === id ? { ...m, ...match } : m)),
      })),

      addCommission: (calc) => set((state) => ({ commissions: [...state.commissions, calc] })),
      updateCommission: (id, calc) => set((state) => ({
        commissions: state.commissions.map((c) => (c.id === id ? { ...c, ...calc } : c)),
      })),

      getKOLById: (id) => get().kols.find((k) => k.id === id),
      getStoreById: (id) => get().stores.find((s) => s.id === id),
      getStoreVisitsByKOL: (kolId) => get().storeVisits.filter((v) => v.kolId === kolId),
      getMatchesByKOL: (kolId) => get().matches.filter((m) => m.kolId === kolId),
      getCommissionsByKOL: (kolId) => get().commissions.filter((c) => c.kolId === kolId),
    }),
    { name: 'kol-commission-store' }
  )
)
