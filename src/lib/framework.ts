import data from '../data/framework.json'
import { TH_COMPETENCY } from '../data/th'

export type Group = 'core' | 'functional' | 'leadership'
export type Track = 'Management' | 'Specialist'

type RawCompetency = {
  id: string
  group: Group
  name: string
  dept: string | null
  definition: string
  behaviours: string[]
}

export type ProfileItem = {
  id: string
  group: Group
  dept: string | null // ฝ่ายเจ้าของ (เฉพาะ Functional)
  nameEn: string
  name: string
  definition: string
  definitionEn: string
  behaviours: string[] // P1..P4 ภาษาไทย (ถ้ายังไม่แปลจะเป็นอังกฤษ)
  behavioursEn: string[]
  translated: boolean
  target: number // 1..4
}

const competencies = data.competencies as RawCompetency[]
const targets = data.targets as Record<string, Record<string, Record<string, Record<string, number>>>>

export const departments = data.departments
export const GROUP_ORDER: Group[] = ['core', 'functional', 'leadership']

/** Competency ที่ตำแหน่งนี้ต้องประเมิน พร้อมระดับเป้าหมายจาก Master Matrix */
export function profileFor(dept: string, level: string, track: Track): ProfileItem[] {
  const row = targets[dept]?.[level]?.[track] ?? {}
  return competencies
    .filter((c) => row[c.id] !== undefined)
    .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group))
    .map((c) => {
      const th = TH_COMPETENCY[c.id]
      return {
        id: c.id,
        group: c.group,
        dept: c.dept,
        nameEn: c.name,
        name: th?.name ?? c.name,
        definition: th?.definition ?? c.definition,
        definitionEn: c.definition,
        behaviours: th?.behaviours ?? c.behaviours,
        behavioursEn: c.behaviours,
        translated: !!th,
        target: row[c.id],
      }
    })
}

export type GapStatus = 'below' | 'meet' | 'above'
export function gapStatus(actual: number, target: number): GapStatus {
  return actual < target ? 'below' : actual > target ? 'above' : 'meet'
}
