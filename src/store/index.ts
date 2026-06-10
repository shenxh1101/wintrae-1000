import { create } from 'zustand'
import type {
  Hazard,
  InspectionRecord,
  Drill,
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

interface FireStore {
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

  addHazard: (hazard: Hazard) => void
  updateHazard: (id: string, updates: Partial<Hazard>) => void
  addInspectionRecord: (record: InspectionRecord) => void
  addDrill: (drill: Drill) => void
  updateDrill: (id: string, updates: Partial<Drill>) => void
  toggleDrillCheckIn: (drillId: string, participantId: string) => void
  updateDrillScore: (drillId: string, itemIndex: number, score: number) => void
  addDrillIssue: (drillId: string, issue: string) => void
}

export const useFireStore = create<FireStore>((set) => ({
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

  addHazard: (hazard) =>
    set((state) => ({ hazards: [...state.hazards, hazard] })),

  updateHazard: (id, updates) =>
    set((state) => ({
      hazards: state.hazards.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    })),

  addInspectionRecord: (record) =>
    set((state) => ({ inspectionRecords: [...state.inspectionRecords, record] })),

  addDrill: (drill) =>
    set((state) => ({ drills: [...state.drills, drill] })),

  updateDrill: (id, updates) =>
    set((state) => ({
      drills: state.drills.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),

  toggleDrillCheckIn: (drillId, participantId) =>
    set((state) => ({
      drills: state.drills.map((d) =>
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
      ),
    })),

  updateDrillScore: (drillId, itemIndex, score) =>
    set((state) => ({
      drills: state.drills.map((d) =>
        d.id === drillId
          ? {
              ...d,
              scores: d.scores.map((s, i) => (i === itemIndex ? { ...s, actualScore: score } : s)),
            }
          : d
      ),
    })),

  addDrillIssue: (drillId, issue) =>
    set((state) => ({
      drills: state.drills.map((d) =>
        d.id === drillId ? { ...d, issues: [...d.issues, issue] } : d
      ),
    })),
}))
