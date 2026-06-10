import { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, AlertTriangle, Camera, Image, X } from 'lucide-react'
import { useFireStore } from '@/store'
import type { Hazard } from '@/types'

const statusClass: Record<Hazard['status'], string> = {
  '待分派': 'status-pending', '整改中': 'status-progress', '待复查': 'status-recheck',
  '已关闭': 'status-closed', '已超期': 'status-overdue',
}
const levelClass: Record<Hazard['level'], string> = {
  '一般': 'level-normal', '较大': 'level-medium', '重大': 'level-high', '特别重大': 'level-critical',
}
const statusList = ['全部', '待分派', '整改中', '待复查', '已关闭', '已超期'] as const
const levelList = ['全部', '一般', '较大', '重大', '特别重大'] as const

function deadlineInfo(deadline: string) {
  if (!deadline) return { urgent: false, overdue: false }
  const diff = new Date(deadline).getTime() - Date.now()
  const days = diff / 86400000
  return { urgent: days <= 3 && days > 0, overdue: days <= 0 }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function PhotoUploader({ photos, onPhotosChange }: { photos: string[]; onPhotosChange: (p: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPhotos: string[] = [...photos]
    for (let i = 0; i < files.length; i++) {
      const dataUrl = await readFileAsDataUrl(files[i])
      newPhotos.push(dataUrl)
    }
    onPhotosChange(newPhotos)
    if (inputRef.current) inputRef.current.value = ''
  }
  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <div onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-4 text-slate-400 hover:border-fire-300 hover:text-fire-500 transition-colors">
        <Camera className="mr-2 h-5 w-5" />点击选择照片
      </div>
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((src, i) => (
            <div key={i} className="relative h-16 w-16">
              <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
              <button onClick={() => onPhotosChange(photos.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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

function RegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { buildings, addHazard } = useFireStore()
  const [form, setForm] = useState({ buildingId: '', location: '', description: '', level: '一般' as Hazard['level'] })
  const [photos, setPhotos] = useState<string[]>([])
  const submit = () => {
    if (!form.buildingId || !form.location || !form.description) return
    addHazard({ id: `h${Date.now()}`, ...form, status: '待分派', photos, createdAt: new Date().toISOString().slice(0, 10), deadline: '', assigneeId: '', rechecks: [] })
    setForm({ buildingId: '', location: '', description: '', level: '一般' })
    setPhotos([])
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="登记隐患">
      <div className="space-y-3">
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.buildingId}
          onChange={e => setForm(f => ({ ...f, buildingId: e.target.value }))}>
          <option value="">选择楼栋</option>
          {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="隐患位置"
          value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} placeholder="隐患描述"
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.level}
          onChange={e => setForm(f => ({ ...f, level: e.target.value as Hazard['level'] }))}>
          {levelList.filter(l => l !== '全部').map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <PhotoUploader photos={photos} onPhotosChange={setPhotos} />
        <button onClick={submit} className="w-full rounded-lg bg-fire-600 py-2 text-sm font-medium text-white hover:bg-fire-700">提交</button>
      </div>
    </Modal>
  )
}

function AssignModal({ open, onClose, hazard }: { open: boolean; onClose: () => void; hazard: Hazard | null }) {
  const { persons, updateHazard } = useFireStore()
  const [form, setForm] = useState({ assigneeId: '', deadline: '', requirement: '' })
  const submit = () => {
    if (!hazard || !form.assigneeId || !form.deadline) return
    updateHazard(hazard.id, {
      status: '整改中', assigneeId: form.assigneeId, deadline: form.deadline,
      rectification: { assigneeId: form.assigneeId, deadline: form.deadline, requirement: form.requirement, photos: [] },
    })
    setForm({ assigneeId: '', deadline: '', requirement: '' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="分派隐患">
      <div className="space-y-3">
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.assigneeId}
          onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
          <option value="">选择责任人</option>
          {persons.map(p => <option key={p.id} value={p.id}>{p.name} - {p.role}</option>)}
        </select>
        <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.deadline}
          onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} placeholder="整改要求"
          value={form.requirement} onChange={e => setForm(f => ({ ...f, requirement: e.target.value }))} />
        <button onClick={submit} className="w-full rounded-lg bg-fire-600 py-2 text-sm font-medium text-white hover:bg-fire-700">确认分派</button>
      </div>
    </Modal>
  )
}

function RecheckModal({ open, onClose, hazard }: { open: boolean; onClose: () => void; hazard: Hazard | null }) {
  const { updateHazard } = useFireStore()
  const [form, setForm] = useState({ result: '通过' as '通过' | '不通过', opinion: '' })
  const [photos, setPhotos] = useState<string[]>([])
  const submit = () => {
    if (!hazard) return
    updateHazard(hazard.id, {
      status: form.result === '通过' ? '已关闭' : '整改中',
      rechecks: [...hazard.rechecks, { id: `r${Date.now()}`, hazardId: hazard.id, result: form.result, opinion: form.opinion, photos, createdAt: new Date().toISOString().slice(0, 10) }],
    })
    setForm({ result: '通过', opinion: '' })
    setPhotos([])
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="复查隐患">
      <div className="space-y-3">
        <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.result}
          onChange={e => setForm(f => ({ ...f, result: e.target.value as '通过' | '不通过' }))}>
          <option value="通过">通过</option><option value="不通过">不通过</option>
        </select>
        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} placeholder="复查意见"
          value={form.opinion} onChange={e => setForm(f => ({ ...f, opinion: e.target.value }))} />
        <PhotoUploader photos={photos} onPhotosChange={setPhotos} />
        <button onClick={submit} className="w-full rounded-lg bg-fire-600 py-2 text-sm font-medium text-white hover:bg-fire-700">提交复查</button>
      </div>
    </Modal>
  )
}

function RectifyModal({ open, onClose, hazard }: { open: boolean; onClose: () => void; hazard: Hazard | null }) {
  const { updateHazard } = useFireStore()
  const [rectPhotos, setRectPhotos] = useState<string[]>([])
  const submit = () => {
    if (!hazard) return
    updateHazard(hazard.id, {
      status: '待复查',
      rectification: { ...hazard.rectification!, completedAt: new Date().toISOString().slice(0, 10), photos: rectPhotos },
    })
    setRectPhotos([])
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="提交整改">
      <div className="space-y-3">
        <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} placeholder="整改结果" />
        <PhotoUploader photos={rectPhotos} onPhotosChange={setRectPhotos} />
        <button onClick={submit} className="w-full rounded-lg bg-fire-600 py-2 text-sm font-medium text-white hover:bg-fire-700">提交</button>
      </div>
    </Modal>
  )
}

function HazardDetailModal({ open, onClose, hazard, onRectify }: { open: boolean; onClose: () => void; hazard: Hazard | null; onRectify: (h: Hazard) => void }) {
  const { buildings, persons } = useFireStore()
  if (!hazard) return null
  const buildingName = buildings.find(b => b.id === hazard.buildingId)?.name ?? '-'
  const rect = hazard.rectification
  const assigneeName = rect ? (persons.find(p => p.id === rect.assigneeId)?.name ?? '-') : '-'
  return (
    <Modal open={open} onClose={onClose} title="隐患详情">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">楼栋</span><span className="font-medium">{buildingName}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">位置</span><span className="font-medium">{hazard.location}</span></div>
        <div><span className="text-slate-500">描述</span><p className="mt-1 text-slate-700">{hazard.description}</p></div>
        <div className="flex justify-between"><span className="text-slate-500">等级</span><span className={`status-badge ${levelClass[hazard.level]}`}>{hazard.level}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">状态</span><span className={`status-badge ${statusClass[hazard.status]}`}>{hazard.status}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">截止日期</span><span className="font-medium">{hazard.deadline || '-'}</span></div>
        {hazard.photos.length > 0 && (
          <div><span className="text-slate-500">隐患照片（{hazard.photos.length}张）</span>
            <div className="mt-1 flex flex-wrap gap-2">{hazard.photos.map((src, i) => <img key={i} src={src} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />)}</div>
          </div>
        )}
        {rect && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 font-medium text-slate-700">整改信息</p>
            {rect.requirement && <div className="flex justify-between"><span className="text-slate-500">整改要求</span><span className="font-medium">{rect.requirement}</span></div>}
            <div className="flex justify-between"><span className="text-slate-500">责任人</span><span className="font-medium">{assigneeName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">截止日期</span><span className="font-medium">{rect.deadline || '-'}</span></div>
            {rect.completedAt && <div className="flex justify-between"><span className="text-slate-500">完成日期</span><span className="font-medium">{rect.completedAt}</span></div>}
            {rect.photos.length > 0 && (
              <div className="mt-2"><span className="text-slate-500">整改照片（{rect.photos.length}张）</span>
                <div className="mt-1 flex flex-wrap gap-2">{rect.photos.map((src, i) => <img key={i} src={src} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />)}</div>
              </div>
            )}
          </div>
        )}
        {hazard.rechecks.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 font-medium text-slate-700">复查记录</p>
            {hazard.rechecks.map((r, idx) => (
              <div key={r.id} className={idx > 0 ? 'mt-2 border-t border-slate-50 pt-2' : ''}>
                <div className="flex justify-between"><span className="text-slate-500">复查{idx + 1}</span><span className={`status-badge ${r.result === '通过' ? 'status-closed' : 'status-progress'}`}>{r.result}</span></div>
                {r.opinion && <div className="flex justify-between"><span className="text-slate-500">意见</span><span className="font-medium">{r.opinion}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">日期</span><span className="font-medium">{r.createdAt}</span></div>
                {r.photos.length > 0 && <div className="mt-1 flex flex-wrap gap-2">{r.photos.map((src, i) => <img key={i} src={src} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />)}</div>}
              </div>
            ))}
          </div>
        )}
        {hazard.status === '整改中' && (
          <button onClick={() => { onRectify(hazard); onClose() }} className="w-full rounded-lg bg-fire-600 py-2 text-sm font-medium text-white hover:bg-fire-700">提交整改</button>
        )}
      </div>
    </Modal>
  )
}

export default function Hazards() {
  const { hazards, buildings, persons } = useFireStore()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('全部')
  const [levelFilter, setLevelFilter] = useState<string>('全部')
  const [buildingFilter, setBuildingFilter] = useState<string>('全部')
  const [regOpen, setRegOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<Hazard | null>(null)
  const [recheckTarget, setRecheckTarget] = useState<Hazard | null>(null)
  const [rectifyTarget, setRectifyTarget] = useState<Hazard | null>(null)
  const [detailTarget, setDetailTarget] = useState<Hazard | null>(null)

  useEffect(() => {
    const s = searchParams.get('status')
    if (s && (statusList as readonly string[]).includes(s)) setStatusFilter(s)
  }, [searchParams])

  const buildingMap = useMemo(() => Object.fromEntries(buildings.map(b => [b.id, b.name])), [buildings])
  const urgentCount = useMemo(() => hazards.filter(h => { const { urgent, overdue } = deadlineInfo(h.deadline); return urgent || overdue }).length, [hazards])
  const overdueCount = useMemo(() => hazards.filter(h => deadlineInfo(h.deadline).overdue).length, [hazards])

  const filtered = useMemo(() => hazards.filter(h => {
    if (statusFilter !== '全部' && h.status !== statusFilter) return false
    if (levelFilter !== '全部' && h.level !== levelFilter) return false
    if (buildingFilter !== '全部' && h.buildingId !== buildingFilter) return false
    if (search && !h.description.includes(search) && !h.location.includes(search) && !buildingMap[h.buildingId]?.includes(search)) return false
    return true
  }), [hazards, statusFilter, levelFilter, buildingFilter, search, buildingMap])

  const actionBtn = (h: Hazard) => {
    switch (h.status) {
      case '待分派': return <button onClick={() => setAssignTarget(h)} className="rounded-md bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">分派</button>
      case '整改中': return <button onClick={() => setRectifyTarget(h)} className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">提交整改</button>
      case '待复查': return <button onClick={() => setRecheckTarget(h)} className="rounded-md bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100">复查</button>
      case '已关闭': return <button onClick={() => setDetailTarget(h)} className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">查看</button>
      case '已超期': return <button onClick={() => setAssignTarget(h)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100">催办</button>
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {urgentCount > 0 && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className={`flex items-center gap-3 rounded-xl px-5 py-3 ${overdueCount > 0 ? 'bg-gradient-to-r from-red-500 to-red-400 text-white' : 'bg-gradient-to-r from-amber-400 to-amber-300 text-amber-900'}`}>
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-medium">{overdueCount > 0 ? `${overdueCount}项隐患已超期，请立即处理！` : `${urgentCount}项隐患即将到期（3天内），请关注！`}</span>
        </motion.div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">隐患管理</h2>
        <button onClick={() => setRegOpen(true)} className="flex items-center gap-2 rounded-lg bg-fire-600 px-4 py-2 text-sm font-medium text-white hover:bg-fire-700">
          <Plus className="h-4 w-4" />登记隐患
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" placeholder="搜索隐患..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {statusList.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
          {levelList.map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)}>
          <option>全部</option>{buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">楼栋</th><th className="px-4 py-3">位置</th><th className="px-4 py-3">描述</th>
              <th className="px-4 py-3">等级</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">照片</th>
              <th className="px-4 py-3">截止日期</th><th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(h => {
              const { urgent, overdue } = deadlineInfo(h.deadline)
              const photoCount = h.photos.length + (h.rectification?.photos.length ?? 0) + h.rechecks.flatMap(r => r.photos).length
              return (
                <tr key={h.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{buildingMap[h.buildingId] || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{h.location}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{h.description}</td>
                  <td className="px-4 py-3"><span className={`status-badge ${levelClass[h.level]}`}>{h.level}</span></td>
                  <td className="px-4 py-3"><span className={`status-badge ${statusClass[h.status]}`}>{h.status}</span></td>
                  <td className="px-4 py-3">
                    {photoCount > 0 ? <span className="flex items-center gap-1 text-fire-600"><Image className="h-3.5 w-3.5" />{photoCount}</span> : <span className="text-slate-300">-</span>}
                  </td>
                  <td className={`px-4 py-3 ${overdue ? 'text-red-600 font-medium' : urgent ? 'text-amber-600 font-medium' : 'text-slate-600'}`}>{h.deadline || '-'}</td>
                  <td className="px-4 py-3">{actionBtn(h)}</td>
                </tr>
              )
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">暂无隐患记录</td></tr>}
          </tbody>
        </table>
      </div>
      <RegisterModal open={regOpen} onClose={() => setRegOpen(false)} />
      <AssignModal open={!!assignTarget} onClose={() => setAssignTarget(null)} hazard={assignTarget} />
      <RecheckModal open={!!recheckTarget} onClose={() => setRecheckTarget(null)} hazard={recheckTarget} />
      <RectifyModal open={!!rectifyTarget} onClose={() => setRectifyTarget(null)} hazard={rectifyTarget} />
      <HazardDetailModal open={!!detailTarget} onClose={() => setDetailTarget(null)} hazard={detailTarget} onRectify={h => { setDetailTarget(null); setRectifyTarget(h) }} />
    </motion.div>
  )
}
