import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, X, User, AlertTriangle, FileText, Calendar } from 'lucide-react'
import { useAppStore } from '@/store'
import dayjs from 'dayjs'
import StatusBadge from '@/components/StatusBadge'
import {
  PLATFORM_LABELS, CATEGORY_LABELS, VISIT_STATUS_LABELS,
  COMMISSION_STATUS_LABELS, PRICING_MODEL_LABELS,
  type ProjectCategory,
  type CommissionStatus,
} from '@/types'

const PLATFORM_COLORS: Record<string, string> = {
  douyin: 'bg-gray-800 text-gray-200',
  xiaohongshu: 'bg-red-900/60 text-red-300',
  kuaishou: 'bg-orange-900/60 text-orange-300',
  bilibili: 'bg-pink-900/60 text-pink-300',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-900/40 text-emerald-400',
  inactive: 'bg-gray-700/40 text-gray-400',
}

const COMMISSION_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-700/40 text-gray-400',
  submitted: 'bg-blue-900/40 text-blue-400',
  reviewed: 'bg-amber-900/40 text-amber-400',
  approved: 'bg-emerald-900/40 text-emerald-400',
  rejected: 'bg-red-900/40 text-red-400',
}

const VISIT_STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-900/40 text-blue-400',
  filming: 'bg-amber-900/40 text-amber-400',
  published: 'bg-purple-900/40 text-purple-400',
  completed: 'bg-emerald-900/40 text-emerald-400',
}

const STATUS_VARIANT_MAP: Record<CommissionStatus, 'default' | 'warning' | 'info' | 'success' | 'danger'> = {
  draft: 'default',
  submitted: 'warning',
  reviewed: 'info',
  approved: 'success',
  rejected: 'danger',
  paid: 'success',
}

function formatNumber(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString()
}

const CATEGORIES: ProjectCategory[] = ['filler', 'laser', 'skin', 'surgery', 'other']

