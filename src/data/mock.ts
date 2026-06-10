import type {
  Building,
  Hazard,
  InspectionRoute,
  InspectionRecord,
  Drill,
  FireFacility,
  MaintenanceRecord,
  Certificate,
  ResponsiblePerson,
  AlarmEvent,
} from '@/types'

export const buildings: Building[] = [
  { id: 'b1', name: 'A栋办公楼', floors: 12, area: 15000, fireLevel: '一级', address: '园区东路1号', responsiblePersonId: 'p1' },
  { id: 'b2', name: 'B栋研发楼', floors: 8, area: 12000, fireLevel: '二级', address: '园区东路2号', responsiblePersonId: 'p2' },
  { id: 'b3', name: 'C栋生产车间', floors: 3, area: 8000, fireLevel: '一级', address: '园区西路1号', responsiblePersonId: 'p1' },
  { id: 'b4', name: 'D栋仓储中心', floors: 2, area: 6000, fireLevel: '三级', address: '园区西路2号', responsiblePersonId: 'p3' },
  { id: 'b5', name: 'E栋综合楼', floors: 6, area: 9000, fireLevel: '二级', address: '园区南路1号', responsiblePersonId: 'p2' },
]

export const persons: ResponsiblePerson[] = [
  { id: 'p1', name: '张伟', phone: '138-0001-0001', role: '安全员', buildingIds: ['b1', 'b3'] },
  { id: 'p2', name: '李明', phone: '138-0001-0002', role: '安全员', buildingIds: ['b2', 'b5'] },
  { id: 'p3', name: '王强', phone: '138-0001-0003', role: '安全员', buildingIds: ['b4'] },
  { id: 'p4', name: '赵红', phone: '138-0001-0004', role: '物业主管', buildingIds: ['b1', 'b2', 'b3', 'b4', 'b5'] },
]

export const hazards: Hazard[] = [
  {
    id: 'h1', buildingId: 'b1', location: '3层东侧走廊', description: '灭火器过期未更换，压力表指针在红区',
    level: '较大', status: '整改中', photos: [], createdAt: '2026-06-08', deadline: '2026-06-15',
    assigneeId: 'p1', rectification: { assigneeId: 'p1', deadline: '2026-06-15', requirement: '更换灭火器并更新台账', photos: [] },
    rechecks: [],
  },
  {
    id: 'h2', buildingId: 'b3', location: '1层生产区出口', description: '安全通道被货物堵塞，影响疏散',
    level: '重大', status: '待复查', photos: [], createdAt: '2026-06-05', deadline: '2026-06-10',
    assigneeId: 'p1',
    rectification: { assigneeId: 'p1', deadline: '2026-06-10', requirement: '清理通道，设置警示标识', completedAt: '2026-06-09', photos: [] },
    rechecks: [],
  },
  {
    id: 'h3', buildingId: 'b2', location: '5层机房', description: '烟感报警器故障，无法正常联动',
    level: '特别重大', status: '已超期', photos: [], createdAt: '2026-05-28', deadline: '2026-06-05',
    assigneeId: 'p2',
    rectification: { assigneeId: 'p2', deadline: '2026-06-05', requirement: '更换烟感报警器并测试联动', photos: [] },
    rechecks: [],
  },
  {
    id: 'h4', buildingId: 'b4', location: '1层仓库A区', description: '消防栓箱门损坏无法正常开启',
    level: '一般', status: '待分派', photos: [], createdAt: '2026-06-09', deadline: '',
    assigneeId: '', rechecks: [],
  },
  {
    id: 'h5', buildingId: 'b5', location: '2层会议室', description: '应急灯不亮，断电后无法提供照明',
    level: '较大', status: '已关闭', photos: [], createdAt: '2026-06-01', deadline: '2026-06-07',
    assigneeId: 'p2',
    rectification: { assigneeId: 'p2', deadline: '2026-06-07', requirement: '更换应急灯电池', completedAt: '2026-06-06', photos: [] },
    rechecks: [{ id: 'r1', hazardId: 'h5', result: '通过', opinion: '应急灯已正常工作', photos: [], createdAt: '2026-06-07' }],
  },
  {
    id: 'h6', buildingId: 'b1', location: '8层西侧楼梯间', description: '防火门闭门器损坏，无法自动关闭',
    level: '较大', status: '整改中', photos: [], createdAt: '2026-06-07', deadline: '2026-06-14',
    assigneeId: 'p1',
    rectification: { assigneeId: 'p1', deadline: '2026-06-14', requirement: '更换闭门器', photos: [] },
    rechecks: [],
  },
]

