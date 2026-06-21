import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Filter } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import {
  LEAD_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  type LeadType,
} from '@/types'

const TYPE_COLORS: Record<LeadType, { bg: string; text: string }> = {
  coupon: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  consultation: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  visit: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  transaction: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
}

const TYPE_ICONS: Record<LeadType, string> = {
  coupon: '🎫',
  consultation: '📞',
  visit: '🏥',
  transaction: '💰',
}

function StatsCard({ type, count }: { type: LeadType; count: number }) {
  return (
    <div className="bg-card border border-default rounded-lg p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg', TYPE_COLORS[type].bg)}>
        {TYPE_ICONS[type]}
      </div>
      <div>
        <div className="text-xs text-secondary">{LEAD_TYPE_LABELS[type]}</div>
        <div className="text-xl font-bold text-primary">{count}</div>
      </div>
    </div>
  )
}

export default function VerificationList() {
  const navigate = useNavigate()
  const { leads, stores } = useAppStore()
  const [typeFilter, setTypeFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [matchFilter, setMatchFilter] = useState('')

  const getStoreName = (id: string) => stores.find((s) => s.id === id)?.name ?? '-'

  const stats = useMemo(() => {
    const counts: Record<LeadType, number> = { coupon: 0, consultation: 0, visit: 0, transaction: 0 }
    leads.forEach((l) => { counts[l.type]++ })
    return counts
  }, [leads])

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (typeFilter && l.type !== typeFilter) return false
      if (storeFilter && l.storeId !== storeFilter) return false
      if (dateFrom && l.time < dateFrom) return false
      if (dateTo && l.time > dateTo + ' 23:59') return false
      if (matchFilter === 'matched' && !l.isMatched) return false
      if (matchFilter === 'unmatched' && l.isMatched) return false
      return true
    })
  }, [leads, typeFilter, storeFilter, dateFrom, dateTo, matchFilter])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">线索核销</h1>
        <button
          onClick={() => navigate('/verification/import')}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Upload size={16} />
          导入数据
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {(Object.keys(LEAD_TYPE_LABELS) as LeadType[]).map((type) => (
          <StatsCard key={type} type={type} count={stats[type]} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-card rounded-lg border border-default">
        <Filter size={16} className="text-secondary" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
          <option value="">全部类型</option>
          {(Object.entries(LEAD_TYPE_LABELS) as [LeadType, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
          <option value="">全部门店</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
        <span className="text-muted text-sm">至</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
        <select value={matchFilter} onChange={(e) => setMatchFilter(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
          <option value="">全部匹配状态</option>
          <option value="matched">已匹配</option>
          <option value="unmatched">未匹配</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-secondary text-left">
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">手机号</th>
              <th className="px-4 py-3 font-medium">券码</th>
              <th className="px-4 py-3 font-medium">门店</th>
              <th className="px-4 py-3 font-medium">时间</th>
              <th className="px-4 py-3 font-medium">项目</th>
              <th className="px-4 py-3 font-medium">金额</th>
              <th className="px-4 py-3 font-medium">来源</th>
              <th className="px-4 py-3 font-medium">匹配状态</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-default bg-card hover:bg-hover transition-colors">
                <td className="px-4 py-3">
                  <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', TYPE_COLORS[l.type].bg, TYPE_COLORS[l.type].text)}>
                    {LEAD_TYPE_LABELS[l.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-primary font-mono text-xs">{l.phone}</td>
                <td className="px-4 py-3 text-primary font-mono text-xs">{l.couponCode ?? '-'}</td>
                <td className="px-4 py-3 text-primary">{getStoreName(l.storeId)}</td>
                <td className="px-4 py-3 text-primary">{l.time}</td>
                <td className="px-4 py-3 text-primary">{l.project ?? '-'}</td>
                <td className="px-4 py-3 text-primary">{l.amount != null ? `¥${l.amount.toLocaleString()}` : '-'}</td>
                <td className="px-4 py-3 text-primary">{LEAD_SOURCE_LABELS[l.source]}</td>
                <td className="px-4 py-3">
                  {l.isMatched ? (
                    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400">已匹配</span>
                  ) : (
                    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-500/20 text-red-400">未匹配</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-muted">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
