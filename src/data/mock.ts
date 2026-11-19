// ข้อมูลสมมติสำหรับ Demo เท่านั้น — ชื่อ ตำแหน่ง และคะแนนทั้งหมดสร้างขึ้นเอง ไม่ใช่พนักงานจริง
import { profileFor, type Track } from '../lib/framework'

export type Role = 'employee' | 'hr'

export type Employee = {
  id: string
  name: string
  title: string
  dept: string
  level: string
  track: Track
  managerId: string | null
  role: Role
}

export type Rating = { level: number; note: string }
export type Status = 'not_started' | 'draft' | 'submitted' | 'confirmed'

export type Assessment = {
  employeeId: string
  status: Status
  self: Record<string, Rating>
  review: Record<string, Rating>
  submittedAt?: string
  confirmedAt?: string
  returnReason?: string // หัวหน้าส่งกลับให้แก้ พร้อมเหตุผล
}

export const CYCLE = { id: '2026-H2', name: 'รอบประเมิน H2/2026 (Pilot)' }

const e = (
  id: string, name: string, title: string, dept: string, level: string, track: Track, managerId: string | null,
): Employee => ({ id, name, title, dept, level, track, managerId, role: 'employee' })

export const EMPLOYEES: Employee[] = [
  // ฝ่ายรับประกันภัย (D01)
  e('E1001', 'ธนพล ศรีวงศ์', 'ผู้อำนวยการฝ่ายรับประกันภัย', 'D01', 'L5', 'Management', null),
  e('E1002', 'กมลชนก วัฒนกุล', 'ผู้จัดการ Non-Motor Underwriting', 'D01', 'L4', 'Management', 'E1001'),
  e('E1003', 'ปิยะพงษ์ เจริญสุข', 'ผู้จัดการอาวุโส Technical Underwriting', 'D01', 'L4', 'Specialist', 'E1001'),
  e('E1004', 'สุภาวดี ทองดี', 'หัวหน้าทีม Property', 'D01', 'L3', 'Management', 'E1002'),
  e('E1005', 'อนุชา แก้วมณี', 'หัวหน้าทีม Marine & Engineering', 'D01', 'L3', 'Management', 'E1002'),
  e('E1006', 'ณัฐธิดา บุญมา', 'Senior Underwriter (Engineering)', 'D01', 'L3', 'Specialist', 'E1003'),
  e('E1007', 'วรวุฒิ พรหมมา', 'Underwriter อาวุโส (Property)', 'D01', 'L2', 'Specialist', 'E1004'),
  e('E1008', 'ศิริพร ใจดี', 'Underwriter อาวุโส (Property)', 'D01', 'L2', 'Specialist', 'E1004'),
  e('E1009', 'ธีรภัทร สมบูรณ์', 'Underwriter อาวุโส (Marine)', 'D01', 'L2', 'Management', 'E1005'),
  e('E1010', 'ชลธิชา นาคสวัสดิ์', 'Underwriter (Property)', 'D01', 'L1', 'Specialist', 'E1004'),
  e('E1011', 'กิตติศักดิ์ มีสุข', 'Underwriter (Marine)', 'D01', 'L1', 'Specialist', 'E1005'),
  e('E1012', 'พิมพ์ชนก รัตนพันธ์', 'Underwriter (Engineering)', 'D01', 'L1', 'Specialist', 'E1005'),
  // ฝ่ายสินไหมทดแทน (D02)
  e('E2001', 'วิชัย อินทรสุวรรณ', 'ผู้อำนวยการฝ่ายสินไหมทดแทน', 'D02', 'L5', 'Management', null),
  e('E2002', 'อรอุมา ศักดิ์ดี', 'ผู้จัดการสินไหมรถยนต์', 'D02', 'L4', 'Management', 'E2001'),
  e('E2003', 'ประเสริฐ ชัยมงคล', 'ผู้จัดการสินไหม Non-Motor', 'D02', 'L4', 'Management', 'E2001'),
  e('E2004', 'จิราพร สุขเจริญ', 'หัวหน้าทีมพิจารณาสินไหมรถยนต์', 'D02', 'L3', 'Management', 'E2002'),
  e('E2005', 'ศุภชัย ทองคำ', 'หัวหน้าทีมสินไหม Property', 'D02', 'L3', 'Management', 'E2003'),
  e('E2006', 'นันทนา พึ่งบุญ', 'ผู้เชี่ยวชาญตรวจสอบการฉ้อฉล', 'D02', 'L3', 'Specialist', 'E2002'),
  e('E2007', 'ภานุวัฒน์ แสงทอง', 'เจ้าหน้าที่สินไหมอาวุโส (Motor)', 'D02', 'L2', 'Specialist', 'E2004'),
  e('E2008', 'สุนิสา วงศ์ใหญ่', 'เจ้าหน้าที่สินไหมอาวุโส (Motor)', 'D02', 'L2', 'Specialist', 'E2004'),
  e('E2009', 'อภิชาติ ดวงแก้ว', 'เจ้าหน้าที่สินไหมอาวุโส (Property)', 'D02', 'L2', 'Specialist', 'E2005'),
  e('E2010', 'ปวีณา ทรัพย์มาก', 'เจ้าหน้าที่สินไหม (Motor)', 'D02', 'L1', 'Specialist', 'E2004'),
  e('E2011', 'ณัฐวุฒิ ศรีสุข', 'เจ้าหน้าที่สินไหม (Motor)', 'D02', 'L1', 'Specialist', 'E2004'),
  e('E2012', 'รัชนี บุญเรือง', 'เจ้าหน้าที่สินไหม (Property)', 'D02', 'L1', 'Specialist', 'E2005'),
  // HR (ไม่อยู่ใน Pilot รอบนี้)
  { ...e('E9001', 'มณีรัตน์ ปัญญาดี', 'HR Business Partner (Learning & Development)', 'D12', 'L3', 'Specialist', null), role: 'hr' },
]

