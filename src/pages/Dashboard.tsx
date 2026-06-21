import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Users, MapPin, DollarSign, TrendingUp, AlertTriangle, ClipboardCheck } from 'lucide-react'
import dayjs from 'dayjs'
import { useAppStore } from '@/store'
import { monthlyROI } from '@/data/mockData'
import StatCard from '@/components/StatCard'

export default function Dashboard() {
  const { kols, storeVisits, commissions, leads, matches } = useAppStore()

  const activeKolCount = useMemo(
    () => kols.filter((k) => k.status === 'active').length,
    [kols],
  )

  const currentMonthVisits = useMemo(
    () => storeVisits.filter((v) => dayjs(v.visitDate).isSame(dayjs(), 'month')).length,
    [storeVisits],
  )

  const pendingCommissionTotal = useMemo(
    () => commissions
      .filter((c) => c.status !== 'approved')
      .reduce((sum, c) => sum + c.totalAmount, 0),
    [commissions],
  )

  const avgROI = useMemo(() => {
    if (monthlyROI.length === 0) return 0
    const total = monthlyROI.reduce((s, d) => s + d.roi, 0)
    return (total / monthlyROI.length).toFixed(1)
  }, [])

  const submittedCount = useMemo(
    () => commissions.filter((c) => c.status === 'submitted').length,
    [commissions],
  )
  const reviewedCount = useMemo(
    () => commissions.filter((c) => c.status === 'reviewed').length,
    [commissions],
  )
  const disputedCount = useMemo(
    () => commissions.filter((c) => c.isDisputed).length,
    [commissions],
  )
  const unmatchedLeads = useMemo(
    () => leads.filter((l) => !l.isMatched).length,
    [leads],
  )

  const duplicateCount = useMemo(
    () => matches.filter((m) => m.isDuplicate).length,
    [matches],
  )
  const refundedCount = useMemo(
    () => matches.filter((m) => m.isRefunded).length,
    [matches],
  )

  const chartData = useMemo(
    () => monthlyROI.map((d) => ({
      month: d.month.slice(5),
      commission: d.commission,
      roi: d.roi,
    })),
    [],
  )

  const pendingItems = [
    { label: '待复核佣金', count: submittedCount, color: 'var(--color-warning)', path: '/commissions?status=submitted' },
    { label: '待终审佣金', count: reviewedCount, color: 'var(--color-warning)', path: '/commissions?status=reviewed' },
    { label: '争议待处理', count: disputedCount, color: 'var(--color-danger)', path: '/commissions?disputed=true' },
    { label: '未匹配线索', count: unmatchedLeads, color: 'var(--color-warning)', path: '/leads?matched=false' },
  ]

  const anomalyItems = [
    { label: '跨门店重复线索', count: duplicateCount, color: 'var(--color-danger)' },
    { label: '退款扣减', count: refundedCount, color: 'var(--color-danger)' },
    { label: '未匹配线索', count: unmatchedLeads, color: 'var(--color-warning)' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="合作达人数" value={activeKolCount} icon={Users} trend="up" change={1} />
        <StatCard title="本月探店" value={currentMonthVisits} icon={MapPin} trend="up" change={2} />
        <StatCard
          title="应结佣金"
          value={`¥${pendingCommissionTotal.toLocaleString()}`}
          icon={DollarSign}
          trend="down"
          change={8.5}
        />
        <StatCard title="平均投产比" value={avgROI} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-1 rounded-xl border p-5"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck size={18} style={{ color: 'var(--color-accent)' }} />
            <h3 className="text-white font-semibold">待处理任务</h3>
          </div>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors"
                style={{ background: 'var(--color-bg-hover)', borderLeft: `3px solid ${item.color}` }}
              >
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className="text-sm font-bold text-white">{item.count}</span>
              </Link>
            ))}
          </div>
        </div>

        <div
          className="lg:col-span-1 rounded-xl border p-5"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-danger)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
            <h3 className="text-white font-semibold">异常提醒</h3>
          </div>
          <div className="space-y-3">
            {anomalyItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ background: 'var(--color-bg-hover)', borderLeft: `3px solid ${item.color}` }}
              >
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className="text-sm font-bold text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="lg:col-span-1 rounded-xl border p-5"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="text-white font-semibold mb-4">月度趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} style={{ background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 12 }} domain={[0, 10]} />
              <Tooltip
                contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Bar yAxisId="left" dataKey="commission" fill="#10b981" radius={[4, 4, 0, 0]} name="佣金" />
              <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} name="投产比" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
