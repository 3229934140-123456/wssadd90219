import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, Pencil, X, User } from 'lucide-react'
import { useAppStore } from '@/store'
import { PLATFORM_LABELS, CATEGORY_LABELS, type PlatformType, type KOLStatus, type ProjectCategory } from '@/types'

const PLATFORM_COLORS: Record<PlatformType, string> = {
  douyin: 'bg-gray-800 text-gray-200',
  xiaohongshu: 'bg-red-900/60 text-red-300',
  kuaishou: 'bg-orange-900/60 text-orange-300',
  bilibili: 'bg-pink-900/60 text-pink-300',
}

const STATUS_STYLES: Record<KOLStatus, string> = {
  active: 'bg-emerald-900/40 text-emerald-400',
  inactive: 'bg-gray-700/40 text-gray-400',
}

const STATUS_LABELS: Record<KOLStatus, string> = {
  active: '合作中',
  inactive: '已暂停',
}

function formatNumber(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString()
}

const CATEGORIES: ProjectCategory[] = ['filler', 'laser', 'skin', 'surgery', 'other']

export default function KOLList() {
  const navigate = useNavigate()
  const { kols, stores, addKOL, updateKOL } = useAppStore()

  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState<PlatformType | ''>('')
  const [statusFilter, setStatusFilter] = useState<KOLStatus | ''>('')
  const [storeFilter, setStoreFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editKOLId, setEditKOLId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPlatforms, setFormPlatforms] = useState<{ type: PlatformType; account: string; followers: number }[]>([])
  const [formStores, setFormStores] = useState<string[]>([])
  const [formTiers, setFormTiers] = useState<Record<ProjectCategory, number>>({
    filler: 0.1, laser: 0.08, skin: 0.06, surgery: 0.12, other: 0.05,
  })

  const filtered = kols.filter((kol) => {
    if (search && !kol.name.includes(search) && !kol.phone.includes(search)) return false
    if (platformFilter && !kol.platforms.some((p) => p.type === platformFilter)) return false
    if (statusFilter && kol.status !== statusFilter) return false
    if (storeFilter && !kol.stores.includes(storeFilter)) return false
    return true
  })

  function resetForm() {
    setFormName('')
    setFormPhone('')
    setFormPlatforms([])
    setFormStores([])
    setFormTiers({ filler: 0.1, laser: 0.08, skin: 0.06, surgery: 0.12, other: 0.05 })
    setEditKOLId(null)
  }

  function openEditModal(kolId: string) {
    const kol = kols.find((k) => k.id === kolId)
    if (!kol) return
    setEditKOLId(kolId)
    setFormName(kol.name)
    setFormPhone(kol.phone)
    setFormPlatforms(kol.platforms.map((p) => ({ type: p.type, account: p.account, followers: p.followers })))
    setFormStores([...kol.stores])
    const tiers = { filler: 0.1, laser: 0.08, skin: 0.06, surgery: 0.12, other: 0.05 }
    kol.commissionTiers.forEach((t) => { tiers[t.category] = t.rate })
    setFormTiers(tiers)
    setShowAddModal(true)
  }

  function handleSubmit() {
    if (!formName || !formPhone) return
    const tiers = CATEGORIES.map((cat, i) => ({
      id: `ct-${Date.now()}-${i}`,
      category: cat,
      rate: formTiers[cat],
    }))
    if (editKOLId) {
      updateKOL(editKOLId, {
        name: formName,
        phone: formPhone,
        platforms: formPlatforms.map((p) => ({ ...p, followers: Number(p.followers) })),
        stores: formStores,
        commissionTiers: tiers,
      })
    } else {
      addKOL({
        id: `kol-${Date.now()}`,
        name: formName,
        avatar: '',
        phone: formPhone,
        platforms: formPlatforms.map((p) => ({ ...p, followers: Number(p.followers) })),
        stores: formStores,
        commissionTiers: tiers,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
      })
    }
    setShowAddModal(false)
    resetForm()
  }

  function addPlatformRow() {
    setFormPlatforms([...formPlatforms, { type: 'douyin', account: '', followers: 0 }])
  }

  function updatePlatformRow(idx: number, field: string, value: string | number) {
    const updated = [...formPlatforms]
    ;(updated[idx] as Record<string, string | number>)[field] = value
    setFormPlatforms(updated)
  }

  function removePlatformRow(idx: number) {
    setFormPlatforms(formPlatforms.filter((_, i) => i !== idx))
  }

  function toggleStore(storeId: string) {
    setFormStores((prev) =>
      prev.includes(storeId) ? prev.filter((s) => s !== storeId) : [...prev, storeId]
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>达人档案</h1>
        <button
          onClick={() => { resetForm(); setShowAddModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          <Plus size={16} /> 添加达人
        </button>
      </div>

      <div className="flex flex-wrap gap-3 p-4 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索达人姓名/手机号"
            className="w-full pl-9 pr-3 py-2 rounded-md text-sm outline-none"
            style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />
        </div>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as PlatformType | '')}
          className="px-3 py-2 rounded-md text-sm outline-none"
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          <option value="">全部平台</option>
          {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as KOLStatus | '')}
          className="px-3 py-2 rounded-md text-sm outline-none"
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          <option value="">全部状态</option>
          <option value="active">合作中</option>
          <option value="inactive">已暂停</option>
        </select>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="px-3 py-2 rounded-md text-sm outline-none"
          style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
        >
          <option value="">全部门店</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-bg-card)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>达人信息</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>联系方式</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>合作门店</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>粉丝总量</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>状态</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((kol) => {
              const totalFollowers = kol.platforms.reduce((s, p) => s + p.followers, 0)
              const kolStores = kol.stores.map((sid) => stores.find((s) => s.id === sid)?.name).filter(Boolean)
              return (
                <tr
                  key={kol.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate(`/kol/${kol.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg-card)' }}>
                        <User size={16} style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{kol.name}</div>
                        <div className="flex gap-1 mt-1">
                          {kol.platforms.map((p) => (
                            <span key={p.type} className={`px-1.5 py-0.5 rounded text-xs ${PLATFORM_COLORS[p.type]}`}>
                              {PLATFORM_LABELS[p.type]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{kol.phone}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{kolStores.join('、')}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--color-text-primary)' }}>{formatNumber(totalFollowers)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[kol.status]}`}>
                      {STATUS_LABELS[kol.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/kol/${kol.id}`)} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <Eye size={15} />
                      </button>
                      <button onClick={() => openEditModal(kol.id)} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--color-text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <Pencil size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => { setShowAddModal(false); resetForm() }}>
          <div className="w-full max-w-lg rounded-xl p-6 space-y-5 max-h-[85vh] overflow-y-auto" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{editKOLId ? '编辑达人' : '添加达人'}</h2>
              <button onClick={() => { setShowAddModal(false); resetForm() }} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>姓名</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm outline-none" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>手机号</label>
                <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm outline-none" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>平台账号</label>
                  <button onClick={addPlatformRow} className="text-xs" style={{ color: 'var(--color-accent)' }}>+ 添加</button>
                </div>
                {formPlatforms.map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select value={p.type} onChange={(e) => updatePlatformRow(i, 'type', e.target.value)} className="px-2 py-1.5 rounded-md text-xs outline-none" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                      {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input value={p.account} onChange={(e) => updatePlatformRow(i, 'account', e.target.value)} placeholder="账号" className="flex-1 px-2 py-1.5 rounded-md text-xs outline-none" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }} />
                    <input type="number" value={p.followers || ''} onChange={(e) => updatePlatformRow(i, 'followers', Number(e.target.value))} placeholder="粉丝数" className="w-24 px-2 py-1.5 rounded-md text-xs outline-none" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }} />
                    <button onClick={() => removePlatformRow(i)} className="p-1" style={{ color: 'var(--color-danger)' }}><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>合作门店</label>
                <div className="flex flex-wrap gap-2">
                  {stores.map((s) => (
                    <button key={s.id} onClick={() => toggleStore(s.id)} className={`px-2 py-1 rounded-md text-xs ${formStores.includes(s.id) ? '' : 'opacity-50'}`} style={{ background: formStores.includes(s.id) ? 'var(--color-accent)' : 'var(--color-bg-card)', color: formStores.includes(s.id) ? '#fff' : 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>佣金比例</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <div key={cat} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                      <span className="text-xs w-16" style={{ color: 'var(--color-text-secondary)' }}>{CATEGORY_LABELS[cat]}</span>
                      <input type="number" step="0.01" min="0" max="1" value={formTiers[cat]} onChange={(e) => setFormTiers({ ...formTiers, [cat]: Number(e.target.value) })} className="flex-1 w-14 text-xs text-right outline-none" style={{ background: 'transparent', color: 'var(--color-text-primary)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setShowAddModal(false); resetForm() }} className="px-4 py-2 rounded-md text-sm" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>取消</button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-md text-sm font-medium" style={{ background: 'var(--color-accent)', color: '#fff' }}>{editKOLId ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
