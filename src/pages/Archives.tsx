import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Flame, Users, Wrench, Award, Download, Phone, MapPin, Plus, Pencil, Clock, AlertTriangle } from 'lucide-react'
import { useFireStore } from '@/store'
import type { Building, FireFacility, ResponsiblePerson, MaintenanceRecord, Certificate } from '@/types'
import { calcCertStatus, calcMaintenanceStatus } from '@/types'

const tabs = [
  { key: 'buildings', label: '建筑档案', icon: Building2 },
  { key: 'facilities', label: '消防设施', icon: Flame },
  { key: 'persons', label: '责任人', icon: Users },
  { key: 'maintenance', label: '维保记录', icon: Wrench },
  { key: 'certificates', label: '证书管理', icon: Award },
] as const
type TabKey = (typeof tabs)[number]['key']

const fireLevelStyle: Record<string, string> = {
  '一级': 'bg-red-100 text-red-700', '二级': 'bg-orange-100 text-orange-700',
  '三级': 'bg-amber-100 text-amber-700', '四级': 'bg-slate-100 text-slate-700',
}
const statusStyle: Record<string, string> = {
  '正常': 'bg-green-100 text-green-700', '维修中': 'bg-amber-100 text-amber-700',
  '报废': 'bg-red-100 text-red-700', '临期': 'bg-amber-100 text-amber-700', '已过期': 'bg-red-100 text-red-700',
}
const certRowBg: Record<string, string> = { '正常': '', '临期': 'bg-amber-50', '已过期': 'bg-red-50' }
const roleStyle: Record<string, string> = { '安全员': 'bg-blue-100 text-blue-700', '物业主管': 'bg-purple-100 text-purple-700' }

type StoreData = Pick<ReturnType<typeof useFireStore.getState>, 'buildings' | 'facilities' | 'persons' | 'maintenanceRecords' | 'certificates'>
function exportCSV(data: StoreData, month: string) {
  const { buildings, facilities, persons, maintenanceRecords, certificates } = data
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const rows: (string | number)[][] = [
    ['建筑档案'], ['名称', '地址', '楼层数', '面积', '消防等级', '负责人', '电话'],
    ...buildings.map((b) => { const p = persons.find((x) => x.id === b.responsiblePersonId); return [b.name, b.address, b.floors, b.area, b.fireLevel, p?.name ?? '', p?.phone ?? ''] }),
    [], ['消防设施'], ['楼栋', '类型', '位置', '数量', '状态', '上次检查'],
    ...facilities.map((f) => [buildings.find((x) => x.id === f.buildingId)?.name ?? '', f.type, f.location, f.quantity, f.status, f.lastCheckDate]),
    [], ['责任人'], ['姓名', '角色', '电话', '负责楼栋'],
    ...persons.map((p) => [p.name, p.role, p.phone, p.buildingIds.map((id) => buildings.find((b) => b.id === id)?.name).filter(Boolean).join(';')]),
    [], ['维保记录'], ['设施', '楼栋', '日期', '内容', '操作人', '下次维保', '提醒状态'],
    ...maintenanceRecords.map((m) => { const f = facilities.find((x) => x.id === m.facilityId); const overdue = new Date(m.nextDate) < new Date(); const nearExpiry = !overdue && (new Date(m.nextDate).getTime() - Date.now()) < 30 * 86400000; const alertStatus = overdue ? '已过期' : nearExpiry ? '临期' : '正常'; return [f?.type ?? '', buildings.find((x) => x.id === f?.buildingId)?.name ?? '', m.date, m.content, m.operator, m.nextDate, alertStatus] }),
    [], ['证书管理'], ['证书名称', '关联设施', '签发日期', '到期日期', '状态', '提醒状态'],
    ...certificates.map((c) => { const autoStatus = calcCertStatus(c.expiryDate); return [c.name, facilities.find((x) => x.id === c.facilityId)?.type ?? '', c.issueDate, c.expiryDate, autoStatus, autoStatus === '已过期' ? '已过期' : autoStatus === '临期' ? '即将到期' : '正常'] }),
  ]
  const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `消防台账_${month || '全部'}.csv`; a.click(); URL.revokeObjectURL(url)
}

