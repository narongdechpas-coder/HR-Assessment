import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { seedAssessments, type Assessment } from './data/mock'

// Demo: เก็บข้อมูลทั้งหมดใน localStorage ของ browser เครื่องนั้นเท่านั้น
// ตอนต่อระบบจริง ให้เปลี่ยนเฉพาะไฟล์นี้เป็นการเรียก API

type State = {
  userId: string | null
  assessments: Record<string, Assessment>
  login: (id: string) => void
  logout: () => void
  setSelf: (empId: string, compId: string, patch: { level?: number; note?: string }) => void
  submitSelf: (empId: string) => void
  setReview: (empId: string, compId: string, patch: { level?: number; note?: string }) => void
  confirmReview: (empId: string) => void
  returnToEmployee: (empId: string, reason: string) => void
  resetDemo: () => void
}

const safeStorage = createJSONStorage(() => {
  try {
    const k = '__t'
    localStorage.setItem(k, k)
    localStorage.removeItem(k)
    return localStorage
  } catch {
    const mem = new Map<string, string>()
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
  }
})

export const useStore = create<State>()(
  persist(
    (set) => ({
      userId: null,
      assessments: seedAssessments(),
      login: (id) => set({ userId: id }),
      logout: () => set({ userId: null }),
      setSelf: (empId, compId, patch) =>
        set((s) => {
          const a = s.assessments[empId]
          if (!a || a.status === 'submitted' || a.status === 'confirmed') return s
          const prev = a.self[compId] ?? { level: -1, note: '' }
          return {
            assessments: {
              ...s.assessments,
              [empId]: { ...a, status: 'draft', self: { ...a.self, [compId]: { ...prev, ...patch } } },
            },
          }
        }),
      submitSelf: (empId) =>
        set((s) => {
          const a = s.assessments[empId]
          if (!a || a.status !== 'draft') return s
          return {
            assessments: { ...s.assessments, [empId]: { ...a, status: 'submitted', submittedAt: new Date().toISOString(), returnReason: undefined } },
          }
        }),
      setReview: (empId, compId, patch) =>
        set((s) => {
          const a = s.assessments[empId]
          if (!a || a.status !== 'submitted') return s
          const prev = a.review[compId] ?? { level: -1, note: '' }
          return {
            assessments: { ...s.assessments, [empId]: { ...a, review: { ...a.review, [compId]: { ...prev, ...patch } } } },
          }
        }),
      confirmReview: (empId) =>
        set((s) => {
          const a = s.assessments[empId]
          if (!a || a.status !== 'submitted') return s
          return {
            assessments: { ...s.assessments, [empId]: { ...a, status: 'confirmed', confirmedAt: new Date().toISOString() } },
          }
        }),
      returnToEmployee: (empId, reason) =>
        set((s) => {
          const a = s.assessments[empId]
          if (!a || a.status !== 'submitted') return s
          return {
            assessments: {
              ...s.assessments,
              [empId]: { ...a, status: 'draft', review: {}, submittedAt: undefined, returnReason: reason },
            },
          }
        }),
      resetDemo: () => set({ assessments: seedAssessments(), userId: null }),
    }),
    { name: 'hr-assessment-demo-v2', storage: safeStorage },
  ),
)
