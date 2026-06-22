import { useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Clock, ShieldCheck, CreditCard, UserCheck, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store'
import { CATEGORY_LABELS, DEDUCTION_TYPE_LABELS, COMMISSION_STATUS_LABELS } from '@/types'
import type { ProjectCategory, CommissionCalc } from '@/types'

export default function Statement() {
  const { kolId, commissionId } = useParams<{ kolId?: string; commissionId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { getKOLById, getCommissionsByKOL, commissions } = useAppStore()

  const isSingle = !!commissionId
  const fromFinance = searchParams.get('from') === 'finance'

  const period = searchParams.get('period') ?? ''

  let kolName = ''
  let statementPeriod = ''
  let commissionList: CommissionCalc[] = []
  let displayCommission: CommissionCalc | null = null

  if (isSingle) {
    const c = commissions.find((x) => x.id === commissionId)
    if (c) {
      displayCommission = c
      commissionList = [c]
      const kol = getKOLById(c.kolId)
      kolName = kol?.name ?? '-'
      statementPeriod = c.period
    }
  } else {
    const kol = getKOLById(kolId ?? '')
    kolName = kol?.name ?? '-'
    statementPeriod = period
    commissionList = getCommissionsByKOL(kolId ?? '').filter((c) => c.period === period)
  }

  const allItems = commissionList.flatMap((c) => c.items)
  const allDeductions = commissionList.flatMap((c) => c.deductions)
  const hasDispute = commissionList.some((c) => c.isDisputed)
  const recalcAt = useMemo(() => {
    const dates = commissionList.map((c) => c.recalcAt).filter(Boolean) as string[]
    return dates.length > 0 ? dates.sort().reverse()[0] : null
  }, [commissionList])

  const summary = useMemo(() => {
    const totalCommission = allItems.reduce((s, i) => s + i.commissionAmount, 0)
    const totalDeductions = allDeductions.reduce((s, d) => s + d.amount, 0)
    return {
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netPayable: Math.round((totalCommission - totalDeductions) * 100) / 100,
    }
  }, [allItems, allDeductions])

  const categoryTotals = useMemo(() => {
    const map = new Map<ProjectCategory, { amount: number; rate: number; commission: number }>()
    allItems.forEach((item) => {
      const existing = map.get(item.projectCategory)
      if (existing) {
        existing.amount += item.baseAmount
        existing.commission += item.commissionAmount
      } else {
        map.set(item.projectCategory, {
          amount: item.baseAmount,
          rate: item.rate,
          commission: item.commissionAmount,
        })
      }
    })
    return Array.from(map.entries()).map(([category, data]) => ({ category, ...data }))
  }, [allItems])

  if (!isSingle && !kolId) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
        参数错误
      </div>
    )
  }

  const statusLabel = displayCommission ? COMMISSION_STATUS_LABELS[displayCommission.status] : null

  function handleBack() {
    if (fromFinance) {
      navigate('/finance')
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="p-6 min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--color-accent)' }}
        >
          <ArrowLeft size={16} />
          {fromFinance ? '返回财务列表' : '返回'}
        </button>
        {isSingle && displayCommission && (
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              创建时间：{displayCommission.createdAt}
            </div>
            {statusLabel && (
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} />
                状态：{statusLabel}
              </div>
            )}
            {displayCommission.approver && (
              <div className="flex items-center gap-1.5">
                <UserCheck size={12} />
                审批人：{displayCommission.approver}
              </div>
            )}
            {displayCommission.approvedAt && (
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} />
                终审时间：{displayCommission.approvedAt}
              </div>
            )}
            {displayCommission.paidAt && (
              <div className="flex items-center gap-1.5">
                <CreditCard size={12} />
                打款时间：{displayCommission.paidAt}
              </div>
            )}
            {recalcAt && (
              <div className="flex items-center gap-1.5" style={{ color: 'var(--color-accent)' }}>
                <RotateCcw size={12} />
                最后校准：{recalcAt}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto bg-white text-gray-900 rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold">对账单</h1>
          <p className="mt-2 text-gray-600">
            达人：{kolName} | 期间：{statementPeriod}
            {isSingle && displayCommission && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                <FileText size={12} /> 单据号：{commissionId}
              </span>
            )}
          </p>
          {!isSingle && (
            <p className="mt-1 text-xs text-gray-400">
              本月共 {commissionList.length} 张试算单合并
            </p>
          )}
          {recalcAt && (
            <p className="mt-2 text-xs text-emerald-600 flex items-center justify-center gap-1">
              <RotateCcw size={12} />
              最后校准时间：{recalcAt}
            </p>
          )}
        </div>

        {!isSingle && commissionList.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">合并试算单明细</h3>
            <div className="space-y-2">
              {commissionList.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs bg-white rounded-md px-3 py-2 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-500">{c.id}</span>
                    <span className="text-gray-600">
                      {c.items.length} 条明细 · {c.deductions.length} 条扣减
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      c.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                      c.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'reviewed' ? 'bg-purple-100 text-purple-700' :
                      c.status === 'submitted' ? 'bg-amber-100 text-amber-700' :
                      c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {c.status === 'paid' ? '已打款' : COMMISSION_STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/commission/${c.id}`)}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      试算单
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => navigate(`/statement/single/${c.id}`)}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      单据对账单
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">佣金总额</div>
            <div className="text-lg font-bold text-gray-900">
              ¥{summary.totalCommission.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">扣减总额</div>
            <div className="text-lg font-bold text-red-600">
              -¥{summary.totalDeductions.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg">
            <div className="text-xs text-gray-500">应结净额</div>
            <div className="text-lg font-bold text-emerald-600">
              ¥{summary.netPayable.toLocaleString()}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">佣金明细</h2>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-3 py-2 font-medium text-gray-700">序号</th>
                <th className="text-left px-3 py-2 font-medium text-gray-700">项目类别</th>
                <th className="text-right px-3 py-2 font-medium text-gray-700">成交金额</th>
                <th className="text-right px-3 py-2 font-medium text-gray-700">提成比例</th>
                <th className="text-right px-3 py-2 font-medium text-gray-700">佣金金额</th>
              </tr>
            </thead>
            <tbody>
              {categoryTotals.map((row, idx) => (
                <tr key={row.category} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                  <td className="px-3 py-2">{CATEGORY_LABELS[row.category]}</td>
                  <td className="px-3 py-2 text-right font-mono">¥{row.amount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono">{(row.rate * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-right font-mono">¥{row.commission.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td colSpan={4} className="px-3 py-2 text-right">合计</td>
                <td className="px-3 py-2 text-right font-mono">
                  ¥{summary.totalCommission.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {allDeductions.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3">扣减明细</h2>
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-3 py-2 font-medium text-gray-700">扣减类型</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-700">金额</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700">说明</th>
                </tr>
              </thead>
              <tbody>
                {allDeductions.map((d) => (
                  <tr key={d.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{DEDUCTION_TYPE_LABELS[d.type]}</td>
                    <td className="px-3 py-2 text-right font-mono text-red-600">
                      -¥{d.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{d.description}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="px-3 py-2">扣减合计</td>
                  <td className="px-3 py-2 text-right font-mono text-red-600">
                    -¥{summary.totalDeductions.toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {hasDispute && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">争议事项</h3>
            {commissionList
              .filter((c) => c.isDisputed)
              .map((c) => (
                <p key={c.id} className="text-sm text-amber-700">{c.disputeReason}</p>
              ))}
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-base font-semibold mb-4">签章区域</h2>
          <div className="grid grid-cols-4 gap-6">
            {['市场签章', '主管签章', '财务签章', '日期'].map((label) => (
              <div
                key={label}
                className="border border-dashed border-gray-300 rounded-lg p-4 text-center min-h-[60px] flex items-center justify-center"
              >
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
