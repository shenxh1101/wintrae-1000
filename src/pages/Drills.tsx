import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell } from 'recharts'
import {
  Plus, Calendar, Users, Star, AlertTriangle,
  CheckCircle, Clock, ChevronRight, Flame, ArrowRight, UserCheck,
} from 'lucide-react'
import { useFireStore } from '@/store'
import type { Drill, DrillScore } from '@/types'

const typeBadge: Record<Drill['type'], string> = {
  '灭火演练': 'bg-red-100 text-red-700',
  '疏散演练': 'bg-blue-100 text-blue-700',
  '综合演练': 'bg-purple-100 text-purple-700',
}
const statusClass: Record<Drill['status'], string> = {
  '计划中': 'status-pending',
  '进行中': 'status-progress',
  '已完成': 'status-closed',
}
const statusIcon: Record<Drill['status'], typeof Clock> = {
  '计划中': Clock,
  '进行中': ArrowRight,
  '已完成': CheckCircle,
}
const defaultScores: DrillScore[] = [
  { item: '报警响应', maxScore: 25, actualScore: 0 },
  { item: '灭火操作', maxScore: 25, actualScore: 0 },
  { item: '人员疏散', maxScore: 25, actualScore: 0 },
  { item: '现场指挥', maxScore: 25, actualScore: 0 },
]
const tabs = ['签到', '评分', '问题'] as const

