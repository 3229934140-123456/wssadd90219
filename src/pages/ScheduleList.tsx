import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, List, Calendar, Filter } from 'lucide-react'
import dayjs from 'dayjs'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import {
  VISIT_STATUS_LABELS,
  PRICING_MODEL_LABELS,
  CATEGORY_LABELS,
  type VisitStatus,
  type ProjectCategory,
  type StoreVisit,
  type KOL,
  type Store,
} from '@/types'

const STATUS_COLORS: Record<VisitStatus, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400',
  filming: 'bg-yellow-500/20 text-yellow-400',
  published: 'bg-purple-500/20 text-purple-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
}

const CALENDAR_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500']

function StatusBadge({ status }: { status: VisitStatus }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[status])}>
      {VISIT_STATUS_LABELS[status]}
    </span>
  )
}

function PageHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <button
        onClick={onAction}
        className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] transition-colors"
      >
        <Plus size={16} />
        {actionLabel}
      </button>
    </div>
  )
}

function FilterBar({
  stores,
  kols,
  storeFilter,
  setStoreFilter,
  kolFilter,
  setKolFilter,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: {
  stores: { id: string; name: string }[]
  kols: { id: string; name: string }[]
  storeFilter: string
  setStoreFilter: (v: string) => void
  kolFilter: string
  setKolFilter: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-card rounded-lg border border-default">
      <Filter size={16} className="text-secondary" />
      <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
        <option value="">全部门店</option>
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select value={kolFilter} onChange={(e) => setKolFilter(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
        <option value="">全部达人</option>
        {kols.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
      </select>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
        <option value="">全部状态</option>
        {(Object.entries(VISIT_STATUS_LABELS) as [VisitStatus, string][]).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
      <span className="text-muted text-sm">至</span>
      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-secondary border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
    </div>
  )
}

function ListView({ visits, kols, stores }: { visits: StoreVisit[]; kols: KOL[]; stores: Store[] }) {
  const getKolName = (id: string) => kols.find((k) => k.id === id)?.name ?? '-'
  const getStoreName = (id: string) => stores.find((s) => s.id === id)?.name ?? '-'

  return (
    <div className="overflow-x-auto rounded-lg border border-default">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary text-secondary text-left">
            <th className="px-4 py-3 font-medium">达人</th>
            <th className="px-4 py-3 font-medium">门店</th>
            <th className="px-4 py-3 font-medium">到店日期</th>
            <th className="px-4 py-3 font-medium">拍摄项目</th>
            <th className="px-4 py-3 font-medium">报价方式</th>
            <th className="px-4 py-3 font-medium">视频</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr key={v.id} className="border-t border-default bg-card hover:bg-hover transition-colors">
              <td className="px-4 py-3 text-primary">{getKolName(v.kolId)}</td>
              <td className="px-4 py-3 text-primary">{getStoreName(v.storeId)}</td>
              <td className="px-4 py-3 text-primary">{v.visitDate}</td>
              <td className="px-4 py-3 text-primary">{v.projectTypes.map((p) => CATEGORY_LABELS[p as ProjectCategory]).join(', ')}</td>
              <td className="px-4 py-3 text-primary">
                {PRICING_MODEL_LABELS[v.pricingModel]}
                {v.pricingModel === 'fixed' && v.fixedPrice != null && ` ¥${v.fixedPrice}`}
                {v.pricingModel === 'commission' && v.commissionRate != null && ` ${(v.commissionRate * 100).toFixed(0)}%`}
                {v.pricingModel === 'hybrid' && ` ¥${v.fixedPrice ?? 0}+${((v.commissionRate ?? 0) * 100).toFixed(0)}%`}
              </td>
              <td className="px-4 py-3 text-primary">{v.videos.length > 0 ? `${v.videos.length}个` : <span className="text-muted">未登记</span>}</td>
              <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
              <td className="px-4 py-3">
                <button className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] text-sm transition-colors">详情</button>
              </td>
            </tr>
          ))}
          {visits.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-12 text-center text-muted">暂无数据</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function CalendarView({ visits, kols, stores }: { visits: StoreVisit[]; kols: KOL[]; stores: Store[] }) {
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'))
  const monthStart = dayjs(currentMonth).startOf('month')
  const startDay = monthStart.day()
  const daysInMonth = monthStart.daysInMonth()
  const getKolName = (id: string) => kols.find((k) => k.id === id)?.name ?? '-'
  const getStoreName = (id: string) => stores.find((s) => s.id === id)?.name ?? '-'

  const visitsByDate = useMemo(() => {
    const map: Record<string, typeof visits> = {}
    visits.forEach((v) => {
      const key = v.visitDate.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(v)
    })
    return map
  }, [visits])

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(monthStart.subtract(1, 'month').format('YYYY-MM'))} className="px-3 py-1.5 bg-secondary border border-default rounded-md text-sm text-primary hover:bg-hover transition-colors">上月</button>
        <span className="text-primary font-medium">{monthStart.format('YYYY年M月')}</span>
        <button onClick={() => setCurrentMonth(monthStart.add(1, 'month').format('YYYY-MM'))} className="px-3 py-1.5 bg-secondary border border-default rounded-md text-sm text-primary hover:bg-hover transition-colors">下月</button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-[var(--color-border)] rounded-lg overflow-hidden">
        {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
          <div key={d} className="bg-secondary px-2 py-2 text-center text-xs font-medium text-secondary">{d}</div>
        ))}
        {cells.map((day, i) => {
          const dateStr = day ? monthStart.date(day).format('YYYY-MM-DD') : ''
          const dayVisits = dateStr ? visitsByDate[dateStr] ?? [] : []
          return (
            <div key={i} className={cn('bg-card min-h-[80px] p-1.5', !day && 'bg-secondary/50')}>
              {day && <div className="text-xs text-secondary mb-1">{day}</div>}
              {dayVisits.map((v, vi) => (
                <div key={v.id} className={cn('rounded px-1 py-0.5 mb-0.5 text-[10px] text-white truncate', CALENDAR_COLORS[vi % CALENDAR_COLORS.length])} title={`${getKolName(v.kolId)} - ${getStoreName(v.storeId)}`}>
                  {getKolName(v.kolId)}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ScheduleList() {
  const navigate = useNavigate()
  const { storeVisits, kols, stores } = useAppStore()
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [storeFilter, setStoreFilter] = useState('')
  const [kolFilter, setKolFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => {
    return storeVisits.filter((v) => {
      if (storeFilter && v.storeId !== storeFilter) return false
      if (kolFilter && v.kolId !== kolFilter) return false
      if (statusFilter && v.status !== statusFilter) return false
      if (dateFrom && v.visitDate < dateFrom) return false
      if (dateTo && v.visitDate > dateTo) return false
      return true
    })
  }, [storeVisits, storeFilter, kolFilter, statusFilter, dateFrom, dateTo])

  return (
    <div className="p-6">
      <PageHeader title="探店排期" actionLabel="创建探店任务" onAction={() => navigate('/schedule/create')} />
      <FilterBar
        stores={stores} kols={kols}
        storeFilter={storeFilter} setStoreFilter={setStoreFilter}
        kolFilter={kolFilter} setKolFilter={setKolFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
      />
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setViewMode('list')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors', viewMode === 'list' ? 'bg-[var(--color-accent)] text-white' : 'bg-secondary text-secondary hover:bg-hover')}>
          <List size={14} />列表
        </button>
        <button onClick={() => setViewMode('calendar')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors', viewMode === 'calendar' ? 'bg-[var(--color-accent)] text-white' : 'bg-secondary text-secondary hover:bg-hover')}>
          <Calendar size={14} />日历
        </button>
      </div>
      {viewMode === 'list' ? <ListView visits={filtered} kols={kols} stores={stores} /> : <CalendarView visits={filtered} kols={kols} stores={stores} />}
    </div>
  )
}