export const inspectionRoutes: InspectionRoute[] = [
  {
    id: 'ir1', buildingId: 'b1',
    checkpoints: [
      { id: 'cp1', floor: 1, location: '大厅', type: '灭火器', status: '正常' },
      { id: 'cp2', floor: 1, location: '大厅', type: '喷淋', status: '正常' },
      { id: 'cp3', floor: 1, location: '主通道', type: '通道', status: '正常' },
      { id: 'cp4', floor: 3, location: '东侧走廊', type: '灭火器', status: '异常' },
      { id: 'cp5', floor: 3, location: '西侧走廊', type: '喷淋', status: '正常' },
      { id: 'cp6', floor: 5, location: '办公区', type: '灭火器', status: '正常' },
      { id: 'cp7', floor: 5, location: '办公区', type: '通道', status: '正常' },
      { id: 'cp8', floor: 8, location: '楼梯间', type: '灭火器', status: '缺失' },
      { id: 'cp9', floor: 12, location: '顶层设备间', type: '喷淋', status: '正常' },
    ],
  },
  {
    id: 'ir2', buildingId: 'b2',
    checkpoints: [
      { id: 'cp10', floor: 1, location: '大堂', type: '灭火器', status: '正常' },
      { id: 'cp11', floor: 1, location: '大堂', type: '喷淋', status: '正常' },
      { id: 'cp12', floor: 3, location: '实验室', type: '灭火器', status: '正常' },
      { id: 'cp13', floor: 5, location: '机房', type: '喷淋', status: '异常' },
      { id: 'cp14', floor: 5, location: '机房', type: '通道', status: '正常' },
      { id: 'cp15', floor: 8, location: '办公区', type: '灭火器', status: '正常' },
    ],
  },
  {
    id: 'ir3', buildingId: 'b3',
    checkpoints: [
      { id: 'cp16', floor: 1, location: '生产区', type: '灭火器', status: '正常' },
      { id: 'cp17', floor: 1, location: '生产区出口', type: '通道', status: '异常' },
      { id: 'cp18', floor: 1, location: '仓库', type: '喷淋', status: '正常' },
      { id: 'cp19', floor: 2, location: '办公区', type: '灭火器', status: '正常' },
    ],
  },
  {
    id: 'ir4', buildingId: 'b4',
    checkpoints: [
      { id: 'cp20', floor: 1, location: '仓库A区', type: '灭火器', status: '正常' },
      { id: 'cp21', floor: 1, location: '仓库A区', type: '喷淋', status: '正常' },
      { id: 'cp22', floor: 1, location: '仓库B区', type: '通道', status: '正常' },
    ],
  },
  {
    id: 'ir5', buildingId: 'b5',
    checkpoints: [
      { id: 'cp23', floor: 1, location: '大堂', type: '灭火器', status: '正常' },
      { id: 'cp24', floor: 2, location: '会议室', type: '喷淋', status: '正常' },
      { id: 'cp25', floor: 2, location: '会议室', type: '通道', status: '正常' },
      { id: 'cp26', floor: 4, location: '办公区', type: '灭火器', status: '正常' },
      { id: 'cp27', floor: 6, location: '活动室', type: '喷淋', status: '正常' },
    ],
  },
]

export const inspectionRecords: InspectionRecord[] = [
  {
    id: 'rec1', routeId: 'ir1', buildingId: 'b1', inspectorId: 'p1',
    startTime: '2026-06-09 09:00', endTime: '2026-06-09 10:30',
    items: [
      { checkpointId: 'cp1', status: '正常' },
      { checkpointId: 'cp2', status: '正常' },
      { checkpointId: 'cp3', status: '正常' },
      { checkpointId: 'cp4', status: '异常', remark: '灭火器过期' },
      { checkpointId: 'cp5', status: '正常' },
      { checkpointId: 'cp6', status: '正常' },
      { checkpointId: 'cp7', status: '正常' },
      { checkpointId: 'cp8', status: '缺失', remark: '灭火器丢失' },
      { checkpointId: 'cp9', status: '正常' },
    ],
  },
  {
    id: 'rec2', routeId: 'ir3', buildingId: 'b3', inspectorId: 'p1',
    startTime: '2026-06-08 14:00', endTime: '2026-06-08 15:00',
    items: [
      { checkpointId: 'cp16', status: '正常' },
      { checkpointId: 'cp17', status: '异常', remark: '通道堵塞' },
      { checkpointId: 'cp18', status: '正常' },
      { checkpointId: 'cp19', status: '正常' },
    ],
  },
]

