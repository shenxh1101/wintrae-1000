import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell } from 'recharts'
import {
  AlertTriangle,
  ClipboardCheck,
  Flame,
  FileDown,
  Shield,
  Bell,
  ArrowRight,
} from 'lucide-react'
import { useFireStore } from '@/store'

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
  低: 'bg-emerald-50 text-emerald-700',
  中: 'bg-amber-50 text-amber-700',
  高: 'bg-red-50 text-red-700',
}

interface TodoCardProps {
  icon: React.ReactNode
  count: number
  label: string
  color: string
}

function TodoCard({ icon, count, label, color }: TodoCardProps) {
  return (
    <div className="card-hover rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{count}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

interface QuickActionProps {
  icon: React.ReactNode
  label: string
  to: string
  color: string
}

function QuickAction({ icon, label, to, color }: QuickActionProps) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="card-hover flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <span className="flex-1 text-left text-sm font-medium text-slate-700">{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </button>
  )
}

export default function Overview() {
  const { buildings, hazards, drills, alarms, inspectionRecords } = useFireStore()
  const navigate = useNavigate()

  const buildingMap = useMemo(
    () => Object.fromEntries(buildings.map((b) => [b.id, b.name])),
    [buildings]
  )

  const risk = useMemo(() => getRiskLevel(hazards), [hazards])

  const pendingRectification = hazards.filter((h) => h.status === '整改中').length
  const pendingRecheck = hazards.filter((h) => h.status === '待复查').length
  const pendingDrill = drills.filter((d) => d.status === '计划中').length

  const inspectedBuildingIds = new Set(inspectionRecords.map((r) => r.buildingId))
  const pendingInspection = buildings.filter((b) => !inspectedBuildingIds.has(b.id)).length

  const recentAlarms = useMemo(
    () => [...alarms].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6),
    [alarms]
  )

  const gaugeData = RISK_LABELS.map((name, i) => ({ name, value: risk.counts[i] }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">风险等级</h3>
          <div className="relative flex items-center justify-center">
            <PieChart width={180} height={180}>
              <Pie
                data={gaugeData}
                cx={90}
                cy={90}
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {gaugeData.map((_, i) => (
                  <Cell key={i} fill={RISK_COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold" style={{ color: risk.color }}>
                {risk.level}
              </span>
              <span className="text-xs text-slate-400">综合风险</span>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            {RISK_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_COLORS[i] }} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <TodoCard
            icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
            count={pendingRectification}
            label="待整改"
            color="bg-amber-50"
          />
          <TodoCard
            icon={<ClipboardCheck className="h-5 w-5 text-blue-600" />}
            count={pendingInspection}
            label="待巡检"
            color="bg-blue-50"
          />
          <TodoCard
            icon={<Flame className="h-5 w-5 text-orange-600" />}
            count={pendingDrill}
            label="待演练"
            color="bg-orange-50"
          />
          <TodoCard
            icon={<Shield className="h-5 w-5 text-purple-600" />}
            count={pendingRecheck}
            label="待复查"
            color="bg-purple-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">最近告警</h3>
            <Bell className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-0">
            {recentAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className="relative border-l-2 border-slate-100 py-3 pl-6 last:border-transparent"
              >
                <span
                  className="absolute left-[-5px] top-4 h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      alarm.level === '高'
                        ? '#ef4444'
                        : alarm.level === '中'
                          ? '#f59e0b'
                          : '#22c55e',
                  }}
                />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {buildingMap[alarm.buildingId] ?? alarm.buildingId}
                    </p>
                    <p className="truncate text-xs text-slate-500">{alarm.message}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-slate-400">{alarm.time}</span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${LEVEL_BADGE[alarm.level]}`}
                    >
                      {alarm.level}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentAlarms.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">暂无告警</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">快捷操作</h3>
          <div className="space-y-3">
            <QuickAction
              icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
              label="登记隐患"
              to="/hazards"
              color="bg-amber-50"
            />
            <QuickAction
              icon={<ClipboardCheck className="h-5 w-5 text-blue-600" />}
              label="开始巡检"
              to="/inspections"
              color="bg-blue-50"
            />
            <QuickAction
              icon={<Flame className="h-5 w-5 text-orange-600" />}
              label="安排演练"
              to="/drills"
              color="bg-orange-50"
            />
            <QuickAction
              icon={<FileDown className="h-5 w-5 text-emerald-600" />}
              label="导出台账"
              to="/archives"
              color="bg-emerald-50"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
