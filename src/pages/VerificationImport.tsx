import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileDown, CheckCircle2, Info, XCircle, Users, Phone, Ticket, Store, Clock, MessageSquare, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import {
  LEAD_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  MATCH_TYPE_LABELS,
  type LeadType,
  type LeadRecord,
  type LeadSource,
  type MatchResult,
} from '@/types'

const TABS: LeadType[] = ['coupon', 'consultation', 'visit', 'transaction']

const COLUMNS: Record<LeadType, string[]> = {
  coupon: ['手机号', '券码', '门店', '核销时间', '项目', '金额', '来源'],
  consultation: ['手机号', '门店', '预约时间', '项目', '来源'],
  visit: ['手机号', '门店', '到院时间', '医生', '来源'],
  transaction: ['手机号', '门店', '成交时间', '项目', '金额', '客服备注', '来源'],
}

const MOCK_SOURCE: Record<LeadType, LeadSource> = {
  coupon: 'group_buy',
  consultation: 'private_domain',
  visit: 'walk_in',
  transaction: 'private_domain',
}

function generateId() {
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuote = false
        }
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuote = true
      } else if (ch === ',') {
        row.push(cur)
        cur = ''
      } else if (ch === '\n' || ch === '\r') {
        if (cur.length > 0 || row.length > 0) {
          row.push(cur)
          rows.push(row)
          row = []
          cur = ''
        }
        if (ch === '\r' && text[i + 1] === '\n') i++
      } else {
        cur += ch
      }
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0))
}

function findStoreIdByName(stores: { id: string; name: string }[], name: string): string {
  const trimmed = name.trim()
  const exact = stores.find((s) => s.name === trimmed || s.name.includes(trimmed))
  return exact?.id ?? stores[0]?.id ?? ''
}