export default function KOLDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getKOLById, getStoreById, getStoreVisitsByKOL, getCommissionsByKOL, updateKOL } = useAppStore()

  const kol = getKOLById(id || '')
  const visits = getStoreVisitsByKOL(id || '')
  const commissions = getCommissionsByKOL(id || '')

  const [editingTiers, setEditingTiers] = useState(false)
  const [tierRates, setTierRates] = useState<Record<ProjectCategory, number>>(() => {
    const rates: Record<ProjectCategory, number> = { filler: 0.1, laser: 0.08, skin: 0.06, surgery: 0.12, other: 0.05 }
    kol?.commissionTiers.forEach((t) => { rates[t.category] = t.rate })
    return rates
  })

  const availablePeriods = useMemo(() => {
    return [...new Set(commissions.map((c) => c.period))].sort().reverse()
  }, [commissions])

  const [statementPeriod, setStatementPeriod] = useState(() => {
    return availablePeriods[0] ?? dayjs().format('YYYY-MM')
  })

  const periodCommissions = useMemo(() => {
    return commissions.filter((c) => c.period === statementPeriod)
  }, [commissions, statementPeriod])

  const periodSummary = useMemo(() => {
    const itemsTotal = periodCommissions.reduce((s, c) => s + c.items.reduce((s2, i) => s2 + i.commissionAmount, 0), 0)
    const deductionsTotal = periodCommissions.reduce((s, c) => s + c.deductions.reduce((s2, d) => s2 + d.amount, 0), 0)
    const total = Math.round((itemsTotal - deductionsTotal) * 100) / 100
    return { total, itemsTotal, deductionsTotal }
  }, [periodCommissions])

  if (!kol) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
        未找到达人信息
      </div>
    )
  }

  function saveTiers() {
    const tiers = CATEGORIES.map((cat, i) => ({
      id: `ct-${Date.now()}-${i}`,
      category: cat,
      rate: tierRates[cat],
    }))
    updateKOL(kol.id, { commissionTiers: tiers })
    setEditingTiers(false)
  }

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate('/kol')} className="flex items-center gap-1 text-sm transition-colors" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}>
        <ArrowLeft size={16} /> 返回达人列表
      </button>

      <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-card)' }}>
            <User size={28} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{kol.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[kol.status]}`}>
                {kol.status === 'active' ? '合作中' : '已暂停'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {kol.platforms.map((p) => (
                <span key={p.type} className={`px-2 py-0.5 rounded text-xs ${PLATFORM_COLORS[p.type]}`}>
                  {PLATFORM_LABELS[p.type]} · {formatNumber(p.followers)}
                </span>
              ))}
            </div>
            <div className="flex gap-6 mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <span>电话：{kol.phone}</span>
              <span>入驻日期：{kol.createdAt}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>佣金档位</h3>
          {!editingTiers ? (
            <button onClick={() => { kol.commissionTiers.forEach((t) => setTierRates((prev) => ({ ...prev, [t.category]: t.rate }))); setEditingTiers(true) }} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md" style={{ background: 'var(--color-bg-card)', color: 'var(--color-accent)', border: '1px solid var(--color-border)' }}>
              <Pencil size={12} /> 编辑
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditingTiers(false)} className="text-xs px-3 py-1.5 rounded-md" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>取消</button>
              <button onClick={saveTiers} className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ background: 'var(--color-accent)', color: '#fff' }}>保存</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-5 gap-3">
          {(editingTiers ? CATEGORIES : kol.commissionTiers).map((tier, i) => {
            const cat = 'category' in tier ? tier.category : tier
            const rate = editingTiers ? tierRates[cat] : (kol.commissionTiers.find((t) => t.category === cat)?.rate ?? 0)
            return (
              <div key={cat} className="rounded-lg p-4 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <div className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>{CATEGORY_LABELS[cat]}</div>
                {editingTiers ? (
                  <div className="flex items-center justify-center gap-1">
                    <input type="number" step="0.1" min="0" max="100" value={(tierRates[cat] * 100).toFixed(1)} onChange={(e) => setTierRates({ ...tierRates, [cat]: Number(e.target.value) / 100 })} className="w-16 text-center text-lg font-bold outline-none" style={{ background: 'transparent', color: 'var(--color-accent)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>%</span>
                  </div>
                ) : (
                  <div className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>{(rate * 100).toFixed(0)}%</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>到店记录</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-bg-card)' }}>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>到店日期</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>门店</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>拍摄项目</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>报价方式</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v) => {
              const store = getStoreById(v.storeId)
              return (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-2.5" style={{ color: 'var(--color-text-primary)' }}>{v.visitDate}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{store?.name ?? '-'}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{v.projectTypes.map((pt) => CATEGORY_LABELS[pt as ProjectCategory] ?? pt).join('、')}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>{PRICING_MODEL_LABELS[v.pricingModel]}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VISIT_STATUS_STYLES[v.status]}`}>
                      {VISIT_STATUS_LABELS[v.status]}
                    </span>
                  </td>
                </tr>
              )
            })}
            {visits.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>暂无到店记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>佣金历史</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-muted" />
              <select
                value={statementPeriod}
                onChange={(e) => setStatementPeriod(e.target.value)}
                className="bg-card border border-default rounded-md px-2 py-1 text-xs text-primary focus:outline-none focus:border-[var(--color-accent)]"
              >
                {availablePeriods.length > 0 ? (
                  availablePeriods.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))
                ) : (
                  <option value={statementPeriod}>{statementPeriod}</option>
                )}
              </select>
            </div>
            <button
              onClick={() => navigate(`/statement/${kol.id}?period=${statementPeriod}`)}
              disabled={periodCommissions.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 disabled:opacity-50 transition-colors"
            >
              <FileText size={12} /> 月度汇总对账
            </button>
          </div>
        </div>

        {periodCommissions.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-4 rounded-lg border border-default" style={{ background: 'var(--color-bg-card)' }}>
                <div className="text-xs text-secondary">明细合计</div>
                <div className="text-xl font-bold font-mono text-primary">¥{periodSummary.itemsTotal.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-lg border border-default" style={{ background: 'var(--color-bg-card)' }}>
                <div className="text-xs text-secondary">扣减合计</div>
                <div className="text-xl font-bold font-mono text-red-400">-¥{periodSummary.deductionsTotal.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-lg border border-default" style={{ background: 'var(--color-bg-card)' }}>
                <div className="text-xs text-secondary">应结净额</div>
                <div className="text-xl font-bold font-mono text-[var(--color-accent)]">¥{periodSummary.total.toLocaleString()}</div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-secondary mb-2">本月包含 {periodCommissions.length} 张试算单：</p>
              <div className="space-y-2">
                {periodCommissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs bg-card rounded-md px-3 py-2 border border-default">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted">{c.id}</span>
                      <span className="text-secondary">{c.items.length} 条明细 · {c.deductions.length} 条扣减</span>
                      <StatusBadge
                        status={COMMISSION_STATUS_LABELS[c.status]}
                        colorMap={Object.fromEntries(
                          Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => [v, STATUS_VARIANT_MAP[k as CommissionStatus]])
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/commission/${c.id}`)}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        试算单
                      </button>
                      <span className="text-muted">|</span>
                      <button
                        onClick={() => navigate(`/statement/single/${c.id}`)}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        单据对账
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-bg-card)' }}>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>期间</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>任务</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>应结金额</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>状态</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: 'var(--color-text-secondary)' }}>是否争议</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--color-text-primary)' }}>{c.period}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {c.items.map((item) => `${CATEGORY_LABELS[item.projectCategory]} ${item.commissionAmount.toFixed(1)}`).join(' / ')}
                </td>
                <td className="px-4 py-2.5 font-mono font-medium" style={{ color: 'var(--color-accent)' }}>¥{c.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COMMISSION_STATUS_STYLES[c.status]}`}>
                    {COMMISSION_STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {c.isDisputed ? (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-warning)' }}>
                      <AlertTriangle size={12} /> 争议中
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>无</span>
                  )}
                </td>
              </tr>
            ))}
            {commissions.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>暂无佣金记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
