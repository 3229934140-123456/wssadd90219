import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, Plus, X, AlertTriangle, Calendar } from 'lucide-react'
import { useAppStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import {
  COMMISSION_STATUS_LABELS,
  type CommissionStatus,
} from '@/types'

const STATUS_VARIANT_MAP: Record<CommissionStatus, 'default' | 'warning' | 'info' | 'success' | 'danger'> = {
  draft: 'default',
  submitted: 'warning',
  reviewed: 'info',
  approved: 'success',
  rejected: 'danger',
  paid: 'success',
}

const STATUS_TABS: (CommissionStatus | 'all')[] = ['all', 'draft', 'submitted', 'reviewed', 'approved', 'rejected', 'paid']
const TAB_LABELS: Record<CommissionStatus | 'all', string> = {
  all: '全部',
  draft: '草稿',
  submitted: '已提交',
  reviewed: '已复核',
  approved: '已终审',
  rejected: '已驳回',
  paid: '已打款',
}

export default function CommissionList() {
  const navigate = useNavigate()
  const { commissions, kols, stores, storeVisits, createCommissionCalc } = useAppStore()

  const [statusTab, setStatusTab] = useState<CommissionStatus | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formKolId, setFormKolId] = useState('')
  const [formVisitId, setFormVisitId] = useState('')
  const [formPeriod, setFormPeriod] = useState('')

  const getKolName = (id: string) => kols.find((k) => k.id === id)?.name ?? '-'
  const getStoreName = (id: string) => stores.find((s) => s.id === id)?.name ?? '-'
  const getVisitLabel = (id: string) => {
    const v = storeVisits.find((x) => x.id === id)
    if (!v) return id
    return `${v.visitDate} · ${getStoreName(v.storeId)}`
  }

  const filtered = useMemo(() => {
    return commissions.filter((c) => {
      if (statusTab !== 'all' && c.status !== statusTab) return false
      return true
    })
  }, [commissions, statusTab])

  function handleCreate() {
    if (!formKolId || !formVisitId || !formPeriod) return
    const calc = createCommissionCalc(formKolId, formVisitId, formPeriod)
    setShowCreateModal(false)
    setFormKolId('')
    setFormVisitId('')
    setFormPeriod('')
    navigate(`/commission/${calc.id}`)
  }

  const visitOptions = formKolId
    ? storeVisits.filter((v) => v.kolId === formKolId)
    : storeVisits

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="佣金试算"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Calculator size={16} /> 发起试算
          </button>
        }
      />

      <div className="flex gap-1 p-1 bg-secondary rounded-lg border border-default">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusTab === tab
                ? 'bg-card text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-secondary text-left">
              <th className="px-4 py-3 font-medium">达人</th>
              <th className="px-4 py-3 font-medium">任务</th>
              <th className="px-4 py-3 font-medium">期间</th>
              <th className="px-4 py-3 font-medium">明细数</th>
              <th className="px-4 py-3 font-medium">扣减数</th>
              <th className="px-4 py-3 font-medium">应结金额</th>
              <th className="px-4 py-3 font-medium">最后校准</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">争议</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-default bg-card hover:bg-hover transition-colors">
                <td className="px-4 py-3 text-primary">{getKolName(c.kolId)}</td>
                <td className="px-4 py-3 text-primary text-xs">{getVisitLabel(c.storeVisitId)}</td>
                <td className="px-4 py-3 text-primary">{c.period}</td>
                <td className="px-4 py-3 text-primary font-mono">{c.items.length}</td>
                <td className="px-4 py-3 text-primary font-mono">{c.deductions.length}</td>
                <td className="px-4 py-3 text-primary font-mono font-semibold">¥{c.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-muted flex items-center gap-1">
                  {c.recalcAt ? (
                    <>
                      <Calendar size={12} />
                      {c.recalcAt}
                    </>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={COMMISSION_STATUS_LABELS[c.status]}
                    colorMap={Object.fromEntries(
                      Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => [v, STATUS_VARIANT_MAP[k as CommissionStatus]])
                    )}
                  />
                </td>
                <td className="px-4 py-3">
                  {c.isDisputed && (
                    <AlertTriangle size={16} className="text-orange-400" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/commission/${c.id}`)}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors"
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-muted">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md rounded-xl p-6 space-y-5" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">发起试算</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded text-muted"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1 text-secondary">选择达人</label>
                <select value={formKolId} onChange={(e) => { setFormKolId(e.target.value); setFormVisitId('') }} className="w-full bg-card border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
                  <option value="">请选择达人</option>
                  {kols.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 text-secondary">选择到店记录</label>
                <select value={formVisitId} onChange={(e) => setFormVisitId(e.target.value)} className="w-full bg-card border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
                  <option value="">请选择到店记录</option>
                  {visitOptions.map((v) => (
                    <option key={v.id} value={v.id}>{v.visitDate} - {stores.find((s) => s.id === v.storeId)?.name ?? v.storeId}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 text-secondary">试算期间</label>
                <input
                  type="month"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className="w-full bg-card border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
            <p className="text-xs text-muted bg-card rounded-md px-3 py-2">
              系统将自动根据匹配结果生成佣金明细，并按项目类别计算提成比例，自动扣除退款、重复和未成单。
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-md text-sm bg-card text-secondary border border-default">取消</button>
              <button onClick={handleCreate} disabled={!formKolId || !formVisitId || !formPeriod} className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--color-accent)] text-white disabled:opacity-50">
                <Plus size={14} className="inline mr-1" />创建并试算
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