export default function Drills() {
  const { drills, buildings, persons, addDrill, updateDrill, toggleDrillCheckIn, updateDrillScore, addDrillIssue } = useFireStore()
  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('签到')
  const [newIssue, setNewIssue] = useState('')

  const [formType, setFormType] = useState<Drill['type']>('灭火演练')
  const [formBuildingId, setFormBuildingId] = useState(buildings[0]?.id ?? '')
  const [formDate, setFormDate] = useState('')

  const selectedDrill = drills.find((d) => d.id === selectedDrillId) ?? null
  const buildingName = (id: string) => buildings.find((b) => b.id === id)?.name ?? '未知'

  const handleCreate = () => {
    if (!formDate) return
    const drill: Drill = {
      id: crypto.randomUUID(),
      type: formType,
      buildingId: formBuildingId,
      scheduledAt: formDate,
      status: '计划中',
      participants: persons.map((p) => ({ id: p.id, name: p.name, checkedIn: false })),
      scores: defaultScores.map((s) => ({ ...s })),
      issues: [],
    }
    addDrill(drill)
    setShowCreateModal(false)
    setFormDate('')
  }

  const checkedIn = selectedDrill?.participants.filter((p) => p.checkedIn).length ?? 0
  const total = selectedDrill?.participants.length ?? 1
  const pieData = [
    { value: checkedIn },
    { value: total - checkedIn },
  ]
  const totalScore = selectedDrill?.scores.reduce((s, sc) => s + sc.actualScore, 0) ?? 0
  const maxTotal = selectedDrill?.scores.reduce((s, sc) => s + sc.maxScore, 0) ?? 100
  const scorePct = Math.round((totalScore / maxTotal) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">演练管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-fire-600 px-4 py-2 text-sm font-medium text-white hover:bg-fire-700"
        >
          <Plus className="h-4 w-4" /> 新建演练
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {drills.map((drill) => {
          const Icon = statusIcon[drill.status]
          return (
            <motion.div
              key={drill.id}
              layout
              whileHover={{ y: -2 }}
              onClick={() => setSelectedDrillId(drill.id === selectedDrillId ? null : drill.id)}
              className={`cursor-pointer bg-white rounded-xl shadow-sm p-5 card-hover ${
                drill.id === selectedDrillId ? 'ring-2 ring-fire-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`status-badge ${typeBadge[drill.type]}`}>{drill.type}</span>
                <span className={`status-badge ${statusClass[drill.status]}`}>
                  <Icon className="mr-1 h-3 w-3" />{drill.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Flame className="h-4 w-4 text-fire-500" />
                {buildingName(drill.buildingId)}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Calendar className="h-4 w-4" />{drill.scheduledAt}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{drill.participants.length} 人</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {selectedDrill && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-xl shadow-sm"
          >
            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium relative ${
                    activeTab === tab ? 'text-fire-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-fire-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === '签到' && (
                <div className="flex gap-6">
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-32">
                    <PieChart width={100} height={100}>
                      <Pie data={pieData} innerRadius={30} outerRadius={45} dataKey="value" startAngle={90} endAngle={-270}>
                        <Cell fill="#DC2626" />
                        <Cell fill="#F1F5F9" />
                      </Pie>
                    </PieChart>
                    <span className="text-lg font-bold text-slate-800">{checkedIn}/{total}</span>
                    <span className="text-xs text-slate-400">签到率</span>
                  </div>
                  <div className="flex-1 space-y-2 max-h-64 overflow-y-auto">
                    {selectedDrill.participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <UserCheck className={`h-4 w-4 ${p.checkedIn ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <span className="text-sm">{p.name}</span>
                          {p.checkedInAt && <span className="text-xs text-slate-400">{p.checkedInAt}</span>}
                        </div>
                        <button
                          onClick={() => toggleDrillCheckIn(selectedDrill.id, p.id)}
                          className={`rounded-md px-3 py-1 text-xs font-medium ${
                            p.checkedIn ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.checkedIn ? '已签到' : '签到'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === '评分' && (
                <div className="space-y-4">
                  {selectedDrill.scores.map((s, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{s.item}</span>
                        <span className="text-slate-500">{s.actualScore} / {s.maxScore}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={s.maxScore}
                        value={s.actualScore}
                        onChange={(e) => updateDrillScore(selectedDrill.id, i, Number(e.target.value))}
                        className="w-full accent-fire-600"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm font-medium text-slate-700">总分</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-lg font-bold text-fire-600">{totalScore}</span>
                      <span className="text-sm text-slate-400">/ {maxTotal} ({scorePct}%)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === '问题' && (
                <div className="space-y-3">
                  {selectedDrill.issues.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">暂无问题记录</p>
                  )}
                  {selectedDrill.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{issue}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <input
                      value={newIssue}
                      onChange={(e) => setNewIssue(e.target.value)}
                      placeholder="输入问题..."
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-fire-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newIssue.trim()) {
                          addDrillIssue(selectedDrill.id, newIssue.trim())
                          setNewIssue('')
                        }
                      }}
                      className="rounded-lg bg-fire-600 px-4 py-2 text-sm font-medium text-white hover:bg-fire-700"
                    >
                      添加
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedDrill.status === '已完成' && (
              <div className="border-t p-5 bg-slate-50 rounded-b-xl">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">演练总结</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-fire-600">{scorePct}%</p>
                    <p className="text-xs text-slate-400">总评分</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{selectedDrill.issues.length}</p>
                    <p className="text-xs text-slate-400">问题数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{checkedIn}/{total}</p>
                    <p className="text-xs text-slate-400">参与率</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">新建演练</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">演练类型</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Drill['type'])}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-fire-500 focus:outline-none"
                  >
                    <option value="灭火演练">灭火演练</option>
                    <option value="疏散演练">疏散演练</option>
                    <option value="综合演练">综合演练</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">建筑</label>
                  <select
                    value={formBuildingId}
                    onChange={(e) => setFormBuildingId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-fire-500 focus:outline-none"
                  >
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">计划时间</label>
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-fire-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">评分项目</label>
                  <div className="space-y-1">
                    {defaultScores.map((s) => (
                      <div key={s.item} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded px-2 py-1.5">
                        <span>{s.item}</span><span>{s.maxScore}分</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-lg bg-fire-600 px-4 py-2 text-sm font-medium text-white hover:bg-fire-700"
                >
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
