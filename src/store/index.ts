import { create } from 'zustand'
import type {
  Hazard,
  HazardEvent,
  InspectionRecord,
  Drill,
  DrillIssue,
  Building,
  FireFacility,
  MaintenanceRecord,
  Certificate,
  ResponsiblePerson,
  AlarmEvent,
  InspectionRoute,
} from '@/types'
import {
  buildings as mockBuildings,
  hazards as mockHazards,
  inspectionRoutes as mockRoutes,
  inspectionRecords as mockRecords,
  drills as mockDrills,
  facilities as mockFacilities,
  maintenanceRecords as mockMaintenance,
  certificates as mockCertificates,
  persons as mockPersons,
  alarms as mockAlarms,
} from '@/data/mock'

const STORAGE_KEY = 'fire-mgmt-store'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return fallback
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch { /* ignore */ }
}

interface PersistedData {
  buildings: Building[]
  hazards: Hazard[]
  inspectionRoutes: InspectionRoute[]
  inspectionRecords: InspectionRecord[]
  drills: Drill[]
  facilities: FireFacility[]
  maintenanceRecords: MaintenanceRecord[]
  certificates: Certificate[]
  persons: ResponsiblePerson[]
  alarms: AlarmEvent[]
}

const persisted = loadFromStorage<PersistedData>(STORAGE_KEY, {
  buildings: mockBuildings,
  hazards: mockHazards,
  inspectionRoutes: mockRoutes,
  inspectionRecords: mockRecords,
  drills: mockDrills,
  facilities: mockFacilities,
  maintenanceRecords: mockMaintenance,
  certificates: mockCertificates,
  persons: mockPersons,
  alarms: mockAlarms,
})

interface FireStore extends PersistedData {
  addHazard: (hazard: Hazard) => void
  updateHazard: (id: string, updates: Partial<Hazard>) => void
  addInspectionRecord: (record: InspectionRecord) => void
  addDrill: (drill: Drill) => void
  updateDrill: (id: string, updates: Partial<Drill>) => void
  toggleDrillCheckIn: (drillId: string, participantId: string) => void
  updateDrillScore: (drillId: string, itemIndex: number, score: number) => void
  addDrillIssue: (drillId: string, issue: DrillIssue) => void
  updateDrillIssue: (drillId: string, issueId: string, updates: Partial<DrillIssue>) => void
  addBuilding: (building: Building) => void
  updateBuilding: (id: string, updates: Partial<Building>) => void
  addFacility: (facility: FireFacility) => void
  updateFacility: (id: string, updates: Partial<FireFacility>) => void
  addPerson: (person: ResponsiblePerson) => void
  updatePerson: (id: string, updates: Partial<ResponsiblePerson>) => void
  addMaintenance: (record: MaintenanceRecord) => void
  updateMaintenance: (id: string, updates: Partial<MaintenanceRecord>) => void
  addCertificate: (cert: Certificate) => void
  updateCertificate: (id: string, updates: Partial<Certificate>) => void
}

function persist(state: Partial<PersistedData>) {
  const current = loadFromStorage<PersistedData>(STORAGE_KEY, persisted)
  const merged = { ...current, ...state }
  saveToStorage(STORAGE_KEY, merged)
}

