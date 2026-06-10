import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, ChevronRight, Check, X, AlertCircle,
  Play, RotateCcw, MapPin, Flame, Droplets, DoorOpen,
} from 'lucide-react'
import { useFireStore } from '@/store'
import type { InspectionItem } from '@/types'

const typeConfig = {
  灭火器: { icon: Flame, bg: 'bg-red-100', text: 'text-red-600' },
  喷淋: { icon: Droplets, bg: 'bg-blue-100', text: 'text-blue-600' },
  通道: { icon: DoorOpen, bg: 'bg-green-100', text: 'text-green-600' },
}

const statusOptions: Array<'正常' | '异常' | '缺失'> = ['正常', '异常', '缺失']

const statusStyle = {
  正常: 'text-green-600',
  异常: 'text-amber-500',
  缺失: 'text-red-600',
}

const statusIcon = {
  正常: Check,
  异常: AlertCircle,
  缺失: X,
}

export default function Inspections() {
  const { buildings, inspectionRoutes, inspectionRecords, addInspectionRecord } = useFireStore()
  const [selectedBuildingId, setSelectedBuildingId] = useState(buildings[0]?.id ?? '')
  const [inspectionMode, setInspectionMode] = useState(false)
  const [checkpointStatuses, setCheckpointStatuses] = useState<Record<string, '正常' | '异常' | '缺失'>>({})
  const [remarks, setRemarks] = useState<Record<string, string>>({})

  const selectedRoute = inspectionRoutes.find((r) => r.buildingId === selectedBuildingId)
  const buildingRecords = inspectionRecords.filter((r) => r.buildingId === selectedBuildingId)
  const checkpoints = selectedRoute?.checkpoints ?? []
  const completedCount = Object.keys(checkpointStatuses).length
  const allChecked = completedCount === checkpoints.length && checkpoints.length > 0

  const normalCount = Object.values(checkpointStatuses).filter((s) => s === '正常').length
  const abnormalCount = Object.values(checkpointStatuses).filter((s) => s === '异常').length
  const missingCount = Object.values(checkpointStatuses).filter((s) => s === '缺失').length

  const getLastInspectionDate = (buildingId: string) => {
    const recs = inspectionRecords.filter((r) => r.buildingId === buildingId)
    if (!recs.length) return '暂无'
    return recs.sort((a, b) => b.endTime.localeCompare(a.endTime))[0].endTime
  }

  const startInspection = () => {
    setInspectionMode(true)
    setCheckpointStatuses({})
    setRemarks({})
  }

  const resetInspection = () => {
    setInspectionMode(false)
    setCheckpointStatuses({})
    setRemarks({})
  }

  const completeInspection = () => {
    if (!selectedRoute || !allChecked) return
    const items: InspectionItem[] = checkpoints.map((cp) => ({
      checkpointId: cp.id,
      status: checkpointStatuses[cp.id],
      remark: remarks[cp.id] || undefined,
    }))
    const now = new Date().toLocaleString('zh-CN')
    addInspectionRecord({
      id: `rec_${Date.now()}`,
      routeId: selectedRoute.id,
      buildingId: selectedBuildingId,
      inspectorId: 'p1',
      startTime: now,
      endTime: now,
      items,
    })
    resetInspection()
  }

  const toggleStatus = (cpId: string) => {
    const current = checkpointStatuses[cpId]
    if (!current) {
      setCheckpointStatuses((prev) => ({ ...prev, [cpId]: '正常' }))
      return
    }
    const idx = statusOptions.indexOf(current)
    const next = statusOptions[(idx + 1) % statusOptions.length]
    setCheckpointStatuses((prev) => ({ ...prev, [cpId]: next }))
    if (next === '正常') {
      setRemarks((prev) => { const copy = { ...prev }; delete copy[cpId]; return copy })
    }
  }

  return (
    <div className="flex gap-6 h-full">
      <div className="w-72 shrink-0 space-y-3 overflow-y-auto pr-1">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-fire-600" />选择建筑
        </h2>
        {buildings.map((b) => {
          const selected = b.id === selectedBuildingId
          return (
            <motion.div
              key={b.id}
              whileHover={{ x: 4 }}
              onClick={() => { setSelectedBuildingId(b.id); resetInspection() }}
              className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all ${
                selected ? 'border-l-4 border-fire-600 bg-fire-50' : 'border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">{b.name}</span>
                <ChevronRight className={`w-4 h-4 ${selected ? 'text-fire-600' : 'text-slate-400'}`} />
              </div>
              <div className="mt-1 text-sm text-slate-500">{b.floors}层</div>
              <div className="mt-1 text-xs text-slate-400">上次巡检: {getLastInspectionDate(b.id)}</div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-fire-600" />巡检路线
          </h2>
          {!inspectionMode ? (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={startInspection}
              disabled={!selectedRoute}
              className="flex items-center gap-2 px-4 py-2 bg-fire-600 text-white rounded-lg hover:bg-fire-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />开始巡检
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={resetInspection}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
            >
              <RotateCcw className="w-4 h-4" />取消
            </motion.button>
          )}
        </div>

        {inspectionMode && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>巡检进度</span>
              <span>{completedCount} / {checkpoints.length}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-2 rounded-full bg-fire-600"
                initial={{ width: 0 }}
                animate={{ width: `${checkpoints.length ? (completedCount / checkpoints.length) * 100 : 0}%` }}
              />
            </div>
          </motion.div>
        )}

        <div className="relative pl-8">
          {checkpoints.length > 1 && (
            <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-slate-200" />
          )}
          <AnimatePresence>
            {checkpoints.map((cp, i) => {
              const checked = cp.id in checkpointStatuses
              const current = inspectionMode && !checked && (i === 0 || checkpoints[i - 1].id in checkpointStatuses)
              const completed = inspectionMode && checked
              const tc = typeConfig[cp.type]
              const TypeIcon = tc.icon
              const displayStatus = inspectionMode ? checkpointStatuses[cp.id] ?? cp.status : cp.status
              const StatusIcon = statusIcon[displayStatus]

              return (
                <motion.div
                  key={cp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative mb-4 last:mb-0"
                >
                  <div className={`absolute -left-5 top-4 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    completed ? 'bg-green-500 border-green-500' :
                    current ? 'bg-white border-fire-600' :
                    'bg-white border-slate-300'
                  }`}>
                    {completed && <Check className="w-3.5 h-3.5 text-white" />}
                    {current && (
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-fire-600"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                  </div>

                  <div className={`bg-white rounded-xl shadow-sm p-4 ${current ? 'ring-2 ring-fire-200' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tc.bg} ${tc.text}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{cp.floor}F - {cp.location}</div>
                          <div className="text-xs text-slate-500">{cp.type}</div>
                        </div>
                      </div>
                      {inspectionMode ? (
                        <button
                          onClick={() => toggleStatus(cp.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            displayStatus === '正常' ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                            displayStatus === '异常' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' :
                            'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          <StatusIcon className="w-4 h-4" />{displayStatus}
                        </button>
                      ) : (
                        <span className={`flex items-center gap-1 text-sm font-medium ${statusStyle[displayStatus]}`}>
                          <StatusIcon className="w-4 h-4" />{displayStatus}
                        </span>
                      )}
                    </div>
                    {inspectionMode && checkpointStatuses[cp.id] && checkpointStatuses[cp.id] !== '正常' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3">
                        <input
                          type="text"
                          placeholder="添加备注..."
                          value={remarks[cp.id] ?? ''}
                          onChange={(e) => setRemarks((prev) => ({ ...prev, [cp.id]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fire-300"
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {inspectionMode && allChecked && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-800">巡检摘要</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{normalCount}</div>
                <div className="text-sm text-green-700">正常</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-amber-600">{abnormalCount}</div>
                <div className="text-sm text-amber-700">异常</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">{missingCount}</div>
                <div className="text-sm text-red-700">缺失</div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={completeInspection}
              className="w-full py-3 bg-fire-600 text-white rounded-lg font-medium hover:bg-fire-700 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />完成巡检
            </motion.button>
          </motion.div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">巡检记录</h3>
          {buildingRecords.length === 0 ? (
            <div className="text-sm text-slate-400 py-8 text-center">暂无巡检记录</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">巡检时间</th>
                    <th className="px-4 py-3 text-left font-medium">检查项</th>
                    <th className="px-4 py-3 text-left font-medium">正常</th>
                    <th className="px-4 py-3 text-left font-medium">异常</th>
                    <th className="px-4 py-3 text-left font-medium">缺失</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {buildingRecords.map((rec) => {
                    const n = rec.items.filter((it) => it.status === '正常').length
                    const a = rec.items.filter((it) => it.status === '异常').length
                    const m = rec.items.filter((it) => it.status === '缺失').length
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{rec.endTime}</td>
                        <td className="px-4 py-3 text-slate-700">{rec.items.length}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{n}</td>
                        <td className="px-4 py-3 text-amber-600 font-medium">{a}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{m}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
