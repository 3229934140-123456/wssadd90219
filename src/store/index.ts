import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import dayjs from 'dayjs'
import type { Store, KOL, StoreVisit, LeadRecord, MatchResult, CommissionCalc, User, CommissionItem, DeductionItem, ProjectCategory } from '@/types'
import { mockStores, mockKOLs, mockStoreVisits, mockLeads, mockMatches, mockCommissions, mockUser } from '@/data/mockData'

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function detectProjectCategory(projectName: string): ProjectCategory {
  const name = projectName.toLowerCase()
  if (name.includes('玻尿') || name.includes('填充') || name.includes('隆鼻') || name.includes('filler')) return 'filler'
  if (name.includes('热玛吉') || name.includes('激光') || name.includes('光电') || name.includes('光子') || name.includes('脱毛') || name.includes('laser')) return 'laser'
  if (name.includes('水光') || name.includes('皮肤') || name.includes('嫩肤') || name.includes('skin')) return 'skin'
  if (name.includes('手术') || name.includes('surgery')) return 'surgery'
  return 'other'
}

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
  markLeadMatched: (leadId: string) => void
  autoMatchLeads: () => { newMatches: MatchResult[]; matchedLeadIds: string[] }
  addCommission: (calc: CommissionCalc) => void
  updateCommission: (id: string, calc: Partial<CommissionCalc>) => void
  createCommissionCalc: (kolId: string, storeVisitId: string, period: string) => CommissionCalc
  getKOLById: (id: string) => KOL | undefined
  getStoreById: (id: string) => Store | undefined
  getStoreVisitsByKOL: (kolId: string) => StoreVisit[]
  getMatchesByKOL: (kolId: string) => MatchResult[]
  getCommissionsByKOL: (kolId: string) => CommissionCalc[]
  getMatchById: (id: string) => MatchResult | undefined
  getLeadById: (id: string) => LeadRecord | undefined
  recalcAllCommissionTotals: () => void
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

      addMatch: (match) => set((state) => {
        const updatedLeads = state.leads.map((l) =>
          l.id === match.leadId ? { ...l, isMatched: true } : l
        )
        return {
          matches: [...state.matches, match],
          leads: updatedLeads,
        }
      }),
      updateMatch: (id, match) => set((state) => ({
        matches: state.matches.map((m) => (m.id === id ? { ...m, ...match } : m)),
      })),
      markLeadMatched: (leadId) => set((state) => ({
        leads: state.leads.map((l) => (l.id === leadId ? { ...l, isMatched: true } : l)),
      })),

      autoMatchLeads: () => {
        const state = get()
        const unmatchedLeads = state.leads.filter((l) => !l.isMatched)
        const newMatches: MatchResult[] = []
        const matchedLeadIds: string[] = []

        for (const lead of unmatchedLeads) {
          let matched: MatchResult | null = null

          if (lead.couponCode) {
            const couponVisit = state.storeVisits.find((v) => {
              const hasVideo = v.videos.length > 0
              const sameStore = v.storeId === lead.storeId
              const inTimeWindow = hasVideo && dayjs(lead.time).isAfter(dayjs(v.visitDate).subtract(1, 'day'))
              return sameStore && inTimeWindow
            })
            if (couponVisit) {
              matched = {
                id: generateId('match'),
                leadId: lead.id,
                kolId: couponVisit.kolId,
                storeVisitId: couponVisit.id,
                matchType: 'coupon',
                confidence: 'high',
                transactionAmount: lead.amount ?? 0,
                projectCategory: detectProjectCategory(lead.project ?? ''),
                isRefunded: false,
                isDuplicate: false,
                storeId: lead.storeId,
              }
            }
          }

          if (!matched && lead.phone) {
            const phoneVisit = state.storeVisits.find((v) => {
              const hasVideo = v.videos.length > 0
              const inTimeWindow = hasVideo && dayjs(lead.time).isAfter(dayjs(v.visitDate).subtract(1, 'day'))
              return inTimeWindow && v.storeId === lead.storeId
            })
            if (phoneVisit) {
              matched = {
                id: generateId('match'),
                leadId: lead.id,
                kolId: phoneVisit.kolId,
                storeVisitId: phoneVisit.id,
                matchType: 'phone',
                confidence: 'medium',
                transactionAmount: lead.amount ?? 0,
                projectCategory: detectProjectCategory(lead.project ?? ''),
                isRefunded: false,
                isDuplicate: false,
                storeId: lead.storeId,
              }
            }
          }

          if (!matched && lead.remark) {
            const remarkLower = lead.remark.toLowerCase()
            const kol = state.kols.find((k) => {
              return k.platforms.some((p) => remarkLower.includes(p.account.toLowerCase())) ||
                remarkLower.includes(k.name.toLowerCase())
            })
            if (kol) {
              const kolVisit = state.storeVisits.find((v) => v.kolId === kol.id && v.storeId === lead.storeId)
              if (kolVisit) {
                matched = {
                  id: generateId('match'),
                  leadId: lead.id,
                  kolId: kol.id,
                  storeVisitId: kolVisit.id,
                  matchType: 'remark',
                  confidence: 'medium',
                  transactionAmount: lead.amount ?? 0,
                  projectCategory: detectProjectCategory(lead.project ?? ''),
                  isRefunded: false,
                  isDuplicate: false,
                  storeId: lead.storeId,
                }
              }
            }
          }

          if (matched) {
            newMatches.push(matched)
            matchedLeadIds.push(lead.id)
          }
        }

        const seen = new Set<string>()
        for (const match of newMatches) {
          const key = `${match.leadId}-${match.kolId}-${match.transactionAmount}`
          if (seen.has(key)) {
            match.isDuplicate = true
          }
          seen.add(key)
        }

        if (newMatches.length > 0) {
          set((state) => ({
            matches: [...state.matches, ...newMatches],
            leads: state.leads.map((l) =>
              matchedLeadIds.includes(l.id) ? { ...l, isMatched: true } : l
            ),
          }))
        }

        return { newMatches, matchedLeadIds }
      },

      addCommission: (calc) => set((state) => ({ commissions: [...state.commissions, calc] })),
      updateCommission: (id, calc) => set((state) => ({
        commissions: state.commissions.map((c) => (c.id === id ? { ...c, ...calc } : c)),
      })),

      createCommissionCalc: (kolId, storeVisitId, period) => {
        const state = get()
        const kol = state.getKOLById(kolId)
        if (!kol) {
          const empty: CommissionCalc = {
            id: generateId('comm'),
            kolId,
            storeVisitId,
            period,
            items: [],
            deductions: [],
            totalAmount: 0,
            status: 'draft',
            createdAt: dayjs().format('YYYY-MM-DD'),
            isDisputed: false,
          }
          set((s) => ({ commissions: [...s.commissions, empty] }))
          return empty
        }

        const allMatches = state.matches.filter(
          (m) => m.kolId === kolId && m.storeVisitId === storeVisitId
        )
        const periodStart = dayjs(period + '-01')
        const periodEnd = periodStart.endOf('month')
        const periodMatches = allMatches.filter((m) => {
          const lead = state.leads.find((l) => l.id === m.leadId)
          if (!lead) return false
          const t = dayjs(lead.time)
          return t.isAfter(periodStart.subtract(1, 'day')) && t.isBefore(periodEnd.add(1, 'day'))
        })

        const tierMap = new Map(kol.commissionTiers.map((t) => [t.category, t.rate]))
        const items: CommissionItem[] = []
        const deductions: DeductionItem[] = []

        for (const match of periodMatches) {
          const rate = tierMap.get(match.projectCategory) ?? 0.05
          const baseAmt = Math.max(match.transactionAmount, 0)
          const commissionAmt = baseAmt * rate
          const lead = state.leads.find((l) => l.id === match.leadId)
          const catLabel = (() => {
            const n = (lead?.project ?? '').toLowerCase()
            if (n.includes('玻尿') || n.includes('填充') || n.includes('隆鼻')) return '玻尿酸'
            if (n.includes('热玛吉') || n.includes('激光') || n.includes('光电') || n.includes('光子') || n.includes('脱毛')) return '光电'
            if (n.includes('水光') || n.includes('皮肤') || n.includes('嫩肤')) return '皮肤管理'
            if (n.includes('手术')) return '手术类'
            return '其他'
          })()

          items.push({
            id: generateId('ci'),
            matchResultId: match.id,
            projectCategory: match.projectCategory,
            rate,
            baseAmount: baseAmt,
            commissionAmount: commissionAmt,
          })

          if (match.isRefunded) {
            deductions.push({
              id: generateId('ded'),
              type: 'refund',
              amount: commissionAmt,
              description: `${catLabel}项目退款扣减：手机号${lead?.phone ?? ''}`,
              relatedMatchId: match.id,
            })
          } else if (match.isDuplicate) {
            deductions.push({
              id: generateId('ded'),
              type: 'duplicate',
              amount: commissionAmt,
              description: `跨门店重复线索扣减：手机号${lead?.phone ?? ''}`,
              relatedMatchId: match.id,
            })
          } else if (match.transactionAmount <= 0) {
            deductions.push({
              id: generateId('ded'),
              type: 'no_deal',
              amount: 0,
              description: '未成单扣减',
              relatedMatchId: match.id,
            })
          }
        }

        const itemsTotal = items.reduce((s, i) => s + i.commissionAmount, 0)
        const deductionsTotal = deductions.reduce((s, d) => s + d.amount, 0)
        const totalAmount = itemsTotal - deductionsTotal

        const calc: CommissionCalc = {
          id: generateId('comm'),
          kolId,
          storeVisitId,
          period,
          items,
          deductions,
          totalAmount,
          status: 'draft',
          createdAt: dayjs().format('YYYY-MM-DD'),
          isDisputed: false,
        }

        set((s) => ({ commissions: [...s.commissions, calc] }))
        return calc
      },

      getKOLById: (id) => get().kols.find((k) => k.id === id),
      getStoreById: (id) => get().stores.find((s) => s.id === id),
      getStoreVisitsByKOL: (kolId) => get().storeVisits.filter((v) => v.kolId === kolId),
      getMatchesByKOL: (kolId) => get().matches.filter((m) => m.kolId === kolId),
      getCommissionsByKOL: (kolId) => get().commissions.filter((c) => c.kolId === kolId),
      getMatchById: (id) => get().matches.find((m) => m.id === id),
      getLeadById: (id) => get().leads.find((l) => l.id === id),
      recalcAllCommissionTotals: () => {
        const state = get()
        const updated = state.commissions.map((c) => {
          const itemsTotal = c.items.reduce((s, i) => s + i.commissionAmount, 0)
          const deductionsTotal = c.deductions.reduce((s, d) => s + d.amount, 0)
          const totalAmount = Math.round((itemsTotal - deductionsTotal) * 100) / 100
          if (Math.abs(c.totalAmount - totalAmount) < 0.01) return c
          return { ...c, totalAmount }
        })
        if (updated.some((c, i) => c !== state.commissions[i])) {
          set({ commissions: updated })
        }
      },
    }),
    {
      name: 'kol-commission-store-v2',
      onRehydrateStorage: () => (state) => {
        state?.recalcAllCommissionTotals()
      },
    }
  )
)