export const useFireStore = create<FireStore>((set) => ({
  buildings: persisted.buildings,
  hazards: persisted.hazards,
  inspectionRoutes: persisted.inspectionRoutes,
  inspectionRecords: persisted.inspectionRecords,
  drills: persisted.drills,
  facilities: persisted.facilities,
  maintenanceRecords: persisted.maintenanceRecords,
  certificates: persisted.certificates,
  persons: persisted.persons,
  alarms: persisted.alarms,

  addHazard: (hazard) =>
    set((state) => {
      const hazards = [...state.hazards, hazard]
      persist({ hazards })
      return { hazards }
    }),

  updateHazard: (id, updates) =>
    set((state) => {
      const hazards = state.hazards.map((h) => (h.id === id ? { ...h, ...updates } : h))
      persist({ hazards })
      return { hazards }
    }),

  addInspectionRecord: (record) =>
    set((state) => {
      const inspectionRecords = [...state.inspectionRecords, record]
      persist({ inspectionRecords })
      return { inspectionRecords }
    }),

  addDrill: (drill) =>
    set((state) => {
      const drills = [...state.drills, drill]
      persist({ drills })
      return { drills }
    }),

  updateDrill: (id, updates) =>
    set((state) => {
      const drills = state.drills.map((d) => (d.id === id ? { ...d, ...updates } : d))
      persist({ drills })
      return { drills }
    }),

  toggleDrillCheckIn: (drillId, participantId) =>
    set((state) => {
      const drills = state.drills.map((d) =>
        d.id === drillId
          ? {
              ...d,
              participants: d.participants.map((p) =>
                p.id === participantId
                  ? {
                      ...p,
                      checkedIn: !p.checkedIn,
                      checkedInAt: !p.checkedIn ? new Date().toLocaleString('zh-CN') : undefined,
                    }
                  : p
              ),
            }
          : d
      )
      persist({ drills })
      return { drills }
    }),

  updateDrillScore: (drillId, itemIndex, score) =>
    set((state) => {
      const drills = state.drills.map((d) =>
        d.id === drillId
          ? {
              ...d,
              scores: d.scores.map((s, i) => (i === itemIndex ? { ...s, actualScore: score } : s)),
            }
          : d
      )
      persist({ drills })
      return { drills }
    }),

  addDrillIssue: (drillId, issue) =>
    set((state) => {
      const drills = state.drills.map((d) =>
        d.id === drillId ? { ...d, issues: [...d.issues, issue] } : d
      )
      persist({ drills })
      return { drills }
    }),

  updateDrillIssue: (drillId, issueId, updates) =>
    set((state) => {
      const drills = state.drills.map((d) =>
        d.id === drillId
          ? {
              ...d,
              issues: d.issues.map((issue) =>
                issue.id === issueId ? { ...issue, ...updates } : issue
              ),
            }
          : d
      )
      persist({ drills })
      return { drills }
    }),

  addBuilding: (building) =>
    set((state) => {
      const buildings = [...state.buildings, building]
      persist({ buildings })
      return { buildings }
    }),

  updateBuilding: (id, updates) =>
    set((state) => {
      const buildings = state.buildings.map((b) => (b.id === id ? { ...b, ...updates } : b))
      persist({ buildings })
      return { buildings }
    }),

  addFacility: (facility) =>
    set((state) => {
      const facilities = [...state.facilities, facility]
      persist({ facilities })
      return { facilities }
    }),

  updateFacility: (id, updates) =>
    set((state) => {
      const facilities = state.facilities.map((f) => (f.id === id ? { ...f, ...updates } : f))
      persist({ facilities })
      return { facilities }
    }),

  addPerson: (person) =>
    set((state) => {
      const persons = [...state.persons, person]
      persist({ persons })
      return { persons }
    }),

  updatePerson: (id, updates) =>
    set((state) => {
      const persons = state.persons.map((p) => (p.id === id ? { ...p, ...updates } : p))
      persist({ persons })
      return { persons }
    }),

  addMaintenance: (record) =>
    set((state) => {
      const maintenanceRecords = [...state.maintenanceRecords, record]
      persist({ maintenanceRecords })
      return { maintenanceRecords }
    }),

  updateMaintenance: (id, updates) =>
    set((state) => {
      const maintenanceRecords = state.maintenanceRecords.map((m) => (m.id === id ? { ...m, ...updates } : m))
      persist({ maintenanceRecords })
      return { maintenanceRecords }
    }),

  addCertificate: (cert) =>
    set((state) => {
      const certificates = [...state.certificates, cert]
      persist({ certificates })
      return { certificates }
    }),

  updateCertificate: (id, updates) =>
    set((state) => {
      const certificates = state.certificates.map((c) => (c.id === id ? { ...c, ...updates } : c))
      persist({ certificates })
      return { certificates }
    }),
}))
