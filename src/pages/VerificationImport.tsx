import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FileDown, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
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

export default function VerificationImport() {
  const navigate = useNavigate()
  const { stores, addLeads } = useAppStore()
  const [activeTab, setActiveTab] = useState<LeadType>('coupon')
  const [isDragOver, setIsDragOver] = useState(false)
  const [imported, setImported] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setFileName(file.name)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  const handleImport = () => {
    if (!fileName) return
    const mockLeads: LeadRecord[] = Array.from({ length: 3 }, (_, i) => ({
      id: `lead-import-${Date.now()}-${i}`,
      type: activeTab,
      phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      storeId: stores[i % stores.length]?.id ?? stores[0].id,
      time: `2026-06-${String(10 + i).padStart(2, '0')} 10:00`,
      source: MOCK_SOURCE[activeTab],
      isMatched: false,
      ...(activeTab === 'coupon' ? { couponCode: `GQ202606${String(i + 1).padStart(3, '0')}`, project: '示例项目', amount: 1000 * (i + 1) } : {}),
      ...(activeTab === 'consultation' ? { project: '示例项目' } : {}),
      ...(activeTab === 'visit' ? { doctor: '示例医生' } : {}),
      ...(activeTab === 'transaction' ? { project: '示例项目', amount: 5000 * (i + 1) } : {}),
    }))
    addLeads(mockLeads)
    setImported(true)
    setTimeout(() => {
      setImported(false)
      setFileName('')
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
              onClick={() => { setActiveTab(tab); setFileName(''); setImported(false) }}
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
              'border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer',
              isDragOver ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-default bg-card hover:border-[var(--color-accent)]/50'
            )}
          >
            <Upload size={40} className={cn('mx-auto mb-3', isDragOver ? 'text-[var(--color-accent)]' : 'text-muted')} />
            <p className="text-primary text-sm mb-1">
              {fileName ? `已选择: ${fileName}` : '拖拽文件到此处，或点击上传'}
            </p>
            <p className="text-muted text-xs">支持 .xlsx, .csv 格式</p>
            <input type="file" accept=".xlsx,.csv" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ position: 'relative' }} />
          </div>

          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
              <FileDown size={14} />
              下载导入模板
            </button>
            {imported && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 size={14} />
                导入成功
              </span>
            )}
          </div>

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
                    {COLUMNS[activeTab].map((col, i) => (
                      <td key={i} className="px-3 py-2 text-muted text-xs">示例数据{i + 1}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-default">
                    {COLUMNS[activeTab].map((col, i) => (
                      <td key={i} className="px-3 py-2 text-muted text-xs">示例数据{i + 10}</td>
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
