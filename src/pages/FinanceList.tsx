import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, CreditCard, FileText, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { useAppStore } from '@/store'

type FinanceTab = 'reviewed' | 'approved' | 'paid'

const TAB_LABELS: Record<FinanceTab, string> = {
  reviewed: '待终审',
  approved: '已终审',
  paid: '已打款',
}

const TABS: FinanceTab[] = ['reviewed', 'approved', 'paid']

export default function FinanceList() {
  const navigate = useNavigate()
  const { commissions, kols, stores, storeVisits, updateCommission } = useAppStore()
  const [activeTab, setActiveTab] = useState<FinanceTab>('reviewed')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const getKOLName = (kolId: string) => kols.find((k) => k.id === kolId)?.name ?? '-'
  const getStoreName = (svId: string) => {
    const sv = storeVisits.find((v) => v.id === svId)
    if (!sv) return '-'
    return stores.find((s) => s.id === sv.storeId)?.name ?? '-'
  }

  const filtered = commissions.filter((c) => {
    if (activeTab === 'reviewed') return c.status === 'reviewed'
    if (activeTab === 'approved') return c.status === 'approved' && !c.paidAt
    if (activeTab === 'paid') return c.status === 'approved' && !!c.paidAt
    return false
  })

  const tabCount = (tab: FinanceTab) => commissions.filter((c) => {
    if (tab === 'reviewed') return c.status === 'reviewed'
    if (tab === 'approved') return c.status === 'approved' && !c.paidAt
    return c.status === 'approved' && !!c.paidAt
  }).length

  function handleApprove(id: string) {
    updateCommission(id, {
      status: 'approved',
      approver: '财务确认',
      approvedAt: new Date().toISOString().slice(0, 10),
    })
  }

  function handleReject(id: string) {
    updateCommission(id, { status: 'rejected' })
  }

  function handleConfirmPay(id: string) {
    updateCommission(id, { paidAt: new Date().toISOString().slice(0, 10) })
    setConfirmId(null)
  }

  const colSpan = activeTab === 'reviewed' ? 6 : 6

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="财务确认" />

      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={activeTab === tab
              ? { background: 'var(--color-accent)', color: '#fff' }
              : { color: 'var(--color-text-secondary)' }
            }
          >
            {TAB_LABELS[tab]}
            <span className="ml-1.5 text-xs opacity-75">{tabCount(tab)}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-bg-card)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>达人</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>任务</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>期间</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>应结金额</th>
              {activeTab === 'reviewed' && (
                <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>争议标记</th>
              )}
              {activeTab === 'approved' && (
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>终审时间</th>
              )}
              {activeTab === 'paid' && (
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>打款时间</th>
              )}
              <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>{getKOLName(c.kolId)}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{getStoreName(c.storeVisitId)}</td>
                <td className="px-4 py-3 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{c.period}</td>
                <td className="px-4 py-3 text-right font-mono font-medium" style={{ color: 'var(--color-accent)' }}>
                  ¥{c.totalAmount.toLocaleString()}
                </td>
                {activeTab === 'reviewed' && (
                  <td className="px-4 py-3 text-center">
                    {c.isDisputed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        <AlertTriangle size={12} /> 有争议
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>无</span>
                    )}
                  </td>
                )}
                {activeTab === 'approved' && (
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{c.approvedAt ?? '-'}</td>
                )}
                {activeTab === 'paid' && (
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{c.paidAt ?? '-'}</td>
                )}
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    {activeTab === 'reviewed' && (
                      <>
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-colors"
                        >
                          <CheckCircle size={13} /> 终审通过
                        </button>
                        <button
                          onClick={() => handleReject(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-colors"
                        >
                          <XCircle size={13} /> 驳回
                        </button>
                      </>
                    )}
                    {activeTab === 'approved' && (
                      <>
                        <button
                          onClick={() => setConfirmId(c.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
                        >
                          <CreditCard size={13} /> 确认打款
                        </button>
                        <button
                          onClick={() => navigate(`/statement/${c.kolId}?period=${c.period}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                        >
                          <FileText size={13} /> 查看对账单
                        </button>
                      </>
                    )}
                    {activeTab === 'paid' && (
                      <button
                        onClick={() => navigate(`/statement/${c.kolId}?period=${c.period}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                      >
                        <FileText size={13} /> 查看对账单
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setConfirmId(null)}>
          <div className="w-full max-w-sm rounded-xl p-6 space-y-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>确认打款</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>确认已对该笔佣金执行打款操作？此操作不可撤销。</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 rounded-md text-sm"
                style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              >
                取消
              </button>
              <button
                onClick={() => handleConfirmPay(confirmId)}
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