export default function VerificationImport() {
  const navigate = useNavigate()
  const { stores, kols, addLeads, autoMatchLeads, leads } = useAppStore()
  const [activeTab, setActiveTab] = useState<LeadType>('coupon')
  const [isDragOver, setIsDragOver] = useState(false)
  const [imported, setImported] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState<string>('')
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [importedLeads, setImportedLeads] = useState<LeadRecord[] | null>(null)
  const [newMatches, setNewMatches] = useState<MatchResult[] | null>(null)
  const [resultTab, setResultTab] = useState<'matched' | 'unmatched'>('matched')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const processFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      setFileContent(text)
      const rows = parseCSV(text)
      const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()))
      setPreviewRows(dataRows.slice(0, 5))
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function buildRecordsFromCSV(rows: string[][]): LeadRecord[] {
    const result: LeadRecord[] = []
    for (const row of rows) {
      const record: Partial<LeadRecord> = {
        id: generateId(),
        type: activeTab,
        isMatched: false,
        source: MOCK_SOURCE[activeTab],
      }
      if (activeTab === 'coupon') {
        record.phone = row[0]?.trim() || ''
        record.couponCode = row[1]?.trim() || undefined
        record.storeId = findStoreIdByName(stores, row[2] ?? '')
        record.time = row[3]?.trim() || dayjs().format('YYYY-MM-DD HH:mm')
        record.project = row[4]?.trim() || undefined
        const amt = parseFloat(row[5] ?? '')
        record.amount = isNaN(amt) ? undefined : amt
      } else if (activeTab === 'consultation') {
        record.phone = row[0]?.trim() || ''
        record.storeId = findStoreIdByName(stores, row[1] ?? '')
        record.time = row[2]?.trim() || dayjs().format('YYYY-MM-DD HH:mm')
        record.project = row[3]?.trim() || undefined
      } else if (activeTab === 'visit') {
        record.phone = row[0]?.trim() || ''
        record.storeId = findStoreIdByName(stores, row[1] ?? '')
        record.time = row[2]?.trim() || dayjs().format('YYYY-MM-DD HH:mm')
        record.doctor = row[3]?.trim() || undefined
      } else if (activeTab === 'transaction') {
        record.phone = row[0]?.trim() || ''
        record.storeId = findStoreIdByName(stores, row[1] ?? '')
        record.time = row[2]?.trim() || dayjs().format('YYYY-MM-DD HH:mm')
        record.project = row[3]?.trim() || undefined
        const amt = parseFloat(row[4] ?? '')
        record.amount = isNaN(amt) ? undefined : amt
        record.remark = row[5]?.trim() || undefined
      }
      if (record.phone) {
        result.push(record as LeadRecord)
      }
    }
    return result
  }

  const handleImport = () => {
    let records: LeadRecord[] = []
    if (fileContent) {
      const rows = parseCSV(fileContent)
      const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim()))
      records = buildRecordsFromCSV(dataRows)
    }
    if (records.length === 0) {
      records = Array.from({ length: 3 }, (_, i) => ({
        id: generateId(),
        type: activeTab,
        phone: `138${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        storeId: stores[i % stores.length]?.id ?? stores[0].id,
        time: dayjs().subtract(i, 'day').format('YYYY-MM-DD HH:mm'),
        source: MOCK_SOURCE[activeTab],
        isMatched: false,
        ...(activeTab === 'coupon' ? { couponCode: `GQ${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(3, '0')}`, project: '导入示例项目', amount: 1000 * (i + 1) } : {}),
        ...(activeTab === 'consultation' ? { project: '导入示例项目' } : {}),
        ...(activeTab === 'visit' ? { doctor: '导入示例医生' } : {}),
        ...(activeTab === 'transaction' ? { project: '导入示例项目', amount: 5000 * (i + 1), remark: '抖音@美少女探店日记推荐' } : {}),
      }))
    }
    const leadIdsBefore = new Set(leads.map((l) => l.id))
    addLeads(records)
    const { newMatches: matches, matchedLeadIds } = autoMatchLeads()
    setImported(true)
    setImportedLeads(records)
    setNewMatches(matches.filter((m) => matchedLeadIds.includes(m.leadId)))
  }

  const matchedList = useMemo(() => {
    if (!newMatches || !importedLeads) return []
    return newMatches.map((m) => {
      const lead = importedLeads.find((l) => l.id === m.leadId)
      const kol = kols.find((k) => k.id === m.kolId)
      const store = stores.find((s) => s.id === m.storeId)
      const primaryAccount = kol?.platforms[0]
      let matchBasis = ''
      if (m.matchType === 'coupon') {
        matchBasis = `券码 ${lead?.couponCode ?? '-'}`
      } else if (m.matchType === 'phone') {
        matchBasis = `手机号 ${lead?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') ?? '-'}`
      } else if (m.matchType === 'remark') {
        matchBasis = `客服备注：${lead?.remark ?? '-'}`
      } else {
        matchBasis = '手动匹配'
      }
      return {
        match: m,
        lead,
        kolName: kol?.name ?? '-',
        kolAccount: primaryAccount ? `${primaryAccount.type === 'douyin' ? '抖音' : primaryAccount.type === 'xiaohongshu' ? '小红书' : primaryAccount.type === 'kuaishou' ? '快手' : 'B站'} @${primaryAccount.account}` : '-',
        storeName: store?.name ?? '-',
        matchBasis,
      }
    })
  }, [newMatches, importedLeads, kols, stores])

  const unmatchedList = useMemo(() => {
    if (!newMatches || !importedLeads) return []
    const matchedIds = new Set(newMatches.map((m) => m.leadId))
    return importedLeads
      .filter((l) => !matchedIds.has(l.id))
      .map((l) => {
        const store = stores.find((s) => s.id === l.storeId)
        return { lead: l, storeName: store?.name ?? '-' }
      })
  }, [newMatches, importedLeads, stores])

  if (imported && importedLeads && newMatches) {
    const matchedCount = matchedList.length
    const unmatchedCount = unmatchedList.length

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/verification')} className="p-2 rounded-lg bg-secondary border border-default hover:bg-hover transition-colors">
            <ArrowLeft size={18} className="text-primary" />
          </button>
          <h1 className="text-2xl font-bold text-primary">导入结果</h1>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg p-5 bg-card border border-default">
            <div className="text-sm text-secondary mb-1">导入总数</div>
            <div className="text-3xl font-bold text-primary font-mono">{importedLeads.length}</div>
          </div>
          <div className="rounded-lg p-5 bg-card border border-default">
            <div className="text-sm text-secondary mb-1">自动匹配成功</div>
            <div className="text-3xl font-bold text-emerald-400 font-mono">{matchedCount}</div>
          </div>
          <div className="rounded-lg p-5 bg-card border border-default">
            <div className="text-sm text-secondary mb-1">待手动匹配</div>
            <div className="text-3xl font-bold text-orange-400 font-mono">{unmatchedCount}</div>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-secondary rounded-lg border border-default">
          <button
            onClick={() => setResultTab('matched')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              resultTab === 'matched'
                ? 'bg-card text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            )}
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            已匹配 ({matchedCount})
          </button>
          <button
            onClick={() => setResultTab('unmatched')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              resultTab === 'unmatched'
                ? 'bg-card text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            )}
          >
            <XCircle size={16} className="text-orange-400" />
            未匹配 ({unmatchedCount})
          </button>
        </div>

        {resultTab === 'matched' && (
          <div className="overflow-x-auto rounded-lg border border-default bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-secondary">
                  <th className="px-4 py-3 text-left font-medium">达人</th>
                  <th className="px-4 py-3 text-left font-medium">账号</th>
                  <th className="px-4 py-3 text-left font-medium">匹配方式</th>
                  <th className="px-4 py-3 text-left font-medium">匹配依据</th>
                  <th className="px-4 py-3 text-left font-medium">门店</th>
                  <th className="px-4 py-3 text-left font-medium">成交时间</th>
                  <th className="px-4 py-3 text-right font-medium">金额</th>
                </tr>
              </thead>
              <tbody>
                {matchedList.map((item) => (
                  <tr key={item.match.id} className={`border-t border-default hover:bg-hover transition-colors ${item.match.matchType === 'remark' ? 'bg-purple-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users size={14} className={item.match.matchType === 'remark' ? 'text-purple-400' : 'text-emerald-400'} />
                        <span className={`font-medium ${item.match.matchType === 'remark' ? 'text-purple-300 font-bold' : 'text-primary'}`}>
                          {item.kolName}
                          {item.match.matchType === 'remark' && <Sparkles size={12} className="inline ml-1 text-purple-400" />}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs ${item.match.matchType === 'remark' ? 'text-purple-300 font-bold bg-purple-500/15 px-2 py-0.5 rounded' : 'text-secondary'}`}>
                        {item.kolAccount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        item.match.matchType === 'remark'
                          ? 'bg-purple-500/15 text-purple-400'
                          : item.match.matchType === 'coupon'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-blue-500/15 text-blue-400'
                      )}>
                        {MATCH_TYPE_LABELS[item.match.matchType]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-secondary">
                        {item.match.matchType === 'remark' && <Sparkles size={13} className="text-purple-400" />}
                        <span className="font-mono text-xs">{item.matchBasis}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-primary">{item.storeName}</td>
                    <td className="px-4 py-3 text-secondary text-xs">{item.lead?.time ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-mono text-primary">
                      {item.lead?.amount != null ? `¥${item.lead.amount.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
                {matchedList.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted">暂无匹配成功的线索</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {resultTab === 'unmatched' && (
          <div className="overflow-x-auto rounded-lg border border-default bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-secondary">
                  <th className="px-4 py-3 text-left font-medium">手机号</th>
                  <th className="px-4 py-3 text-left font-medium">券码</th>
                  <th className="px-4 py-3 text-left font-medium">门店</th>
                  <th className="px-4 py-3 text-left font-medium">时间</th>
                  <th className="px-4 py-3 text-left font-medium">项目</th>
                  <th className="px-4 py-3 text-left font-medium">客服备注</th>
                </tr>
              </thead>
              <tbody>
                {unmatchedList.map((item) => (
                  <tr key={item.lead.id} className="border-t border-default hover:bg-hover transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-muted" />
                        <span className="font-mono text-primary">{item.lead.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.lead.couponCode ? (
                        <div className="flex items-center gap-1.5">
                          <Ticket size={13} className="text-muted" />
                          <span className="font-mono text-secondary">{item.lead.couponCode}</span>
                        </div>
                      ) : <span className="text-muted">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Store size={13} className="text-muted" />
                        <span className="text-primary">{item.storeName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-muted" />
                        <span className="text-secondary text-xs">{item.lead.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-primary">{item.lead.project ?? '-'}</td>
                    <td className="px-4 py-3">
                      {item.lead.remark ? (
                        <div className="flex items-start gap-1.5">
                          <MessageSquare size={13} className="text-purple-400 shrink-0 mt-0.5" />
                          <span className="text-secondary text-xs break-all">{item.lead.remark}</span>
                        </div>
                      ) : <span className="text-muted">-</span>}
                    </td>
                  </tr>
                ))}
                {unmatchedList.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">太棒了，全部匹配成功！</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button
            onClick={() => { setImported(false); setImportedLeads(null); setNewMatches(null); setFileName(''); setFileContent(''); setPreviewRows([]) }}
            className="px-4 py-2 rounded-md bg-secondary border border-default text-sm text-primary hover:bg-hover transition-colors"
          >
            继续导入
          </button>
          <button
            onClick={() => navigate('/verification')}
            className="px-6 py-2 rounded-md text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            返回列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/verification')} className="p-2 rounded-lg bg-secondary border border-default hover:bg-hover transition-colors">
          <ArrowLeft size={18} className="text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-primary">导入线索数据</h1>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-lg border border-default">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setFileName(''); setFileContent(''); setPreviewRows([]); setImported(false) }}
              className={cn(
                'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-secondary hover:text-primary hover:bg-hover'
              )}
            >
              {LEAD_TYPE_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer relative',
              isDragOver ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-default bg-card hover:border-[var(--color-accent)]/50'
            )}
          >
            <Upload size={40} className={cn('mx-auto mb-3', isDragOver ? 'text-[var(--color-accent)]' : 'text-muted')} />
            <p className="text-primary text-sm mb-1">
              {fileName ? `已选择: ${fileName}` : '拖拽文件到此处，或点击上传'}
            </p>
            <p className="text-muted text-xs">支持 .csv 格式，首行为标题行</p>
            <input type="file" accept=".csv" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>

          <div className="flex items-center justify-between">
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(COLUMNS[activeTab].join(','))}`}
              download={`${LEAD_TYPE_LABELS[activeTab]}_导入模板.csv`}
              className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
            >
              <FileDown size={14} />
              下载导入模板
            </a>
            <span className="text-xs text-muted">
              来源：{LEAD_SOURCE_LABELS[MOCK_SOURCE[activeTab]]}
            </span>
          </div>

          {previewRows.length > 0 && (
            <div className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-4">
              <div className="flex items-center gap-2 text-sm text-[var(--color-accent)] mb-2">
                <Info size={14} />
                数据预览（前 {previewRows.length} 行）
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary">
                      {COLUMNS[activeTab].map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-secondary font-medium text-xs">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t border-default">
                        {COLUMNS[activeTab].map((_, j) => (
                          <td key={j} className="px-3 py-2 text-secondary text-xs">{row[j] ?? '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-card rounded-lg border border-default p-4">
            <h3 className="text-sm font-medium text-primary mb-3">预期列格式</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary">
                    {COLUMNS[activeTab].map((col) => (
                      <th key={col} className="px-3 py-2 text-left text-secondary font-medium text-xs">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-default">
                    {COLUMNS[activeTab].map((_, i) => (
                      <td key={i} className="px-3 py-2 text-muted text-xs">示例数据{i + 1}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => navigate('/verification')} className="px-4 py-2 rounded-md bg-secondary border border-default text-sm text-primary hover:bg-hover transition-colors">取消</button>
            <button
              onClick={handleImport}
              disabled={!fileName}
              className={cn(
                'px-6 py-2 rounded-md text-sm font-medium transition-colors',
                fileName
                  ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
                  : 'bg-secondary text-muted cursor-not-allowed'
              )}
            >
              导入
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
