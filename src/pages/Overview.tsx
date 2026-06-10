import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell } from 'recharts'
import {
  AlertTriangle, ClipboardCheck, Flame, FileDown, Shield, Bell, ArrowRight,
  Award, Wrench, Clock, BarChart3, Building2, ChevronDown, ChevronRight,
  User, CheckCircle, XCircle,
} from 'lucide-react'
import { useFireStore } from '@/store'
import { calcCertStatus, calcMaintenanceStatus } from '@/types'

const RISK_COLORS = ['#22c55e', '#f59e0b', '#f97316', '#ef4444']
const RISK_LABELS = ['低', '中', '高', '极高']

function getRiskLevel(hazards: ReturnType<typeof useFireStore.getState>['hazards']) {
  const counts = [0, 0, 0, 0]
  hazards.forEach((h) => {
    if (h.status === '已关闭') counts[0]++
    else if (h.level === '一般') counts[0]++
    else if (h.level === '较大') counts[1]++
    else if (h.level === '重大') counts[2]++
    else counts[3]++
  })
  const total = counts.reduce((a, b) => a + b, 0) || 1
  const weighted = (counts[1] * 2 + counts[2] * 4 + counts[3] * 8) / total
  const idx = weighted < 1 ? 0 : weighted < 3 ? 1 : weighted < 5 ? 2 : 3
  return { counts, level: RISK_LABELS[idx], color: RISK_COLORS[idx] }
}

const LEVEL_BADGE: Record<string, string> = {
  低: 'bg-emerald-50 text-emerald-700', 中: 'bg-amber-50 text-amber-700', 高: 'bg-red-50 text-red-700',
}

function TodoCard({ icon, count, label, color, to }: { icon: React.ReactNode; count: number; label: string; color: string; to: string }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)} className="card-hover w-full rounded-xl bg-white p-5 shadow-sm text-left">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>{icon}</div>
        <div className="flex-1"><p className="text-2xl font-bold text-slate-800">{count}</p><p className="text-sm text-slate-500">{label}</p></div>
        <ArrowRight className="h-4 w-4 text-slate-300" />
      </div>
    </button>
  )
}

function QuickAction({ icon, label, to, color }: { icon: React.ReactNode; label: string; to: string; color: string }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)} className="card-hover flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <span className="flex-1 text-left text-sm font-medium text-slate-700">{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </button>
  )
}

