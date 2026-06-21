import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store'
import StatusBadge from '@/components/StatusBadge'
import {
  CATEGORY_LABELS,
  DEDUCTION_TYPE_LABELS,
  COMMISSION_STATUS_LABELS,
  type CommissionStatus,
} from '@/types'

const STATUS_VARIANT_MAP: Record<CommissionStatus, 'default' | 'warning' | 'info' | 'success' | 'danger'> = {
  draft: 'default',
  submitted: 'warning',
  reviewed: 'info',
  approved: 'success',
  rejected: 'danger',
}

const APPROVAL_STEPS = [
  { key: 'submitted', label: '市场专员提交' },
  { key: 'reviewed', label: '运营主管复核' },
  { key: 'approved', label: '财务终审' },
]

function getStepStatus(step: string, current: CommissionStatus): 'completed' | 'current' | 'pending' {
  const order: CommissionStatus[] = ['draft', 'submitted', 'reviewed', 'approved']
  const stepIdx = order.indexOf(step as CommissionStatus)
  const currentIdx = order.indexOf(current)
  if (current === 'rejected') {
    if (stepIdx <= currentIdx) return 'completed'
    return 'pending'
  }
  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'current'
  return 'pending'
}

export default function CommissionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { commissions, getKOLById, getStoreById, updateCommission } = useAppStore()

  const commission = commissions.find((c) => c.id === id)

  const itemsTotal = useMemo(() => {
    if (!commission) return 0
    return commission.items.reduce((s, i) => s + i.commissionAmount, 0)
  }, [commission])

  const deductionsTotal = useMemo(() => {
    if (!commission) return 0
    return commission.deductions.reduce((s, d) => s + d.amount, 0)
  }, [commission])

  if (!commission) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/commission')} className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-4">
          <ArrowLeft size={16} /> 返回列表
        </button>
        <p className="text-muted text-center py-20">未找到该佣金试算记录</p>
      </div>
    )
  }

  const kol = getKOLById(commission.kolId)
  const netAmount = itemsTotal - deductionsTotal

  function handleAction(newStatus: CommissionStatus) {
    updateCommission(commission.id, { status: newStatus })
  }

  function handleResolveDispute() {
    updateCommission(commission.id, { isDisputed: false, disputeReason: undefined })
  }

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate('/commission')} className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> 返回列表
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{kol?.name ?? '-'}</h1>
          <p className="text-secondary text-sm mt-1">期间：{commission.period}</p>
        </div>
        <div className="text-right">
          <StatusBadge
            status={COMMISSION_STATUS_LABELS[commission.status]}
            colorMap={Object.fromEntries(
              Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => [v, STATUS_VARIANT_MAP[k as CommissionStatus]])
            )}
          />
          <p className="text-3xl font-mono font-bold text-primary mt-2">¥{commission.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 bg-secondary rounded-lg border border-default">
        {APPROVAL_STEPS.map((step, idx) => {
          const stepStatus = getStepStatus(step.key, commission.status)
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                  stepStatus === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                  stepStatus === 'current' ? 'bg-amber-500/20 border-amber-500 text-amber-400' :
                  'bg-card border-[var(--color-border)] text-muted'
                }`}>
                  {stepStatus === 'completed' ? <Check size={16} /> : idx + 1}
                </div>
                <span className="text-xs mt-2 text-secondary text-center">{step.label}</span>
              </div>
              {idx < APPROVAL_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 rounded ${stepStatus === 'completed' ? 'bg-emerald-500' : 'bg-[var(--color-border)]'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-primary mb-3">佣金明细</h2>
        <div className="overflow-x-auto rounded-lg border border-default">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary text-left">
                <th className="px-4 py-3 font-medium">项目类别</th>
                <th className="px-4 py-3 font-medium">成交金额</th>
                <th className="px-4 py-3 font-medium">提成比例</th>
                <th className="px-4 py-3 font-medium">佣金金额</th>
              </tr>
            </thead>
            <tbody>
              {commission.items.map((item) => (
                <tr key={item.id} className="border-t border-default bg-card">
                  <td className="px-4 py-3 text-primary">{CATEGORY_LABELS[item.projectCategory]}</td>
                  <td className="px-4 py-3 text-primary font-mono">¥{item.baseAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-primary font-mono">{(item.rate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-primary font-mono">¥{item.commissionAmount.toLocaleString()}</td>
                </tr>
              ))}
              {commission.items.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">暂无明细</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-primary mb-3">扣减明细</h2>
        <div className="overflow-x-auto rounded-lg border border-default">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary text-left">
                <th className="px-4 py-3 font-medium">扣减类型</th>
                <th className="px-4 py-3 font-medium">金额</th>
                <th className="px-4 py-3 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {commission.deductions.map((d) => (
                <tr key={d.id} className="border-t border-default bg-card">
                  <td className="px-4 py-3 text-primary">{DEDUCTION_TYPE_LABELS[d.type]}</td>
                  <td className="px-4 py-3 text-primary font-mono">¥{d.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-secondary">{d.description}</td>
                </tr>
              ))}
              {commission.deductions.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted">暂无扣减</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 p-4 bg-secondary rounded-lg border border-default">
        <span className="text-secondary">明细合计：</span>
        <span className="font-mono text-primary">¥{itemsTotal.toLocaleString()}</span>
        <span className="text-secondary">-</span>
        <span className="text-secondary">扣减合计：</span>
        <span className="font-mono text-primary">¥{deductionsTotal.toLocaleString()}</span>
        <span className="text-secondary">=</span>
        <span className="font-mono text-lg font-bold text-primary">¥{netAmount.toLocaleString()}</span>
      </div>

      {commission.status === 'draft' && (
        <div className="flex justify-end">
          <button onClick={() => handleAction('submitted')} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors">
            提交审核
          </button>
        </div>
      )}

      {commission.status === 'submitted' && (
        <div className="flex justify-end gap-3">
          <button onClick={() => handleAction('rejected')} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors">
            驳回
          </button>
          <button onClick={() => handleAction('reviewed')} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors">
            复核通过
          </button>
        </div>
      )}

      {commission.status === 'reviewed' && (
        <div className="flex justify-end gap-3">
          <button onClick={() => handleAction('rejected')} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors">
            驳回
          </button>
          <button onClick={() => handleAction('approved')} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors">
            终审通过
          </button>
        </div>
      )}

      {commission.isDisputed && (
        <div className="p-4 rounded-lg border-2 border-orange-500/40 bg-orange-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-400">争议标记</h3>
              <p className="text-secondary text-sm mt-1">{commission.disputeReason ?? '无说明'}</p>
            </div>
            <button
              onClick={handleResolveDispute}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 transition-colors shrink-0"
            >
              标记已解决
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