export const byId = (id: string) => EMPLOYEES.find((x) => x.id === id)
export const reportsOf = (id: string) => EMPLOYEES.filter((x) => x.managerId === id)
export const inPilot = (x: Employee) => x.role === 'employee'

// สถานะตั้งต้นของ Demo: เว้นคนสำคัญไว้ให้ลองกดเอง ที่เหลือมีข้อมูลบางส่วนแล้ว
const PRESET: Record<string, Status> = {
  E1010: 'not_started', // ใช้ลองประเมินตนเอง
  E1007: 'submitted', // รอ E1004 ทบทวน
  E1008: 'confirmed',
  E1004: 'not_started',
  E1001: 'not_started',
  E2001: 'not_started',
  E1011: 'confirmed', // ลูกทีมของ E1005 (หัวหน้าที่เห็นด้วยทุกข้อ)
  E1012: 'confirmed',
  E1009: 'submitted',
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (n: number) => Math.max(0, Math.min(4, n))

// จุดอ่อนสมมติขององค์กร (ใส่ไว้ให้ Dashboard มีภาพให้ดู): โอกาสที่ข้อนี้จะต่ำกว่าเป้าเพิ่มอีก 1 ระดับ
const WEAK: Record<string, number> = { CORE06: 0.55, LEAD06: 0.5, UW03: 0.5, CL03: 0.55, CORE04: 0.3, LEAD03: 0.3 }
// หัวหน้าสมมติที่ "เห็นด้วยทุกข้อ" ใช้โชว์ตัวชี้ calibration
const RUBBER_STAMP = new Set(['E1005', 'E2004'])
const NOTE_DOWN = 'ยังต้องมีคนช่วยดูในเคสที่ซับซ้อน ยังทำเองไม่ได้ครบทุกขั้น'

/** สร้างคะแนนสมมติ: คนมักให้ตัวเองเท่าเป้าหรือสูงกว่า หัวหน้ามักปรับลงบางข้อ */
export function seedAssessments(): Record<string, Assessment> {
  const rnd = mulberry32(20261119)
  const out: Record<string, Assessment> = {}
  for (const emp of EMPLOYEES.filter(inPilot)) {
    const r = rnd()
    const status: Status =
      PRESET[emp.id] ?? (r < 0.1 ? 'not_started' : r < 0.2 ? 'draft' : r < 0.4 ? 'submitted' : 'confirmed')
    const a: Assessment = { employeeId: emp.id, status, self: {}, review: {} }
    if (status !== 'not_started') {
      const items = profileFor(emp.dept, emp.level, emp.track)
      const filled = status === 'draft' ? Math.ceil(items.length / 2) : items.length
      for (const it of items.slice(0, filled)) {
        const x = rnd()
        // ความสามารถจริง (สมมติ)
        let real = it.target + (x < 0.5 ? 0 : x < 0.68 ? 1 : x < 0.92 ? -1 : -2)
        if (rnd() < (WEAK[it.id] ?? 0)) real -= 1
        real = clamp(real)
        // คนมักให้ตัวเองสูงกว่าความจริง
        const self = clamp(real + (rnd() < 0.4 ? 1 : 0))
        a.self[it.id] = { level: self, note: '' }
        if (status === 'confirmed') {
          const rv = RUBBER_STAMP.has(emp.managerId ?? '') ? self : real
          a.review[it.id] = { level: rv, note: rv !== self ? NOTE_DOWN : '' }
        }
      }
      if (status === 'submitted' || status === 'confirmed') a.submittedAt = '2026-11-10T09:00:00.000Z'
      if (status === 'confirmed') a.confirmedAt = '2026-11-14T09:00:00.000Z'
    }
    out[emp.id] = a
  }
  return out
}
