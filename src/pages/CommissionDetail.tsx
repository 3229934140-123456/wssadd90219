import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, AlertTriangle, ChevronDown, ChevronUp, Phone, Ticket, Store, Clock, MessageSquare, RefreshCw, Link2, Calendar } from 'lucide-react'
import { useAppStore } from '@/store'
import StatusBadge from '@/components/StatusBadge'
import {
  CATEGORY_LABELS,
  DEDUCTION_TYPE_LABELS,
  COMMISSION_STATUS_LABELS,
  MATCH_TYPE_LABELS,
  type CommissionStatus,
  type DeductionType,
} from '@/types'

const STATUS_VARIANT_MAP: Record<CommissionStatus, 'default' | 'warning' | 'info' | 'success' | 'danger'> = {
  draft: 'default',
  submitted: 'warning',
  reviewed: 'info',
  approved: 'success',
  rejected: 'danger',
  paid: 'success',
}

const DEDUCTION_VARIANT_MAP: Record<DeductionType, 'bg-red-500/15 text-red-400' | 'bg-orange-500/15 text-orange-400' | 'bg-amber-500/15 text-amber-400'> = {
  refund: 'bg-red-500/15 text-red-400',
  duplicate: 'bg-orange-500/15 text-orange-400',
  no_deal: 'bg-amber-500/15 text-amber-400',
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
  const { commissions, getKOLById, getStoreById, getMatchById, getLeadById, updateCommission, recalcAllCommissionTotals } = useAppStore()

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [expandedDeductions, setExpandedDeductions] = useState<Set<string>>(new Set())

  const itemRefs = useRef<Record<string, HTMLTableRowElement | null>>({})
  const deductionRefs = useRef<Record<string, HTMLTableRowElement | null>>({})

  function getDeductionForItem(matchId: string) {
    return commission.deductions.find((d) => d.relatedMatchId === matchId)
  }

  function getItemForDeduction(matchId: string) {
    return commission.items.find((i) => i.matchResultId === matchId)
  }

  function scrollToDeduction(deductionId: string) {
    setExpandedDeductions((prev) => new Set(prev).add(deductionId))
    requestAnimationFrame(() => {
      deductionRefs.current[deductionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  function scrollToItem(itemId: string) {
    setExpandedItems((prev) => new Set(prev).add(itemId))
    requestAnimationFrame(() => {
      itemRefs.current[itemId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const commission = commissions.find((c) => c.id === id)

  const itemsTotal = useMemo(() => {
    if (!commission) return 0
    return Math.round(commission.items.reduce((s, i) => s + i.commissionAmount, 0) * 100) / 100
  }, [commission])

  const deductionsTotal = useMemo(() => {
    if (!commission) return 0
    return Math.round(commission.deductions.reduce((s, d) => s + d.amount, 0) * 100) / 100
  }, [commission])

  const netAmount = useMemo(() => {
    return Math.round((itemsTotal - deductionsTotal) * 100) / 100
  }, [itemsTotal, deductionsTotal])

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
  const storeVisit = useMemo(() => {
    // storeVisitId 存在，但 store 要从 storeVisit 里拿
    // 这里用 getStoreById 传 storeId 更准，但我们需要先找到 storeVisit
    const { storeVisits } = useAppStore.getState()
    return storeVisits.find((v) => v.id === commission.storeVisitId)
  }, [commission.storeVisitId])
  const store = storeVisit ? getStoreById(storeVisit.storeId) : undefined

  const displayAmount = netAmount

  function toggleItem(id: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleDeduction(id: string) {
    setExpandedDeductions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAction(newStatus: CommissionStatus) {
    updateCommission(commission.id, { status: newStatus })
  }

  function handleResolveDispute() {
    updateCommission(commission.id, { isDisputed: false, disputeReason: undefined })
  }

  function handleRecalc() {
    recalcAllCommissionTotals()
  }

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate('/commission')} className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={16} /> 返回列表
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">{kol?.name ?? '-'}</h1>
          <p className="text-secondary text-sm mt-1">
            期间：{commission.period}
            {store && <span className="mx-2">·</span>}
            {store?.name}
          </p>
          {commission.recalcAt && (
            <p className="text-xs text-muted mt-1 flex items-center gap-1">
              <Calendar size={12} />
              最后校准：{commission.recalcAt}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <StatusBadge
            status={COMMISSION_STATUS_LABELS[commission.status]}
            colorMap={Object.fromEntries(
              Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => [v, STATUS_VARIANT_MAP[k as CommissionStatus]])
            )}
          />
          <p className="text-3xl font-mono font-bold text-primary">¥{displayAmount.toLocaleString()}</p>
          <button
            onClick={handleRecalc}
            className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
          >
            <RefreshCw size={12} /> 重新校准金额
          </button>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-primary">佣金明细</h2>
          <span className="text-xs text-muted">共 {commission.items.length} 条</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-default">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary text-left">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 font-medium">项目类别</th>
                <th className="px-4 py-3 font-medium">成交金额</th>
                <th className="px-4 py-3 font-medium">提成比例</th>
                <th className="px-4 py-3 font-medium">佣金金额</th>
                <th className="px-4 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {commission.items.map((item) => {
                const match = getMatchById(item.matchResultId)
                const lead = match ? getLeadById(match.leadId) : undefined
                const isExpanded = expandedItems.has(item.id)
                const isRefunded = match?.isRefunded
                const isDuplicate = match?.isDuplicate
                const hasIssue = isRefunded || isDuplicate
                const relatedDeduction = hasIssue && match ? getDeductionForItem(match.id) : undefined
                return (
                  <>
                    <tr
                      key={item.id}
                      ref={(el) => { itemRefs.current[item.id] = el }}
                      className={`border-t border-default bg-card ${isExpanded ? 'bg-hover' : 'hover:bg-hover'} transition-colors cursor-pointer`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <td className="px-4 py-3 text-muted">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td className="px-4 py-3 text-primary">{CATEGORY_LABELS[item.projectCategory]}</td>
                      <td className="px-4 py-3 text-primary font-mono">¥{item.baseAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-primary font-mono">{(item.rate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-primary font-mono">¥{item.commissionAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {isRefunded && (
                          <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/15 text-red-400">已退款</span>
                        )}
                        {isDuplicate && (
                          <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-orange-500/15 text-orange-400">重复</span>
                        )}
                        {!hasIssue && (
                          <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-500/15 text-emerald-400">正常</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && match && (
                      <tr key={`${item.id}-expand`} className="bg-card">
                        <td colSpan={6} className="px-8 py-3 border-t border-dashed border-[var(--color-border)]">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">手机号：</span>
                              <span className="text-primary font-mono">{lead?.phone ?? '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ticket size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">券码：</span>
                              <span className="text-primary font-mono">{lead?.couponCode ?? '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Store size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">门店：</span>
                              <span className="text-primary">{store?.name ?? '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">成交时间：</span>
                              <span className="text-primary">{lead?.time ?? '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">匹配方式：</span>
                              <span className="text-primary">{MATCH_TYPE_LABELS[match.matchType]}</span>
                            </div>
                            <div className="flex items-start gap-2 col-span-2 md:col-span-3">
                              <MessageSquare size={14} className="text-muted shrink-0 mt-0.5" />
                              <span className="text-secondary">客服备注：</span>
                              <span className="text-primary break-all">{lead?.remark ?? '-'}</span>
                            </div>
                            {isRefunded && (
                              <div className="flex items-center gap-2 col-span-2 md:col-span-3">
                                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                                <span className="text-red-400 text-xs">该笔成交已退款，将在扣减项中对应扣除</span>
                                {relatedDeduction && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); scrollToDeduction(relatedDeduction.id) }}
                                    className="ml-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                  >
                                    <Link2 size={10} /> 查看对应扣减
                                  </button>
                                )}
                              </div>
                            )}
                            {isDuplicate && (
                              <div className="flex items-center gap-2 col-span-2 md:col-span-3">
                                <AlertTriangle size={14} className="text-orange-400 shrink-0" />
                                <span className="text-orange-400 text-xs">跨门店重复线索，将在扣减项中对应扣除</span>
                                {relatedDeduction && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); scrollToDeduction(relatedDeduction.id) }}
                                    className="ml-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                                  >
                                    <Link2 size={10} /> 查看对应扣减
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {commission.items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">暂无明细</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-primary">扣减明细</h2>
          <span className="text-xs text-muted">共 {commission.deductions.length} 条</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-default">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary text-left">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3 font-medium">扣减类型</th>
                <th className="px-4 py-3 font-medium">金额</th>
                <th className="px-4 py-3 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {commission.deductions.map((d) => {
                const match = d.relatedMatchId ? getMatchById(d.relatedMatchId) : undefined
                const lead = match ? getLeadById(match.leadId) : undefined
                const isExpanded = expandedDeductions.has(d.id)
                const relatedItem = match ? getItemForDeduction(match.id) : undefined
                return (
                  <>
                    <tr
                      key={d.id}
                      ref={(el) => { deductionRefs.current[d.id] = el }}
                      className={`border-t border-default bg-card ${isExpanded ? 'bg-hover' : 'hover:bg-hover'} transition-colors cursor-pointer`}
                      onClick={() => toggleDeduction(d.id)}
                    >
                      <td className="px-4 py-3 text-muted">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${DEDUCTION_VARIANT_MAP[d.type]}`}>
                          {DEDUCTION_TYPE_LABELS[d.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-primary font-mono text-red-400">-¥{d.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-secondary">{d.description}</td>
                    </tr>
                    {isExpanded && match && (
                      <tr key={`${d.id}-expand`} className="bg-card">
                        <td colSpan={4} className="px-8 py-3 border-t border-dashed border-[var(--color-border)]">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">手机号：</span>
                              <span className="text-primary font-mono">{lead?.phone ?? '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ticket size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">券码：</span>
                              <span className="text-primary font-mono">{lead?.couponCode ?? '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Store size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">门店：</span>
                              <span className="text-primary">{store?.name ?? '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">成交时间：</span>
                              <span className="text-primary">{lead?.time ?? '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare size={14} className="text-muted shrink-0" />
                              <span className="text-secondary">项目：</span>
                              <span className="text-primary">{CATEGORY_LABELS[match.projectCategory]}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-secondary">对应佣金：</span>
                              <span className="text-primary font-mono">¥{d.amount.toLocaleString()}</span>
                            </div>
                            {relatedItem && (
                              <div className="flex items-center gap-2 col-span-2 md:col-span-3">
                                <Link2 size={14} className="text-[var(--color-accent)] shrink-0" />
                                <span className="text-secondary">该扣减对应佣金明细中的异常项：</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); scrollToItem(relatedItem.id) }}
                                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors"
                                >
                                  查看原始明细
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {commission.deductions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">暂无扣减</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end gap-6 p-4 bg-secondary rounded-lg border border-default">
        <div className="flex items-center gap-2">
          <span className="text-secondary">明细合计：</span>
          <span className="font-mono text-primary">¥{itemsTotal.toLocaleString()}</span>
        </div>
        <span className="text-muted text-lg">−</span>
        <div className="flex items-center gap-2">
          <span className="text-secondary">扣减合计：</span>
          <span className="font-mono text-primary">¥{deductionsTotal.toLocaleString()}</span>
        </div>
        <span className="text-muted text-lg">=</span>
        <div className="flex items-center gap-2">
          <span className="text-secondary text-base">应结净额：</span>
          <span className="font-mono text-lg font-bold text-[var(--color-accent)]">¥{displayAmount.toLocaleString()}</span>
        </div>
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
