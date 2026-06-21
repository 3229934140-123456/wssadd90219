import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'
import {
  PRICING_MODEL_LABELS,
  CATEGORY_LABELS,
  PLATFORM_LABELS,
  type PricingModel,
  type ProjectCategory,
  type PlatformType,
  type VideoInfo,
} from '@/types'

const STEPS = ['基本信息', '报价方式', '视频登记']

const PROJECT_OPTIONS: { value: ProjectCategory; label: string }[] = [
  { value: 'filler', label: CATEGORY_LABELS.filler },
  { value: 'laser', label: CATEGORY_LABELS.laser },
  { value: 'skin', label: CATEGORY_LABELS.skin },
  { value: 'surgery', label: CATEGORY_LABELS.surgery },
  { value: 'other', label: CATEGORY_LABELS.other },
]

const PRICING_OPTIONS: { value: PricingModel; label: string }[] = [
  { value: 'fixed', label: PRICING_MODEL_LABELS.fixed },
  { value: 'commission', label: PRICING_MODEL_LABELS.commission },
  { value: 'hybrid', label: PRICING_MODEL_LABELS.hybrid },
]

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
              i < current ? 'bg-[var(--color-accent)] text-white' :
              i === current ? 'bg-[var(--color-accent)] text-white ring-4 ring-[var(--color-accent)]/20' :
              'bg-secondary text-muted border border-default'
            )}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={cn('mt-1.5 text-xs', i <= current ? 'text-primary' : 'text-muted')}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('w-16 h-0.5 mx-2 mb-5', i < current ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]')} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ScheduleCreate() {
  const navigate = useNavigate()
  const { kols, stores, addStoreVisit } = useAppStore()
  const [step, setStep] = useState(0)
  const [kolId, setKolId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [projectTypes, setProjectTypes] = useState<ProjectCategory[]>([])
  const [pricingModel, setPricingModel] = useState<PricingModel>('fixed')
  const [fixedPrice, setFixedPrice] = useState('')
  const [commissionRate, setCommissionRate] = useState('')
  const [videos, setVideos] = useState<Omit<VideoInfo, 'id'>[]>([])

  const toggleProject = (p: ProjectCategory) => {
    setProjectTypes((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  const addVideo = () => {
    setVideos((prev) => [...prev, { url: '', platform: 'douyin', publishedAt: '', retentionDays: 30 }])
  }

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index))
  }

  const updateVideo = (index: number, field: string, value: string | number) => {
    setVideos((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const canNext = () => {
    if (step === 0) return kolId && storeId && visitDate && projectTypes.length > 0
    if (step === 1) {
      if (pricingModel === 'fixed' || pricingModel === 'hybrid') { if (!fixedPrice) return false }
      if (pricingModel === 'commission' || pricingModel === 'hybrid') { if (!commissionRate) return false }
      return true
    }
    return true
  }

  const handleSubmit = () => {
    addStoreVisit({
      id: `sv-${Date.now()}`,
      kolId,
      storeId,
      visitDate,
      projectTypes,
      pricingModel,
      fixedPrice: fixedPrice ? Number(fixedPrice) : undefined,
      commissionRate: commissionRate ? Number(commissionRate) / 100 : undefined,
      videos: videos.map((v, i) => ({ ...v, id: `v-${Date.now()}-${i}` })),
      status: 'scheduled',
    })
    navigate('/schedule')
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/schedule')} className="p-2 rounded-lg bg-secondary border border-default hover:bg-hover transition-colors">
          <ArrowLeft size={18} className="text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-primary">创建探店任务</h1>
      </div>

      <div className="max-w-2xl mx-auto bg-card rounded-lg border border-default p-6">
        <StepIndicator current={step} steps={STEPS} />

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-secondary mb-1.5">选择达人</label>
              <select value={kolId} onChange={(e) => setKolId(e.target.value)} className="w-full bg-secondary border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
                <option value="">请选择达人</option>
                {kols.filter((k) => k.status === 'active').map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1.5">选择门店</label>
              <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full bg-secondary border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
                <option value="">请选择门店</option>
                {stores.filter((s) => s.status === 'active').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1.5">到店日期</label>
              <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full bg-secondary border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1.5">拍摄项目</label>
              <div className="flex flex-wrap gap-3">
                {PROJECT_OPTIONS.map((opt) => (
                  <label key={opt.value} className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors text-sm',
                    projectTypes.includes(opt.value)
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'border-default bg-secondary text-secondary hover:bg-hover'
                  )}>
                    <input type="checkbox" checked={projectTypes.includes(opt.value)} onChange={() => toggleProject(opt.value)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-secondary mb-1.5">报价方式</label>
              <div className="flex gap-3">
                {PRICING_OPTIONS.map((opt) => (
                  <label key={opt.value} className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-md border cursor-pointer transition-colors text-sm',
                    pricingModel === opt.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                      : 'border-default bg-secondary text-secondary hover:bg-hover'
                  )}>
                    <input type="radio" name="pricing" checked={pricingModel === opt.value} onChange={() => setPricingModel(opt.value)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {(pricingModel === 'fixed' || pricingModel === 'hybrid') && (
              <div>
                <label className="block text-sm text-secondary mb-1.5">固定报价 (元)</label>
                <input type="number" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value)} placeholder="请输入金额" className="w-full bg-secondary border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
              </div>
            )}
            {(pricingModel === 'commission' || pricingModel === 'hybrid') && (
              <div>
                <label className="block text-sm text-secondary mb-1.5">提成比例 (%)</label>
                <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="请输入比例，如 8" className="w-full bg-secondary border border-default rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {videos.map((video, i) => (
              <div key={i} className="bg-secondary rounded-lg border border-default p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">视频 {i + 1}</span>
                  <button onClick={() => removeVideo(i)} className="text-[var(--color-danger)] hover:text-red-300 transition-colors"><Trash2 size={14} /></button>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">视频链接</label>
                  <input type="text" value={video.url} onChange={(e) => updateVideo(i, 'url', e.target.value)} placeholder="https://" className="w-full bg-card border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">发布平台</label>
                    <select value={video.platform} onChange={(e) => updateVideo(i, 'platform', e.target.value)} className="w-full bg-card border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]">
                      {(Object.entries(PLATFORM_LABELS) as [PlatformType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">发布时间</label>
                    <input type="date" value={video.publishedAt} onChange={(e) => updateVideo(i, 'publishedAt', e.target.value)} className="w-full bg-card border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">保留天数</label>
                    <input type="number" value={video.retentionDays} onChange={(e) => updateVideo(i, 'retentionDays', Number(e.target.value))} className="w-full bg-card border border-default rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:border-[var(--color-accent)]" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addVideo} className="flex items-center gap-2 w-full justify-center py-3 border border-dashed border-default rounded-lg text-secondary hover:text-primary hover:border-[var(--color-accent)] transition-colors text-sm">
              <Plus size={14} />添加视频
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-default">
          {step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2 rounded-md bg-secondary border border-default text-sm text-primary hover:bg-hover transition-colors">上一步</button>
          ) : <div />}
          {step < 2 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className={cn(
              'px-6 py-2 rounded-md text-sm font-medium transition-colors',
              canNext() ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]' : 'bg-secondary text-muted cursor-not-allowed'
            )}>下一步</button>
          ) : (
            <button onClick={handleSubmit} className="px-6 py-2 rounded-md text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors">提交</button>
          )}
        </div>
      </div>
    </div>
  )
}
