import { useState, useMemo } from 'react'
import { LinkIcon, X, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import {
  MATCH_TYPE_LABELS,
  CATEGORY_LABELS,
  type MatchType,
  type Confidence,
  type ProjectCategory,
} from '@/types'

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  high: 'bg-emerald-500/20 text-emerald-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-red-500/20 text-red-400',
}

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

function detectProjectCategory(projectName: string): ProjectCategory {
  const name = projectName.toLowerCase()
  if (name.includes('玻尿') || name.includes('填充') || name.includes('隆鼻')) return 'filler'
  if (name.includes('热玛吉') || name.includes('激光') || name.includes('光电') || name.includes('光子') || name.includes('脱毛')) return 'laser'
  if (name.includes('水光') || name.includes('皮肤') || name.includes('嫩肤')) return 'skin'
  if (name.includes('手术')) return 'surgery'
  return 'other'
}

export default function MatchingList() {
  const { matches, leads, kols, stores, storeVisits, addMatch, autoMatchLeads } = useAppStore()

  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchType | ''>('')
  const [confidenceFilter, setConfidenceFilter] = useState<Confidence | ''>('')
  const [storeFilter, setStoreFilter] = useState('')
  const [anomalyFilter, setAnomalyFilter] = useState('')
  const [showManualModal, setShowManualModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [manualKolId, setManualKolId] = useState('')
  const [manualVisitId, setManualVisitId] = useState('')
  const [autoMatchResult, setAutoMatchResult] = useState<{ count: number } | null>(null)

  const matchedCount = matches.filter((m) => !m.isRefunded && !m.isDuplicate).length
  const unmatchedLeads = leads.filter((l) => !l.isMatched)
  const anomalyCount = matches.filter((m) => m.isRefunded || m.isDuplicate).length

  const getKolName = (id: string) => kols.find((k) => k.id === id)?.name ?? '-'
  const getStoreName = (id: string) => stores.find((s) => s.id === id)?.name ?? '-'

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (matchTypeFilter && m.matchType !== matchTypeFilter) return false
      if (confidenceFilter && m.confidence !== confidenceFilter) return false
      if (storeFilter && m.storeId !== storeFilter) return false
      if (anomalyFilter === 'refunded' && !m.isRefunded) return false
      if (anomalyFilter === 'duplicate' && !m.isDuplicate) return false
      return true
    })
  }, [matches, matchTypeFilter, confidenceFilter, storeFilter, anomalyFilter])

  const filteredUnmatched = useMemo(() => {
    return unmatchedLeads.filter((l) => {
      if (storeFilter && l.storeId !== storeFilter) return false
      return true
    })
  }, [unmatchedLeads, storeFilter])

  function openManualModal(leadId: string) {
    setSelectedLeadId(leadId)
    setManualKolId('')
    setManualVisitId('')
    setShowManualModal(true)
  }

  function handleManualMatch() {
    if (!selectedLeadId || !manualKolId || !manualVisitId) return
    const lead = leads.find((l) => l.id === selectedLeadId)
    if (!lead) return
    addMatch({
      id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      leadId: selectedLeadId,
      kolId: manualKolId,
      storeVisitId: manualVisitId,
      matchType: 'manual',
      confidence: 'medium',
      transactionAmount: lead.amount ?? 0,
      projectCategory: detectProjectCategory(lead.project ?? ''),
      isRefunded: false,
      isDuplicate: false,
      storeId: lead.storeId,
    })
    setShowManualModal(false)
  }

  function handleAutoMatch() {
    const { matchedLeadIds } = autoMatchLeads()
    setAutoMatchResult({ count: matchedLeadIds.length })
    setTimeout(() => setAutoMatchResult(null), 2500)
  }

  const selectClass = 'bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]'

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="成交匹配"
        action={
          <div className="flex items-center gap-3">
            {autoMatchResult && (
              <span className="text-xs text-emerald-400">自动匹配 {autoMatchResult.count} 条</span>
            )}
            <button
              onClick={handleAutoMatch}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-info)]/20 px-4 py-2 text-sm font-medium text-[var(--color-info)] hover:bg-[var(--color-info)]/30 transition-colors"
            >
              <RefreshCw size={16} /> 运行自动匹配
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="已匹配" value={matchedCount} icon={CheckCircle2} />
        <StatCard title="未匹配" value={unmatchedLeads.length} icon={LinkIcon} />
        <StatCard title="异常记录" value={anomalyCount} icon={AlertTriangle} />
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-default">
        <select value={matchTypeFilter} onChange={(e) => setMatchTypeFilter(e.target.value as MatchType | '')} className={selectClass}>
          <option value="">全部口径</option>
          {(Object.entries(MATCH_TYPE_LABELS) as [MatchType, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value as Confidence | '')} className={selectClass}>
          <option value="">全部置信度</option>
          {(Object.entries(CONFIDENCE_LABELS) as [Confidence, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className={selectClass}>
          <option value="">全部门店</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={anomalyFilter} onChange={(e) => setAnomalyFilter(e.target.value)} className={selectClass}>
          <option value="">全部记录</option>
          <option value="refunded">已退款</option>
          <option value="duplicate">重复标记</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-secondary text-left">
              <th className="px-4 py-3 font-medium">线索ID</th>
              <th className="px-4 py-3 font-medium">达人</th>
              <th className="px-4 py-3 font-medium">匹配口径</th>
              <th className="px-4 py-3 font-medium">置信度</th>
              <th className="px-4 py-3 font-medium">成交金额</th>
              <th className="px-4 py-3 font-medium">项目类别</th>
              <th className="px-4 py-3 font-medium">退款标记</th>
              <th className="px-4 py-3 font-medium">重复标记</th>
              <th className="px-4 py-3 font-medium">门店</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-default bg-card hover:bg-hover transition-colors">
                <td className="px-4 py-3 text-primary font-mono text-xs">{m.leadId}</td>
                <td className="px-4 py-3 text-primary">{getKolName(m.kolId)}</td>
                <td className="px-4 py-3 text-primary">{MATCH_TYPE_LABELS[m.matchType]}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CONFIDENCE_COLORS[m.confidence]}`}>
                    {CONFIDENCE_LABELS[m.confidence]}
                  </span>
                </td>
                <td className="px-4 py-3 text-primary font-mono">¥{m.transactionAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-primary">{CATEGORY_LABELS[m.projectCategory]}</td>
                <td className="px-4 py-3">
                  {m.isRefunded && (
                    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-500/20 text-red-400">已退款</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {m.isDuplicate && (
                    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400">重复</span>
                  )}
                </td>
                <td className="px-4 py-3 text-primary">{getStoreName(m.storeId)}</td>
                <td className="px-4 py-3 text-muted">-</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-muted">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-primary mb-4">未匹配线索</h2>
        <div className="overflow-x-auto rounded-lg border border-default">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary text-left">
                <th className="px-4 py-3 font-medium">线索ID</th>
                <th className="px-4 py-3 font-medium">手机号</th>
                <th className="px-4 py-3 font-medium">门店</th>
                <th className="px-4 py-3 font-medium">项目</th>
                <th className="px-4 py-3 font-medium">金额</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnmatched.map((l) => (
                <tr key={l.id} className="border-t border-default bg-card hover:bg-hover transition-colors">
                  <td className="px-4 py-3 text-primary font-mono text-xs">{l.id}</td>
                  <td className="px-4 py-3 text-primary font-mono text-xs">{l.phone}</td>
                  <td className="px-4 py-3 text-primary">{getStoreName(l.storeId)}</td>
                  <td className="px-4 py-3 text-primary">{l.project ?? '-'}</td>
                  <td className="px-4 py-3 text-primary font-mono">{l.amount != null ? `¥${l.amount.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openManualModal(l.id)}
                      className="px-3 py-1 rounded-md text-xs font-medium bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors"
                    >
                      手动匹配
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUnmatched.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">暂无未匹配线索</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowManualModal(false)}>
          <div className="w-full max-w-md rounded-xl p-6 space-y-5" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">手动匹配</h2>
              <button onClick={() => setShowManualModal(false)} className="p-1 rounded text-muted"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1 text-secondary">选择达人</label>
                <select value={manualKolId} onChange={(e) => { setManualKolId(e.target.value); setManualVisitId('') }} className="w-full bg-card border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
                  <option value="">请选择达人</option>
                  {kols.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 text-secondary">选择到店记录</label>
                <select value={manualVisitId} onChange={(e) => setManualVisitId(e.target.value)} className="w-full bg-card border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
                  <option value="">请选择到店记录</option>
                  {storeVisits.filter((v) => !manualKolId || v.kolId === manualKolId).map((v) => (
                    <option key={v.id} value={v.id}>{v.visitDate} - {stores.find((s) => s.id === v.storeId)?.name ?? v.storeId}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowManualModal(false)} className="px-4 py-2 rounded-md text-sm bg-card text-secondary border border-default">取消</button>
              <button onClick={handleManualMatch} disabled={!manualKolId || !manualVisitId} className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-accent)] text-white disabled:opacity-50">确认匹配</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