export const drills: Drill[] = [
  {
    id: 'd1', type: '灭火演练', buildingId: 'b1', scheduledAt: '2026-06-20 14:00', status: '计划中',
    participants: [
      { id: 'dp1', name: '张伟', checkedIn: false },
      { id: 'dp2', name: '李明', checkedIn: false },
      { id: 'dp3', name: '王强', checkedIn: false },
      { id: 'dp4', name: '赵红', checkedIn: false },
      { id: 'dp5', name: '陈刚', checkedIn: false },
    ],
    scores: [
      { item: '报警响应', maxScore: 20, actualScore: 0 },
      { item: '灭火操作', maxScore: 30, actualScore: 0 },
      { item: '人员疏散', maxScore: 30, actualScore: 0 },
      { item: '现场指挥', maxScore: 20, actualScore: 0 },
    ],
    issues: [],
  },
  {
    id: 'd2', type: '疏散演练', buildingId: 'b3', scheduledAt: '2026-06-05 10:00', status: '已完成',
    participants: [
      { id: 'dp6', name: '张伟', checkedIn: true, checkedInAt: '2026-06-05 09:55' },
      { id: 'dp7', name: '刘洋', checkedIn: true, checkedInAt: '2026-06-05 09:58' },
      { id: 'dp8', name: '孙丽', checkedIn: true, checkedInAt: '2026-06-05 10:00' },
      { id: 'dp9', name: '周磊', checkedIn: false },
    ],
    scores: [
      { item: '报警响应', maxScore: 20, actualScore: 18 },
      { item: '灭火操作', maxScore: 30, actualScore: 25 },
      { item: '人员疏散', maxScore: 30, actualScore: 28 },
      { item: '现场指挥', maxScore: 20, actualScore: 16 },
    ],
    issues: ['3层西侧疏散指示灯不亮', '部分人员未走指定路线'],
  },
  {
    id: 'd3', type: '综合演练', buildingId: 'b2', scheduledAt: '2026-06-12 09:00', status: '进行中',
    participants: [
      { id: 'dp10', name: '李明', checkedIn: true, checkedInAt: '2026-06-12 08:55' },
      { id: 'dp11', name: '王强', checkedIn: true, checkedInAt: '2026-06-12 08:58' },
      { id: 'dp12', name: '赵红', checkedIn: false },
    ],
    scores: [
      { item: '报警响应', maxScore: 20, actualScore: 17 },
      { item: '灭火操作', maxScore: 30, actualScore: 0 },
      { item: '人员疏散', maxScore: 30, actualScore: 0 },
      { item: '现场指挥', maxScore: 20, actualScore: 0 },
    ],
    issues: [],
  },
]

export const facilities: FireFacility[] = [
  { id: 'f1', buildingId: 'b1', type: '灭火器', location: '各楼层走廊', quantity: 48, status: '正常', lastCheckDate: '2026-06-01' },
  { id: 'f2', buildingId: 'b1', type: '喷淋头', location: '全楼覆盖', quantity: 360, status: '正常', lastCheckDate: '2026-05-20' },
  { id: 'f3', buildingId: 'b1', type: '烟感报警器', location: '全楼覆盖', quantity: 240, status: '正常', lastCheckDate: '2026-05-20' },
  { id: 'f4', buildingId: 'b1', type: '消防栓', location: '各楼层', quantity: 24, status: '正常', lastCheckDate: '2026-06-01' },
  { id: 'f5', buildingId: 'b1', type: '应急灯', location: '楼梯间/走廊', quantity: 96, status: '正常', lastCheckDate: '2026-05-15' },
  { id: 'f6', buildingId: 'b2', type: '灭火器', location: '各楼层', quantity: 32, status: '正常', lastCheckDate: '2026-06-01' },
  { id: 'f7', buildingId: 'b2', type: '喷淋头', location: '全楼覆盖', quantity: 240, status: '正常', lastCheckDate: '2026-05-20' },
  { id: 'f8', buildingId: 'b2', type: '烟感报警器', location: '全楼覆盖', quantity: 160, status: '维修中', lastCheckDate: '2026-05-20' },
  { id: 'f9', buildingId: 'b3', type: '灭火器', location: '生产区/仓库', quantity: 36, status: '正常', lastCheckDate: '2026-06-01' },
  { id: 'f10', buildingId: 'b3', type: '消防栓', location: '生产区', quantity: 12, status: '正常', lastCheckDate: '2026-06-01' },
  { id: 'f11', buildingId: 'b4', type: '灭火器', location: '仓库各区域', quantity: 24, status: '正常', lastCheckDate: '2026-05-25' },
  { id: 'f12', buildingId: 'b4', type: '喷淋头', location: '仓库全覆盖', quantity: 180, status: '正常', lastCheckDate: '2026-05-20' },
  { id: 'f13', buildingId: 'b5', type: '灭火器', location: '各楼层', quantity: 24, status: '正常', lastCheckDate: '2026-06-01' },
  { id: 'f14', buildingId: 'b5', type: '应急灯', location: '楼梯间/走廊', quantity: 48, status: '报废', lastCheckDate: '2026-04-10' },
]

