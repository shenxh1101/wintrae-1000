export interface Building {
  id: string
  name: string
  floors: number
  area: number
  fireLevel: '一级' | '二级' | '三级' | '四级'
  address: string
  responsiblePersonId: string
}

export interface HazardEvent {
  type: '登记' | '分派' | '提交整改' | '复查通过' | '复查不通过'
  time: string
  description: string
  photos: string[]
  operatorId: string
  deadline?: string
}

export interface Hazard {
  id: string
  buildingId: string
  location: string
  description: string
  level: '一般' | '较大' | '重大' | '特别重大'
  status: '待分派' | '整改中' | '待复查' | '已关闭' | '已超期'
  photos: string[]
  createdAt: string
  deadline: string
  assigneeId: string
  rectification?: Rectification
  rechecks: Recheck[]
  events: HazardEvent[]
}

export interface Rectification {
  assigneeId: string
  deadline: string
  requirement: string
  completedAt?: string
  photos: string[]
  result?: string
}

export interface Recheck {
  id: string
  hazardId: string
  result: '通过' | '不通过'
  opinion: string
  photos: string[]
  createdAt: string
}

export interface Checkpoint {
  id: string
  floor: number
  location: string
  type: '灭火器' | '喷淋' | '通道'
  status: '正常' | '异常' | '缺失'
}

export interface InspectionRoute {
  id: string
  buildingId: string
  checkpoints: Checkpoint[]
}

export interface InspectionRecord {
  id: string
  routeId: string
  buildingId: string
  inspectorId: string
  startTime: string
  endTime: string
  items: InspectionItem[]
}

export interface InspectionItem {
  checkpointId: string
  status: '正常' | '异常' | '缺失'
  photo?: string
  remark?: string
}

export interface DrillIssue {
  id: string
  text: string
  suggestion: string
  assigneeId: string
  completed: boolean
}

export interface Drill {
  id: string
  type: '灭火演练' | '疏散演练' | '综合演练'
  buildingId: string
  scheduledAt: string
  status: '计划中' | '进行中' | '已完成'
  participants: DrillParticipant[]
  scores: DrillScore[]
  issues: DrillIssue[]
}

export interface DrillParticipant {
  id: string
  name: string
  checkedIn: boolean
  checkedInAt?: string
}

export interface DrillScore {
  item: string
  maxScore: number
  actualScore: number
}

export interface FireFacility {
  id: string
  buildingId: string
  type: '灭火器' | '喷淋头' | '烟感报警器' | '消防栓' | '应急灯'
  location: string
  quantity: number
  status: '正常' | '维修中' | '报废'
  lastCheckDate: string
}

export interface MaintenanceRecord {
  id: string
  facilityId: string
  date: string
  content: string
  operator: string
  nextDate: string
}

export interface Certificate {
  id: string
  facilityId: string
  name: string
  issueDate: string
  expiryDate: string
  status: '正常' | '临期' | '已过期'
}

export interface ResponsiblePerson {
  id: string
  name: string
  phone: string
  role: '安全员' | '物业主管'
  buildingIds: string[]
}

export interface AlarmEvent {
  id: string
  buildingId: string
  type: string
  message: string
  time: string
  level: '低' | '中' | '高'
}

export function calcCertStatus(expiryDate: string): Certificate['status'] {
  const diff = new Date(expiryDate).getTime() - Date.now()
  if (diff < 0) return '已过期'
  if (diff < 30 * 86400000) return '临期'
  return '正常'
}

export function calcMaintenanceStatus(nextDate: string): '正常' | '临期' | '已过期' {
  const diff = new Date(nextDate).getTime() - Date.now()
  if (diff < 0) return '已过期'
  if (diff < 30 * 86400000) return '临期'
  return '正常'
}
