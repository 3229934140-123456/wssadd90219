import { useState, useMemo, Fragment } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import PageHeader from '@/components/PageHeader'
import { useAppStore } from '@/store'
import { monthlyROI } from '@/data/mockData'

function getRoiColor(roi: number) {
  if (roi > 7) return '#10b981'
  if (roi >= 5) return '#f59e0b'
  return '#ef4444'
}

function getRoiClass(roi: number) {
  if (roi > 7) return 'text-emerald-400'
  if (roi >= 5) return 'text-amber-400'
  return 'text-red-400'
}

export default function ROIReport() {
  const { commissions, matches, kols, stores, storeVisits } = useAppStore()
  const [monthIdx, setMonthIdx] = useState(monthlyROI.length - 1)
  const [expandedStore, setExpandedStore] = useState<string | null>(null)

  const currentMonth = monthlyROI[monthIdx]?.month ?? ''

  const storeData = useMemo(() => {
    return stores.map((store) => {
      const visitIds = storeVisits
        .filter((v) => v.storeId === store.id)
        .map((v) => v.id)
      const storeCommissions = commissions.filter((c) =>
        visitIds.includes(c.storeVisitId)
      )
      const storeMatches = matches.filter((m) => m.storeId === store.id)
      const kolIds = new Set([
        ...storeCommissions.map((c) => c.kolId),
        ...storeMatches.map((m) => m.kolId),
      ])
      const commissionSum = storeCommissions.reduce((s, c) => s + c.totalAmount, 0)
      const revenueSum = storeMatches.reduce((s, m) => s + m.transactionAmount, 0)
      const roi = commissionSum > 0 ? revenueSum / commissionSum : 0
      return {
        storeId: store.id,
        storeName: store.name,
        kolCount: kolIds.size,
        commissionSum,
        revenueSum,
        roi,
      }
    })
  }, [stores, commissions, matches, storeVisits])

  const chartData = useMemo(
    () =>
      storeData.map((d) => ({
        name: d.storeName.length > 4 ? d.storeName.slice(0, 4) : d.storeName,
        roi: Number(d.roi.toFixed(1)),
        commission: d.commissionSum,
        revenue: d.revenueSum,
      })),
    [storeData]
  )

  const expandedKolData = useMemo(() => {
    if (!expandedStore) return []
    const visitIds = storeVisits
      .filter((v) => v.storeId === expandedStore)
      .map((v) => v.id)
    const storeCommissions = commissions.filter((c) =>
      visitIds.includes(c.storeVisitId)
    )
    const storeMatches = matches.filter((m) => m.storeId === expandedStore)
    const kolMap = new Map<string, { commission: number; revenue: number }>()
    storeCommissions.forEach((c) => {
      const existing = kolMap.get(c.kolId) ?? { commission: 0, revenue: 0 }
      existing.commission += c.totalAmount
      kolMap.set(c.kolId, existing)
    })
    storeMatches.forEach((m) => {
      const existing = kolMap.get(m.kolId) ?? { commission: 0, revenue: 0 }
      existing.revenue += m.transactionAmount
      kolMap.set(m.kolId, existing)
    })
    return Array.from(kolMap.entries())
      .map(([kolId, data]) => ({
        kolId,
        kolName: kols.find((k) => k.id === kolId)?.name ?? '-',
        commission: data.commission,
        revenue: data.revenue,
        roi: data.commission > 0 ? data.revenue / data.commission : 0,
      }))
      .sort((a, b) => b.roi - a.roi)
  }, [expandedStore, commissions, matches, kols, storeVisits])

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="门店投产比报表" />

      <div className="flex items-center gap-4">
        <button
          onClick={() => setMonthIdx(Math.max(0, monthIdx - 1))}
          disabled={monthIdx === 0}
          className="p-2 rounded-md transition-colors disabled:opacity-30"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <span
          className="text-lg font-semibold font-mono"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {currentMonth}
        </span>
        <button
          onClick={() => setMonthIdx(Math.min(monthlyROI.length - 1, monthIdx + 1))}
          disabled={monthIdx === monthlyROI.length - 1}
          className="p-2 rounded-md transition-colors disabled:opacity-30"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <ChevronRight size={18} />
        </button>
        <div className="ml-auto flex gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> &gt;7
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 5-7
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> &lt;5
          </div>
        </div>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fill: '#8b95b0', fontSize: 12 }} />
            <YAxis tick={{ fill: '#8b95b0', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: '#1e2442',
                border: '1px solid #2a3254',
                borderRadius: 8,
                color: '#e8ecf4',
              }}
              formatter={(value: number, name: string) => [
                name === 'roi' ? `${value}` : `¥${value.toLocaleString()}`,
                name === 'roi' ? '投产比' : name === 'commission' ? '佣金投入' : '产出成交额',
              ]}
            />
            <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={getRoiColor(entry.roi)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-bg-card)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                门店名称
              </th>
              <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                达人数
              </th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                佣金投入
              </th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                产出成交额
              </th>
              <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                投产比
              </th>
              <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {storeData.map((row) => (
              <Fragment key={row.storeId}>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {row.storeName}
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.kolCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                    ¥{row.commissionSum.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--color-text-primary)' }}>
                    ¥{row.revenueSum.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold">
                    <span className={getRoiClass(row.roi)}>{row.roi.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        setExpandedStore(expandedStore === row.storeId ? null : row.storeId)
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {expandedStore === row.storeId ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      查看达人排名
                    </button>
                  </td>
                </tr>
                {expandedStore === row.storeId && expandedKolData.length > 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-3"
                      style={{ background: 'var(--color-bg-card)' }}
                    >
                      <table className="w-full text-xs">
                        <thead>
                          <tr>
                            <th
                              className="text-left px-3 py-1.5 font-medium"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              达人
                            </th>
                            <th
                              className="text-right px-3 py-1.5 font-medium"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              佣金投入
                            </th>
                            <th
                              className="text-right px-3 py-1.5 font-medium"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              产出成交额
                            </th>
                            <th
                              className="text-center px-3 py-1.5 font-medium"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              投产比
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {expandedKolData.map((kol) => (
                            <tr key={kol.kolId}>
                              <td
                                className="px-3 py-1.5"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                {kol.kolName}
                              </td>
                              <td
                                className="px-3 py-1.5 text-right font-mono"
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                ¥{kol.commission.toLocaleString()}
                              </td>
                              <td
                                className="px-3 py-1.5 text-right font-mono"
                                style={{ color: 'var(--color-text-primary)' }}
                              >
                                ¥{kol.revenue.toLocaleString()}
                              </td>
                              <td className="px-3 py-1.5 text-center font-mono">
                                <span className={getRoiClass(kol.roi)}>
                                  {kol.roi.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {storeData.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
