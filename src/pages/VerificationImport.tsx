import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileDown, CheckCircle2, Info } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import {
  LEAD_TYPE_LABELS,
  type LeadType,
  type LeadRecord,
  type LeadSource,
} from '@/types'

const TABS: LeadType[] = ['coupon', 'consultation', 'visit', 'transaction']

const COLUMNS: Record<LeadType, string[]> = {
  coupon: ['手机号', '券码', '门店', '核销时间', '项目', '金额', '来源'],
  consultation: ['手机号', '门店', '预约时间', '项目', '来源'],
  visit: ['手机号', '门店', '到院时间', '医生', '来源'],
  transaction: ['手机号', '门店', '成交时间', '项目', '金额', '来源'],
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
  const { stores, addLeads, autoMatchLeads } = useAppStore()
  const [activeTab, setActiveTab] = useState<LeadType>('coupon')
  const [isDragOver, setIsDragOver] = useState(false)
  const [imported, setImported] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState<string>('')
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [importStats, setImportStats] = useState<{ inserted: number; autoMatched: number } | null>(null)

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
        ...(activeTab === 'transaction' ? { project: '导入示例项目', amount: 5000 * (i + 1) } : {}),
      }))
    }
    addLeads(records)
    const { matchedLeadIds } = autoMatchLeads()
    setImported(true)
    setImportStats({ inserted: records.length, autoMatched: matchedLeadIds.length })
    setTimeout(() => {
      navigate('/verification')
    }, 2000)
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
            {imported && importStats && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 size={14} />
                导入成功 {importStats.inserted} 条，自动匹配 {importStats.autoMatched} 条
              </span>
            )}
            {imported && !importStats && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 size={14} />
                导入成功
              </span>
            )}
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
              disabled={!fileName || imported}
              className={cn(
                'px-6 py-2 rounded-md text-sm font-medium transition-colors',
                fileName && !imported
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