const thCls = 'px-4 py-3 text-left font-medium text-slate-600'
const tdCls = 'px-4 py-3 text-slate-700'
const tdMuted = 'px-4 py-3 text-slate-500'
const ic = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm'
const bc = 'w-full rounded-lg bg-fire-600 py-2 text-sm font-medium text-white hover:bg-fire-700'
const ebc = 'rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition'

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-slate-800">{title}</h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BuildingModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: Building | null }) {
  const { persons, addBuilding, updateBuilding } = useFireStore()
  const d = { name: '', floors: 1, area: 0, fireLevel: '一级' as Building['fireLevel'], address: '', responsiblePersonId: '' }
  const [form, setForm] = useState(d)
  useEffect(() => { setForm(item ? { name: item.name, floors: item.floors, area: item.area, fireLevel: item.fireLevel, address: item.address, responsiblePersonId: item.responsiblePersonId } : d) }, [open])
  const submit = () => {
    if (!form.name || !form.address) return
    if (item) updateBuilding(item.id, form); else addBuilding({ id: `b${Date.now()}`, ...form })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? '编辑建筑' : '新增建筑'}>
      <div className="space-y-3">
        <input className={ic} placeholder="建筑名称" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <div className="flex gap-3">
          <input type="number" className={ic} placeholder="楼层数" value={form.floors} onChange={e => setForm(f => ({ ...f, floors: Number(e.target.value) }))} />
          <input type="number" className={ic} placeholder="面积(m²)" value={form.area} onChange={e => setForm(f => ({ ...f, area: Number(e.target.value) }))} />
        </div>
        <select className={ic} value={form.fireLevel} onChange={e => setForm(f => ({ ...f, fireLevel: e.target.value as Building['fireLevel'] }))}>
          {['一级', '二级', '三级', '四级'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input className={ic} placeholder="地址" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        <select className={ic} value={form.responsiblePersonId} onChange={e => setForm(f => ({ ...f, responsiblePersonId: e.target.value }))}>
          <option value="">选择负责人</option>
          {persons.map(p => <option key={p.id} value={p.id}>{p.name} - {p.role}</option>)}
        </select>
        <button onClick={submit} className={bc}>保存</button>
      </div>
    </Modal>
  )
}

function FacilityModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: FireFacility | null }) {
  const { buildings, addFacility, updateFacility } = useFireStore()
  const d = { buildingId: '', type: '灭火器' as FireFacility['type'], location: '', quantity: 1, status: '正常' as FireFacility['status'], lastCheckDate: '' }
  const [form, setForm] = useState(d)
  useEffect(() => { setForm(item ? { buildingId: item.buildingId, type: item.type, location: item.location, quantity: item.quantity, status: item.status, lastCheckDate: item.lastCheckDate } : d) }, [open])
  const submit = () => {
    if (!form.buildingId || !form.location) return
    if (item) updateFacility(item.id, form); else addFacility({ id: `f${Date.now()}`, ...form })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? '编辑设施' : '新增设施'}>
      <div className="space-y-3">
        <select className={ic} value={form.buildingId} onChange={e => setForm(f => ({ ...f, buildingId: e.target.value }))}>
          <option value="">选择楼栋</option>
          {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className={ic} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as FireFacility['type'] }))}>
          {['灭火器', '喷淋头', '烟感报警器', '消防栓', '应急灯'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className={ic} placeholder="位置" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        <input type="number" className={ic} placeholder="数量" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} />
        <select className={ic} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as FireFacility['status'] }))}>
          {['正常', '维修中', '报废'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" className={ic} value={form.lastCheckDate} onChange={e => setForm(f => ({ ...f, lastCheckDate: e.target.value }))} />
        <button onClick={submit} className={bc}>保存</button>
      </div>
    </Modal>
  )
}

function PersonModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: ResponsiblePerson | null }) {
  const { buildings, addPerson, updatePerson } = useFireStore()
  const d = { name: '', phone: '', role: '安全员' as ResponsiblePerson['role'], buildingIds: [] as string[] }
  const [form, setForm] = useState(d)
  useEffect(() => { setForm(item ? { name: item.name, phone: item.phone, role: item.role, buildingIds: [...item.buildingIds] } : d) }, [open])
  const toggle = (id: string) => setForm(f => ({ ...f, buildingIds: f.buildingIds.includes(id) ? f.buildingIds.filter(b => b !== id) : [...f.buildingIds, id] }))
  const submit = () => {
    if (!form.name || !form.phone) return
    if (item) updatePerson(item.id, form); else addPerson({ id: `p${Date.now()}`, ...form })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? '编辑责任人' : '新增责任人'}>
      <div className="space-y-3">
        <input className={ic} placeholder="姓名" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className={ic} placeholder="电话" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        <select className={ic} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as ResponsiblePerson['role'] }))}>
          {['安全员', '物业主管'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="space-y-1">
          <span className="text-sm text-slate-600">负责楼栋</span>
          <div className="flex flex-wrap gap-2">
            {buildings.map(b => (
              <label key={b.id} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${form.buildingIds.includes(b.id) ? 'border-fire-600 bg-fire-50 text-fire-700' : 'border-slate-200 text-slate-600'}`}>
                <input type="checkbox" className="hidden" checked={form.buildingIds.includes(b.id)} onChange={() => toggle(b.id)} />{b.name}
              </label>
            ))}
          </div>
        </div>
        <button onClick={submit} className={bc}>保存</button>
      </div>
    </Modal>
  )
}

function MaintenanceModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: MaintenanceRecord | null }) {
  const { facilities, addMaintenance, updateMaintenance } = useFireStore()
  const d = { facilityId: '', date: '', content: '', operator: '', nextDate: '' }
  const [form, setForm] = useState(d)
  useEffect(() => { setForm(item ? { facilityId: item.facilityId, date: item.date, content: item.content, operator: item.operator, nextDate: item.nextDate } : d) }, [open])
  const submit = () => {
    if (!form.facilityId || !form.date || !form.content) return
    if (item) updateMaintenance(item.id, form); else addMaintenance({ id: `m${Date.now()}`, ...form })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? '编辑维保记录' : '新增维保记录'}>
      <div className="space-y-3">
        <select className={ic} value={form.facilityId} onChange={e => setForm(f => ({ ...f, facilityId: e.target.value }))}>
          <option value="">选择设施</option>
          {facilities.map(f => <option key={f.id} value={f.id}>{f.type} - {f.location}</option>)}
        </select>
        <input type="date" className={ic} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <textarea className={ic} rows={3} placeholder="维保内容" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
        <input className={ic} placeholder="操作人" value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} />
        <input type="date" className={ic} value={form.nextDate} onChange={e => setForm(f => ({ ...f, nextDate: e.target.value }))} />
        <button onClick={submit} className={bc}>保存</button>
      </div>
    </Modal>
  )
}

function CertificateModal({ open, onClose, item }: { open: boolean; onClose: () => void; item: Certificate | null }) {
  const { facilities, addCertificate, updateCertificate } = useFireStore()
  const d = { facilityId: '', name: '', issueDate: '', expiryDate: '' }
  const [form, setForm] = useState(d)
  useEffect(() => { setForm(item ? { facilityId: item.facilityId, name: item.name, issueDate: item.issueDate, expiryDate: item.expiryDate } : d) }, [open])
  const submit = () => {
    if (!form.facilityId || !form.name || !form.issueDate || !form.expiryDate) return
    const status = calcCertStatus(form.expiryDate)
    if (item) updateCertificate(item.id, { ...form, status }); else addCertificate({ id: `c${Date.now()}`, ...form, status })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={item ? '编辑证书' : '新增证书'}>
      <div className="space-y-3">
        <select className={ic} value={form.facilityId} onChange={e => setForm(f => ({ ...f, facilityId: e.target.value }))}>
          <option value="">选择关联设施</option>
          {facilities.map(f => <option key={f.id} value={f.id}>{f.type} - {f.location}</option>)}
        </select>
        <input className={ic} placeholder="证书名称" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input type="date" className={ic} value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
        <input type="date" className={ic} value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
        {form.expiryDate && <p className="text-xs text-slate-500">系统将按到期日期自动判断状态：{calcCertStatus(form.expiryDate)}</p>}
        <button onClick={submit} className={bc}>保存</button>
      </div>
    </Modal>
  )
}

export default function Archives() {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab = tabs.find(t => t.key === tabParam)?.key ?? 'buildings'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab as TabKey)
  useEffect(() => { if (tabParam && tabs.some(t => t.key === tabParam)) setActiveTab(tabParam as TabKey) }, [tabParam])
  const [buildingFilter, setBuildingFilter] = useState('')
  const [exportMonth, setExportMonth] = useState('')
  const { buildings, facilities, maintenanceRecords, certificates, persons } = useFireStore()
  const [bm, setBm] = useState<{ open: boolean; item: Building | null }>({ open: false, item: null })
  const [fm, setFm] = useState<{ open: boolean; item: FireFacility | null }>({ open: false, item: null })
  const [pm, setPm] = useState<{ open: boolean; item: ResponsiblePerson | null }>({ open: false, item: null })
  const [mm, setMm] = useState<{ open: boolean; item: MaintenanceRecord | null }>({ open: false, item: null })
  const [cm, setCm] = useState<{ open: boolean; item: Certificate | null }>({ open: false, item: null })
  const getPerson = (id: string) => persons.find(p => p.id === id)
  const getBuilding = (id: string) => buildings.find(b => b.id === id)
  const getFacility = (id: string) => facilities.find(f => f.id === id)
  const filteredFacilities = buildingFilter ? facilities.filter(f => f.buildingId === buildingFilter) : facilities

  const expiryAlerts = useMemo(() => {
    const alerts: { type: 'cert' | 'maintenance'; label: string; detail: string; status: string }[] = []
    certificates.forEach(c => {
      const s = calcCertStatus(c.expiryDate)
      if (s !== '正常') {
        const f = getFacility(c.facilityId)
        const b = f ? getBuilding(f.buildingId) : null
        alerts.push({ type: 'cert', label: c.name, detail: `${b?.name ?? '-'} · 到期: ${c.expiryDate}`, status: s })
      }
    })
    maintenanceRecords.forEach(m => {
      const s = calcMaintenanceStatus(m.nextDate)
      if (s !== '正常') {
        const f = getFacility(m.facilityId)
        const b = f ? getBuilding(f.buildingId) : null
        alerts.push({ type: 'maintenance', label: m.content, detail: `${b?.name ?? '-'} · 下次维保: ${m.nextDate}`, status: s })
      }
    })
    return alerts
  }, [certificates, maintenanceRecords, facilities, buildings])

  const addBtn = (onClick: () => void) => (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg bg-fire-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-fire-700 transition"><Plus size={14} />新增</button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">档案管理</h1>
        <div className="flex items-center gap-3">
          <input type="month" value={exportMonth} onChange={e => setExportMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-fire-600 focus:outline-none" />
          <button onClick={() => exportCSV({ buildings, facilities, persons, maintenanceRecords, certificates }, exportMonth)}
            className="flex items-center gap-2 rounded-lg bg-fire-600 px-4 py-2 text-sm font-medium text-white hover:bg-fire-700 transition">
            <Download size={16} /> 导出月度台账
          </button>
        </div>
      </div>
      <div className="border-b border-slate-200">
        <nav className="flex">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${activeTab === t.key ? 'border-b-2 border-fire-600 text-fire-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </nav>
      </div>
      {expiryAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">到期提醒（{expiryAlerts.length}项）</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiryAlerts.map((a, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${a.status === '已过期' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {a.type === 'cert' ? <Award className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                {a.label} - {a.detail}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${a.status === '已过期' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>{a.status}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {activeTab === 'buildings' && (
            <div className="space-y-4">
              <div className="flex justify-end">{addBtn(() => setBm({ open: true, item: null }))}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buildings.map(b => { const p = getPerson(b.responsiblePersonId); return (
                  <div key={b.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800">{b.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${fireLevelStyle[b.fireLevel]}`}>{b.fireLevel}</span>
                        <button onClick={() => setBm({ open: true, item: b })} className={ebc}><Pencil size={12} />编辑</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} />{b.address}</div>
                    <div className="flex gap-4 text-sm text-slate-600"><span>{b.floors} 层</span><span>{b.area} m²</span></div>
                    {p && <div className="flex items-center justify-between text-sm"><span className="text-slate-600">{p.name}</span><span className="flex items-center gap-1 text-slate-500"><Phone size={12} />{p.phone}</span></div>}
                  </div>
                )})}
              </div>
            </div>
          )}
          {activeTab === 'facilities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <select value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-fire-600 focus:outline-none">
                  <option value="">全部楼栋</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {addBtn(() => setFm({ open: true, item: null }))}
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm"><thead className="bg-slate-50"><tr>
                  <th className={thCls}>楼栋</th><th className={thCls}>类型</th><th className={thCls}>位置</th><th className={thCls}>数量</th><th className={thCls}>状态</th><th className={thCls}>上次检查</th><th className={thCls}>操作</th>
                </tr></thead><tbody>
                  {filteredFacilities.map(f => (
                    <tr key={f.id} className="border-t border-slate-100">
                      <td className={tdCls}>{getBuilding(f.buildingId)?.name}</td><td className={tdCls}>{f.type}</td><td className={tdCls}>{f.location}</td>
                      <td className={tdCls}>{f.quantity}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[f.status]}`}>{f.status}</span></td>
                      <td className={tdMuted}>{f.lastCheckDate}</td>
                      <td className="px-4 py-3"><button onClick={() => setFm({ open: true, item: f })} className={ebc}><Pencil size={12} />编辑</button></td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            </div>
          )}
          {activeTab === 'persons' && (
            <div className="space-y-4">
              <div className="flex justify-end">{addBtn(() => setPm({ open: true, item: null }))}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {persons.map(p => (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800">{p.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyle[p.role]}`}>{p.role}</span>
                        <button onClick={() => setPm({ open: true, item: p })} className={ebc}><Pencil size={12} />编辑</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500"><Phone size={14} />{p.phone}</div>
                    <div className="text-sm text-slate-600"><span className="font-medium">负责楼栋：</span>{p.buildingIds.map(id => getBuilding(id)?.name).filter(Boolean).join('、') || '无'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex justify-end">{addBtn(() => setMm({ open: true, item: null }))}</div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm"><thead className="bg-slate-50"><tr>
                  <th className={thCls}>设施</th><th className={thCls}>楼栋</th><th className={thCls}>日期</th><th className={thCls}>内容</th><th className={thCls}>操作人</th><th className={thCls}>下次维保</th><th className={thCls}>提醒</th><th className={thCls}>操作</th>
                </tr></thead><tbody>
                  {maintenanceRecords.map(m => { const f = getFacility(m.facilityId); const overdue = new Date(m.nextDate) < new Date(); const nearExpiry = !overdue && (new Date(m.nextDate).getTime() - Date.now()) < 30 * 86400000; const alertStatus = overdue ? '已过期' : nearExpiry ? '临期' : '正常'; return (
                    <tr key={m.id} className={`border-t border-slate-100 ${overdue ? 'bg-red-50' : nearExpiry ? 'bg-amber-50' : ''}`}>
                      <td className={tdCls}>{f?.type ?? ''}</td><td className={tdCls}>{f ? getBuilding(f.buildingId)?.name : ''}</td>
                      <td className={tdMuted}>{m.date}</td><td className={tdCls}>{m.content}</td><td className={tdCls}>{m.operator}</td><td className={tdMuted}>{m.nextDate}</td>
                      <td className="px-4 py-3">{alertStatus !== '正常' ? <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}><AlertTriangle className="h-3 w-3" />{alertStatus}</span> : <span className="text-slate-300">-</span>}</td>
                      <td className="px-4 py-3"><button onClick={() => setMm({ open: true, item: m })} className={ebc}><Pencil size={12} />编辑</button></td>
                    </tr>
                  )})}
                </tbody></table>
              </div>
            </div>
          )}
          {activeTab === 'certificates' && (
            <div className="space-y-4">
              <div className="flex justify-end">{addBtn(() => setCm({ open: true, item: null }))}</div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm"><thead className="bg-slate-50"><tr>
                  <th className={thCls}>证书名称</th><th className={thCls}>关联设施</th><th className={thCls}>签发日期</th><th className={thCls}>到期日期</th><th className={thCls}>状态</th><th className={thCls}>操作</th>
                </tr></thead><tbody>
                  {certificates.map(c => { const f = getFacility(c.facilityId); const autoStatus = calcCertStatus(c.expiryDate); return (
                    <tr key={c.id} className={`border-t border-slate-100 ${certRowBg[autoStatus]}`}>
                      <td className={tdCls}>{c.name}</td><td className={tdCls}>{f?.type ?? ''}</td>
                      <td className={tdMuted}>{c.issueDate}</td><td className={tdMuted}>{c.expiryDate}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[autoStatus]}`}>{autoStatus}</span></td>
                      <td className="px-4 py-3"><button onClick={() => setCm({ open: true, item: c })} className={ebc}><Pencil size={12} />编辑</button></td>
                    </tr>
                  )})}
                </tbody></table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <BuildingModal open={bm.open} onClose={() => setBm({ open: false, item: null })} item={bm.item} />
      <FacilityModal open={fm.open} onClose={() => setFm({ open: false, item: null })} item={fm.item} />
      <PersonModal open={pm.open} onClose={() => setPm({ open: false, item: null })} item={pm.item} />
      <MaintenanceModal open={mm.open} onClose={() => setMm({ open: false, item: null })} item={mm.item} />
      <CertificateModal open={cm.open} onClose={() => setCm({ open: false, item: null })} item={cm.item} />
    </div>
  )
}
