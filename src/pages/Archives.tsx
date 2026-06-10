import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Flame, Users, Wrench, Award, Download, Phone, MapPin } from 'lucide-react'
import { useFireStore } from '@/store'

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
    ...buildings.map((b) => {
      const p = persons.find((x) => x.id === b.responsiblePersonId)
      return [b.name, b.address, b.floors, b.area, b.fireLevel, p?.name ?? '', p?.phone ?? '']
    }),
    [], ['消防设施'], ['楼栋', '类型', '位置', '数量', '状态', '上次检查'],
    ...facilities.map((f) => [buildings.find((x) => x.id === f.buildingId)?.name ?? '', f.type, f.location, f.quantity, f.status, f.lastCheckDate]),
    [], ['责任人'], ['姓名', '角色', '电话', '负责楼栋'],
    ...persons.map((p) => [p.name, p.role, p.phone, p.buildingIds.map((id) => buildings.find((b) => b.id === id)?.name).filter(Boolean).join(';')]),
    [], ['维保记录'], ['设施', '楼栋', '日期', '内容', '操作人', '下次维保'],
    ...maintenanceRecords.map((m) => {
      const f = facilities.find((x) => x.id === m.facilityId)
      return [f?.type ?? '', buildings.find((x) => x.id === f?.buildingId)?.name ?? '', m.date, m.content, m.operator, m.nextDate]
    }),
    [], ['证书管理'], ['证书名称', '关联设施', '签发日期', '到期日期', '状态'],
    ...certificates.map((c) => [c.name, facilities.find((x) => x.id === c.facilityId)?.type ?? '', c.issueDate, c.expiryDate, c.status]),
  ]
  const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `消防台账_${month || '全部'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const thCls = 'px-4 py-3 text-left font-medium text-slate-600'
const tdCls = 'px-4 py-3 text-slate-700'
const tdMuted = 'px-4 py-3 text-slate-500'

export default function Archives() {
  const [activeTab, setActiveTab] = useState<TabKey>('buildings')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [exportMonth, setExportMonth] = useState('')
  const { buildings, facilities, maintenanceRecords, certificates, persons } = useFireStore()

  const getPerson = (id: string) => persons.find((p) => p.id === id)
  const getBuilding = (id: string) => buildings.find((b) => b.id === id)
  const getFacility = (id: string) => facilities.find((f) => f.id === id)
  const filteredFacilities = buildingFilter ? facilities.filter((f) => f.buildingId === buildingFilter) : facilities

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">档案管理</h1>
        <div className="flex items-center gap-3">
          <input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-fire-600 focus:outline-none" />
          <button onClick={() => exportCSV({ buildings, facilities, persons, maintenanceRecords, certificates }, exportMonth)}
            className="flex items-center gap-2 rounded-lg bg-fire-600 px-4 py-2 text-sm font-medium text-white hover:bg-fire-700 transition">
            <Download size={16} /> 导出月度台账
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === t.key ? 'border-b-2 border-fire-600 text-fire-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

          {activeTab === 'buildings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildings.map((b) => {
                const p = getPerson(b.responsiblePersonId)
                return (
                  <div key={b.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800">{b.name}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${fireLevelStyle[b.fireLevel]}`}>{b.fireLevel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} />{b.address}</div>
                    <div className="flex gap-4 text-sm text-slate-600"><span>{b.floors} 层</span><span>{b.area} m²</span></div>
                    {p && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{p.name}</span>
                        <span className="flex items-center gap-1 text-slate-500"><Phone size={12} />{p.phone}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'facilities' && (
            <div className="space-y-4">
              <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-fire-600 focus:outline-none">
                <option value="">全部楼栋</option>
                {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className={thCls}>楼栋</th><th className={thCls}>类型</th><th className={thCls}>位置</th>
                      <th className={thCls}>数量</th><th className={thCls}>状态</th><th className={thCls}>上次检查</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFacilities.map((f) => (
                      <tr key={f.id} className="border-t border-slate-100">
                        <td className={tdCls}>{getBuilding(f.buildingId)?.name}</td>
                        <td className={tdCls}>{f.type}</td><td className={tdCls}>{f.location}</td>
                        <td className={tdCls}>{f.quantity}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[f.status]}`}>{f.status}</span></td>
                        <td className={tdMuted}>{f.lastCheckDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'persons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {persons.map((p) => (
                <div key={p.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">{p.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyle[p.role]}`}>{p.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500"><Phone size={14} />{p.phone}</div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">负责楼栋：</span>
                    {p.buildingIds.map((id) => getBuilding(id)?.name).filter(Boolean).join('、') || '无'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={thCls}>设施</th><th className={thCls}>楼栋</th><th className={thCls}>日期</th>
                    <th className={thCls}>内容</th><th className={thCls}>操作人</th><th className={thCls}>下次维保</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceRecords.map((m) => {
                    const f = getFacility(m.facilityId)
                    return (
                      <tr key={m.id} className="border-t border-slate-100">
                        <td className={tdCls}>{f?.type ?? ''}</td>
                        <td className={tdCls}>{f ? getBuilding(f.buildingId)?.name : ''}</td>
                        <td className={tdMuted}>{m.date}</td><td className={tdCls}>{m.content}</td>
                        <td className={tdCls}>{m.operator}</td><td className={tdMuted}>{m.nextDate}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={thCls}>证书名称</th><th className={thCls}>关联设施</th>
                    <th className={thCls}>签发日期</th><th className={thCls}>到期日期</th><th className={thCls}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => {
                    const f = getFacility(c.facilityId)
                    return (
                      <tr key={c.id} className={`border-t border-slate-100 ${certRowBg[c.status]}`}>
                        <td className={tdCls}>{c.name}</td><td className={tdCls}>{f?.type ?? ''}</td>
                        <td className={tdMuted}>{c.issueDate}</td><td className={tdMuted}>{c.expiryDate}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[c.status]}`}>{c.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