export default function Overview() {
  const { buildings, hazards, drills, alarms, inspectionRecords, certificates, maintenanceRecords, facilities, persons } = useFireStore()
  const navigate = useNavigate()
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null)

  const buildingMap = useMemo(() => Object.fromEntries(buildings.map((b) => [b.id, b.name])), [buildings])
  const personMap = useMemo(() => Object.fromEntries(persons.map((p) => [p.id, p.name])), [persons])
  const risk = useMemo(() => getRiskLevel(hazards), [hazards])

  const pendingRectification = hazards.filter((h) => h.status === '整改中').length
  const pendingRecheck = hazards.filter((h) => h.status === '待复查').length
  const pendingDrill = drills.filter((d) => d.status === '计划中').length
  const overdueHazards = hazards.filter((h) => h.status === '已超期').length
  const inspectedBuildingIds = new Set(inspectionRecords.map((r) => r.buildingId))
  const pendingInspection = buildings.filter((b) => !inspectedBuildingIds.has(b.id)).length

  const recentAlarms = useMemo(() => [...alarms].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6), [alarms])

  const expiringCerts = useMemo(() => certificates.filter((c) => calcCertStatus(c.expiryDate) !== '正常'), [certificates])
  const expiringMaintenance = useMemo(() => maintenanceRecords.filter((m) => calcMaintenanceStatus(m.nextDate) !== '正常'), [maintenanceRecords])

  const gaugeData = RISK_LABELS.map((name, i) => ({ name, value: risk.counts[i] }))

  const monthlyBoard = useMemo(() => {
    return buildings.map((b) => {
      const bHazards = hazards.filter((h) => h.buildingId === b.id)
      const closed = bHazards.filter((h) => h.status === '已关闭').length
      const overdue = bHazards.filter((h) => h.status === '已超期').length
      const total = bHazards.length || 1
      const bDrills = drills.filter((d) => d.buildingId === b.id && d.status === '已完成')
      const allIssues = bDrills.flatMap((d) => d.issues)
      const completedIssues = allIssues.filter((i) => i.completed).length
      const bCerts = certificates.filter((c) => { const f = facilities.find((fa) => fa.id === c.facilityId); return f?.buildingId === b.id && calcCertStatus(c.expiryDate) !== '正常' })
      const bMaint = maintenanceRecords.filter((m) => { const f = facilities.find((fa) => fa.id === m.facilityId); return f?.buildingId === b.id && calcMaintenanceStatus(m.nextDate) !== '正常' })
      return {
        id: b.id, name: b.name, hazardTotal: bHazards.length, closeRate: Math.round((closed / total) * 100), overdue,
        issueTotal: allIssues.length, issueDone: completedIssues, issueRate: allIssues.length ? Math.round((completedIssues / allIssues.length) * 100) : 100,
        expiringCount: bCerts.length + bMaint.length,
        hazards: bHazards, drillIssues: allIssues, expiringCerts: bCerts, expiringMaint: bMaint,
      }
    })
  }, [buildings, hazards, drills, certificates, maintenanceRecords, facilities])

  const personWorkbench = useMemo(() => {
    return persons.map((p) => {
      const pendingHazards = hazards.filter((h) => h.assigneeId === p.id && (h.status === '整改中' || h.status === '待分派'))
      const overdueHazardsList = hazards.filter((h) => h.assigneeId === p.id && h.status === '已超期')
      const recheckHazards = hazards.filter((h) => h.assigneeId === p.id && h.status === '待复查')
      const completedHazards = hazards.filter((h) => h.assigneeId === p.id && h.status === '已关闭')
      const drillIssues = drills.flatMap((d) => d.issues.filter((i) => i.assigneeId === p.id && !i.completed))
      const completedIssues = drills.flatMap((d) => d.issues.filter((i) => i.assigneeId === p.id && i.completed))
      return {
        id: p.id, name: p.name, role: p.role, phone: p.phone,
        pending: pendingHazards.length + drillIssues.length,
        overdue: overdueHazardsList.length,
        recheck: recheckHazards.length,
        completed: completedHazards.length + completedIssues.length,
        pendingHazards, overdueHazardsList, recheckHazards, drillIssues, completedIssues,
      }
    })
  }, [persons, hazards, drills])

  const exportMonthlyReport = () => {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const rows: (string | number)[][] = [
      ['消防管理主管月报', month],
      [],
      ['一、隐患关闭率'],
      ['楼栋', '隐患数', '关闭率', '超期数'],
      ...monthlyBoard.map((r) => [r.name, r.hazardTotal, `${r.closeRate}%`, r.overdue]),
      [],
      ['二、演练问题整改'],
      ['楼栋', '问题总数', '已完成', '完成率'],
      ...monthlyBoard.map((r) => [r.name, r.issueTotal, r.issueDone, `${r.issueRate}%`]),
      [],
      ['三、证书/维保到期'],
      ['楼栋', '到期项数'],
      ...monthlyBoard.map((r) => [r.name, r.expiringCount]),
      [],
      ['四、责任人工作汇总'],
      ['姓名', '角色', '待办', '超期', '待复查', '已完成'],
      ...personWorkbench.map((p) => [p.name, p.role, p.pending, p.overdue, p.recheck, p.completed]),
    ]
    const csv = '\uFEFF' + rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `消防主管月报_${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">风险等级</h3>
          <div className="relative flex items-center justify-center">
            <PieChart width={180} height={180}>
              <Pie data={gaugeData} cx={90} cy={90} innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                {gaugeData.map((_, i) => (<Cell key={i} fill={RISK_COLORS[i]} />))}
              </Pie>
            </PieChart>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold" style={{ color: risk.color }}>{risk.level}</span>
              <span className="text-xs text-slate-400">综合风险</span>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            {RISK_LABELS.map((label, i) => (<div key={label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLORS[i] }} /><span className="text-xs text-slate-500">{label}</span></div>))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <TodoCard icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} count={pendingRectification} label="待整改" color="bg-amber-50" to="/hazards?status=整改中" />
          <TodoCard icon={<ClipboardCheck className="h-5 w-5 text-blue-600" />} count={pendingInspection} label="待巡检" color="bg-blue-50" to="/inspections" />
          <TodoCard icon={<Flame className="h-5 w-5 text-orange-600" />} count={pendingDrill} label="待演练" color="bg-orange-50" to="/drills?status=计划中" />
          <TodoCard icon={<Shield className="h-5 w-5 text-purple-600" />} count={pendingRecheck} label="待复查" color="bg-purple-50" to="/hazards?status=待复查" />
          {overdueHazards > 0 && (<TodoCard icon={<AlertTriangle className="h-5 w-5 text-red-600" />} count={overdueHazards} label="已超期" color="bg-red-50" to="/hazards?status=已超期" />)}
          <TodoCard icon={<AlertTriangle className="h-5 w-5 text-slate-600" />} count={hazards.filter(h => h.status === '待分派').length} label="待分派" color="bg-slate-50" to="/hazards?status=待分派" />
        </div>
      </div>

      {(expiringCerts.length > 0 || expiringMaintenance.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <div className="mb-3 flex items-center gap-2"><Clock className="h-5 w-5 text-amber-600" /><h3 className="text-sm font-semibold text-amber-800">到期提醒</h3></div>
          <div className="space-y-2">
            {expiringCerts.map((c) => {
              const facility = facilities.find((f) => f.id === c.facilityId)
              const building = facility ? buildings.find((b) => b.id === facility.buildingId) : null
              const status = calcCertStatus(c.expiryDate)
              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-2 cursor-pointer hover:bg-white/90" onClick={() => navigate('/archives?tab=certificates')}>
                  <div className="flex items-center gap-3"><Award className={`h-4 w-4 ${status === '已过期' ? 'text-red-500' : 'text-amber-500'}`} /><div><p className="text-sm font-medium text-slate-700">{c.name}</p><p className="text-xs text-slate-500">{building?.name ?? '-'} · 到期: {c.expiryDate}</p></div></div>
                  <span className={`status-badge ${status === '已过期' ? 'status-overdue' : 'status-pending'}`}>{status}</span>
                </div>
              )
            })}
            {expiringMaintenance.map((m) => {
              const facility = facilities.find((f) => f.id === m.facilityId)
              const building = facility ? buildings.find((b) => b.id === facility.buildingId) : null
              const status = calcMaintenanceStatus(m.nextDate)
              return (
                <div key={m.id} className="flex items-center justify-between rounded-lg bg-white/70 px-4 py-2 cursor-pointer hover:bg-white/90" onClick={() => navigate('/archives?tab=maintenance')}>
                  <div className="flex items-center gap-3"><Wrench className={`h-4 w-4 ${status === '已过期' ? 'text-red-500' : 'text-amber-500'}`} /><div><p className="text-sm font-medium text-slate-700">{m.content}</p><p className="text-xs text-slate-500">{building?.name ?? '-'} · 下次维保: {m.nextDate}</p></div></div>
                  <span className={`status-badge ${status === '已过期' ? 'status-overdue' : 'status-pending'}`}>{status}</span>
                </div>
              )
            })}
          </div>
          <button onClick={() => navigate('/archives?tab=certificates')} className="mt-3 text-xs font-medium text-amber-700 hover:text-amber-800">查看档案详情 →</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-700">最近告警</h3><Bell className="h-4 w-4 text-slate-400" /></div>
          <div className="space-y-0">
            {recentAlarms.map((alarm) => (
              <div key={alarm.id} className="relative border-l-2 border-slate-100 py-3 pl-6 last:border-transparent">
                <span className="absolute left-[-5px] top-4 h-2.5 w-2.5 rounded-full" style={{ background: alarm.level === '高' ? '#ef4444' : alarm.level === '中' ? '#f59e0b' : '#22c55e' }} />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-700">{buildingMap[alarm.buildingId] ?? alarm.buildingId}</p><p className="truncate text-xs text-slate-500">{alarm.message}</p></div>
                  <div className="flex shrink-0 flex-col items-end gap-1"><span className="text-xs text-slate-400">{alarm.time}</span><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${LEVEL_BADGE[alarm.level]}`}>{alarm.level}</span></div>
                </div>
              </div>
            ))}
            {recentAlarms.length === 0 && (<p className="py-8 text-center text-sm text-slate-400">暂无告警</p>)}
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">快捷操作</h3>
          <div className="space-y-3">
            <QuickAction icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} label="登记隐患" to="/hazards" color="bg-amber-50" />
            <QuickAction icon={<ClipboardCheck className="h-5 w-5 text-blue-600" />} label="开始巡检" to="/inspections" color="bg-blue-50" />
            <QuickAction icon={<Flame className="h-5 w-5 text-orange-600" />} label="安排演练" to="/drills" color="bg-orange-50" />
            <QuickAction icon={<FileDown className="h-5 w-5 text-emerald-600" />} label="导出台账" to="/archives" color="bg-emerald-50" />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-fire-600" />
          <h3 className="text-sm font-semibold text-slate-700">月度闭环看板</h3>
          <span className="ml-auto text-xs text-slate-400">按楼栋汇总</span>
          <button onClick={exportMonthlyReport} className="ml-3 flex items-center gap-1.5 rounded-lg bg-fire-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-fire-700">
            <FileDown className="h-3.5 w-3.5" />导出主管月报
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 text-left w-8"></th>
                <th className="px-4 py-3 text-left"><span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />楼栋</span></th>
                <th className="px-4 py-3 text-center">隐患数</th>
                <th className="px-4 py-3 text-center">关闭率</th>
                <th className="px-4 py-3 text-center">超期</th>
                <th className="px-4 py-3 text-center">演练整改</th>
                <th className="px-4 py-3 text-center">到期项</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBoard.map((row) => (
                <>
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setExpandedBuilding(expandedBuilding === row.id ? null : row.id)}>
                    <td className="px-4 py-3">
                      {expandedBuilding === row.id ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{row.hazardTotal}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${row.closeRate >= 80 ? 'bg-emerald-50 text-emerald-700' : row.closeRate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{row.closeRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.overdue > 0 ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">{row.overdue}</span> : <span className="text-slate-300">0</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${row.issueRate >= 80 ? 'bg-emerald-50 text-emerald-700' : row.issueRate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        {row.issueTotal > 0 ? `${row.issueDone}/${row.issueTotal}` : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.expiringCount > 0 ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{row.expiringCount}</span> : <span className="text-slate-300">0</span>}
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedBuilding === row.id && (
                      <motion.tr key={`${row.id}-detail`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-slate-100 bg-slate-50/50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                              <h4 className="mb-2 text-xs font-semibold text-slate-600">隐患清单</h4>
                              {row.hazards.length > 0 ? (
                                <div className="space-y-1">
                                  {row.hazards.map((h) => (
                                    <div key={h.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                                      <span className="text-slate-700">{h.location} - {h.description.slice(0, 20)}</span>
                                      <span className={`status-badge ${h.status === '已关闭' ? 'status-closed' : h.status === '已超期' ? 'status-overdue' : 'status-progress'}`}>{h.status}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-400">暂无隐患</p>}
                            </div>
                            <div>
                              <h4 className="mb-2 text-xs font-semibold text-slate-600">演练问题</h4>
                              {row.drillIssues.length > 0 ? (
                                <div className="space-y-1">
                                  {row.drillIssues.map((di) => (
                                    <div key={di.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                                      <span className="text-slate-700">{di.text}</span>
                                      <span className={`status-badge ${di.completed ? 'status-closed' : 'status-pending'}`}>{di.completed ? '已完成' : '待整改'}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-400">暂无问题</p>}
                              {row.expiringCerts.length + row.expiringMaint.length > 0 && (
                                <>
                                  <h4 className="mb-2 mt-3 text-xs font-semibold text-slate-600">到期项</h4>
                                  <div className="space-y-1">
                                    {row.expiringCerts.map((c) => (
                                      <div key={c.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                                        <span className="text-slate-700">{c.name}</span>
                                        <span className={`status-badge ${calcCertStatus(c.expiryDate) === '已过期' ? 'status-overdue' : 'status-pending'}`}>{calcCertStatus(c.expiryDate)}</span>
                                      </div>
                                    ))}
                                    {row.expiringMaint.map((m) => (
                                      <div key={m.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                                        <span className="text-slate-700">{m.content}</span>
                                        <span className={`status-badge ${calcMaintenanceStatus(m.nextDate) === '已过期' ? 'status-overdue' : 'status-pending'}`}>{calcMaintenanceStatus(m.nextDate)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-fire-600" />
          <h3 className="text-sm font-semibold text-slate-700">责任人工作台</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personWorkbench.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fire-100 text-sm font-bold text-fire-700">{p.name[0]}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.role} · {p.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><p className="text-lg font-bold text-amber-600">{p.pending}</p><p className="text-[10px] text-slate-500">待办</p></div>
                <div><p className="text-lg font-bold text-red-600">{p.overdue}</p><p className="text-[10px] text-slate-500">超期</p></div>
                <div><p className="text-lg font-bold text-purple-600">{p.recheck}</p><p className="text-[10px] text-slate-500">待复查</p></div>
                <div><p className="text-lg font-bold text-emerald-600">{p.completed}</p><p className="text-[10px] text-slate-500">已完成</p></div>
              </div>
              {(p.pendingHazards.length > 0 || p.overdueHazardsList.length > 0 || p.recheckHazards.length > 0 || p.drillIssues.length > 0) && (
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  {p.overdueHazardsList.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-red-700"><XCircle className="h-3 w-3" />{h.location} - {h.description.slice(0, 15)}</span>
                      <span className="text-red-500">{h.deadline}</span>
                    </div>
                  ))}
                  {p.pendingHazards.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-amber-700"><AlertTriangle className="h-3 w-3" />{h.location} - {h.description.slice(0, 15)}</span>
                      <span className="text-slate-400">{h.deadline || '-'}</span>
                    </div>
                  ))}
                  {p.recheckHazards.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-purple-700"><Shield className="h-3 w-3" />{h.location} - 待复查</span>
                      <span className="text-slate-400">{h.deadline}</span>
                    </div>
                  ))}
                  {p.drillIssues.map((di) => (
                    <div key={di.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-orange-700"><Flame className="h-3 w-3" />{di.text.slice(0, 20)}</span>
                      <span className="text-slate-400">待整改</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