export const maintenanceRecords: MaintenanceRecord[] = [
  { id: 'm1', facilityId: 'f8', date: '2026-06-03', content: '更换5层机房故障烟感报警器', operator: '李明', nextDate: '2026-12-03' },
  { id: 'm2', facilityId: 'f1', date: '2026-06-01', content: '3层东侧灭火器更换充装', operator: '张伟', nextDate: '2027-06-01' },
  { id: 'm3', facilityId: 'f4', date: '2026-05-20', content: '全楼消防栓水压测试', operator: '张伟', nextDate: '2026-11-20' },
  { id: 'm4', facilityId: 'f14', date: '2026-04-10', content: '应急灯报废登记，待更换', operator: '李明', nextDate: '2026-05-10' },
  { id: 'm5', facilityId: 'f9', date: '2026-06-01', content: '生产区灭火器年检', operator: '张伟', nextDate: '2027-06-01' },
]

export const certificates: Certificate[] = [
  { id: 'c1', facilityId: 'f1', name: '灭火器检测合格证', issueDate: '2026-01-15', expiryDate: '2027-01-15', status: '正常' },
  { id: 'c2', facilityId: 'f2', name: '喷淋系统检测报告', issueDate: '2025-12-01', expiryDate: '2026-12-01', status: '正常' },
  { id: 'c3', facilityId: 'f4', name: '消防栓检测合格证', issueDate: '2025-11-20', expiryDate: '2026-11-20', status: '正常' },
  { id: 'c4', facilityId: 'f9', name: '灭火器检测合格证', issueDate: '2026-02-01', expiryDate: '2027-02-01', status: '正常' },
  { id: 'c5', facilityId: 'f11', name: '灭火器检测合格证', issueDate: '2025-08-10', expiryDate: '2026-07-10', status: '临期' },
  { id: 'c6', facilityId: 'f12', name: '喷淋系统检测报告', issueDate: '2025-06-01', expiryDate: '2026-06-01', status: '已过期' },
  { id: 'c7', facilityId: 'f13', name: '灭火器检测合格证', issueDate: '2026-03-01', expiryDate: '2027-03-01', status: '正常' },
]

export const alarms: AlarmEvent[] = [
  { id: 'a1', buildingId: 'b2', type: '设备故障', message: '5层机房烟感报警器故障', time: '2026-06-10 08:30', level: '高' },
  { id: 'a2', buildingId: 'b3', type: '通道堵塞', message: '1层生产区出口通道堵塞', time: '2026-06-09 16:20', level: '高' },
  { id: 'a3', buildingId: 'b1', type: '设备过期', message: '3层东侧灭火器过期', time: '2026-06-09 10:15', level: '中' },
  { id: 'a4', buildingId: 'b4', type: '设施损坏', message: '1层仓库A区消防栓箱门损坏', time: '2026-06-09 09:00', level: '低' },
  { id: 'a5', buildingId: 'b1', type: '设备缺失', message: '8层西侧楼梯间灭火器缺失', time: '2026-06-08 15:45', level: '中' },
  { id: 'a6', buildingId: 'b5', type: '证书过期', message: 'D栋仓储中心喷淋系统检测报告过期', time: '2026-06-07 11:00', level: '中' },
  { id: 'a7', buildingId: 'b4', type: '证书临期', message: 'D栋仓储中心灭火器检测合格证即将到期', time: '2026-06-06 09:30', level: '低' },
]
