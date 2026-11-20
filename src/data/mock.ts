// ข้อมูลสมมติสำหรับ Demo เท่านั้น — ชื่อ ตำแหน่ง และคะแนนทั้งหมดสร้างขึ้นเอง ไม่ใช่พนักงานจริง
import { profileFor, type Track } from '../lib/framework'

export type Employee = {
  id: string
  name: string
  title: string
  dept: string
  level: string
  track: Track
  managerId: string | null
  hrAdmin?: boolean // เข้า HR Dashboard ได้ (และยังประเมินตัวเองตามปกติ)
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

// โครงสร้างสมมติ: 14 ฝ่าย ฝ่ายละ 5 คน (L5 → L4 → L3 → L2, L1) — รหัส E{ฝ่าย 2 หลัก}{ลำดับ 1–5}
// [ชื่อ, ตำแหน่ง] เรียงจาก L5 ลงไป L1
const ORG: Record<string, { l4Track?: Track; people: [string, string][] }> = {
  D01: { people: [['สมชาย วงศ์สวัสดิ์', 'ผู้อำนวยการฝ่ายรับประกันภัย'], ['กมลชนก วัฒนกุล', 'ผู้จัดการ Non-Motor Underwriting'], ['สุภาวดี ทองดี', 'หัวหน้าทีม Property'], ['วรวุฒิ พรหมมา', 'Underwriter อาวุโส (Property)'], ['ชลธิชา นาคสวัสดิ์', 'Underwriter (Property)']] },
  D02: { people: [['วิชัย อินทรสุวรรณ', 'ผู้อำนวยการฝ่ายสินไหมทดแทน'], ['อรอุมา ศักดิ์ดี', 'ผู้จัดการสินไหมรถยนต์'], ['จิราพร สุขเจริญ', 'หัวหน้าทีมพิจารณาสินไหมรถยนต์'], ['ภานุวัฒน์ แสงทอง', 'เจ้าหน้าที่สินไหมอาวุโส'], ['ปวีณา ทรัพย์มาก', 'เจ้าหน้าที่สินไหม']] },
  D03: { l4Track: 'Specialist', people: [['ธีรวัฒน์ ปัญญาวงศ์', 'ผู้อำนวยการฝ่ายคณิตศาสตร์ประกันภัย'], ['นภัสสร ศรีประเสริฐ', 'นักคณิตศาสตร์ประกันภัยอาวุโส'], ['กฤษดา มั่นคง', 'หัวหน้าทีม Pricing'], ['ศศิธร บุญประเสริฐ', 'Actuarial Analyst อาวุโส'], ['ภูริทัต ใจเย็น', 'Actuarial Analyst']] },
  D04: { people: [['ประเสริฐ ชัยมงคล', 'ผู้อำนวยการฝ่ายขาย'], ['อัญชลี รุ่งเรือง', 'ผู้จัดการช่องทางนายหน้า'], ['ณัฐพล ศรีสุข', 'หัวหน้าทีมขายองค์กร'], ['พรทิพย์ คงสมบูรณ์', 'เจ้าหน้าที่ขายอาวุโส'], ['ธนากร แก้วประเสริฐ', 'เจ้าหน้าที่ขาย']] },
  D05: { people: [['สุนันทา วงศ์ใหญ่', 'ผู้อำนวยการฝ่ายการตลาด'], ['ปิยะนุช ทองมา', 'ผู้จัดการแบรนด์และแคมเปญ'], ['ชยพล อ่อนศรี', 'หัวหน้าทีม Digital Marketing'], ['ณิชา พรหมวงศ์', 'เจ้าหน้าที่การตลาดอาวุโส'], ['กันตพงศ์ สุวรรณรัตน์', 'เจ้าหน้าที่การตลาด']] },
  D06: { people: [['รัชนี บุญเรือง', 'ผู้อำนวยการฝ่ายบริการลูกค้า'], ['สมศักดิ์ ดีงาม', 'ผู้จัดการ Contact Centre'], ['วิไลวรรณ จันทร์หอม', 'หัวหน้าทีมรับเรื่องร้องเรียน'], ['อนันต์ ทองสุข', 'เจ้าหน้าที่บริการลูกค้าอาวุโส'], ['ปาริชาติ มีชัย', 'เจ้าหน้าที่บริการลูกค้า']] },
  D07: { people: [['ประยุทธ แสงอรุณ', 'ผู้อำนวยการฝ่ายประกันภัยต่อ'], ['จันทร์เพ็ญ รัตนวงศ์', 'ผู้จัดการ Treaty'], ['ศักดิ์ชัย บุญมี', 'หัวหน้าทีม Facultative'], ['กชกร เพชรรัตน์', 'เจ้าหน้าที่ประกันภัยต่ออาวุโส'], ['ธนวัฒน์ นิลสุวรรณ', 'เจ้าหน้าที่ประกันภัยต่อ']] },
  D08: { l4Track: 'Specialist', people: [['อนุชา แก้วมณี', 'ผู้อำนวยการฝ่ายบริหารความเสี่ยง'], ['ดวงใจ ศรีทอง', 'ผู้เชี่ยวชาญ ERM อาวุโส'], ['วีรยุทธ เกียรติศักดิ์', 'หัวหน้าทีม Operational Risk'], ['มาลัย สมใจ', 'เจ้าหน้าที่บริหารความเสี่ยงอาวุโส'], ['พงศกร อินทร์แก้ว', 'เจ้าหน้าที่บริหารความเสี่ยง']] },
  D09: { people: [['นันทนา พึ่งบุญ', 'ผู้อำนวยการฝ่ายกำกับดูแลและกฎหมาย'], ['ชาญวิทย์ ประเสริฐสุข', 'ผู้จัดการฝ่ายกฎหมาย'], ['อรทัย วงศ์ทอง', 'หัวหน้าทีม Compliance'], ['สุรชัย พันธ์ดี', 'นิติกรอาวุโส'], ['เบญจมาศ ศรีวิไล', 'เจ้าหน้าที่ Compliance']] },
  D10: { people: [['ศุภชัย ทองคำ', 'ผู้อำนวยการฝ่ายการเงินและบัญชี'], ['วรรณา เจริญผล', 'ผู้จัดการบัญชี'], ['ปิยะพงษ์ เจริญสุข', 'หัวหน้าทีมงบประมาณ'], ['สุดารัตน์ ชื่นใจ', 'นักบัญชีอาวุโส'], ['นิติพงษ์ แสงเงิน', 'นักบัญชี']] },
  D11: { l4Track: 'Specialist', people: [['อภิชาติ ดวงแก้ว', 'ผู้อำนวยการฝ่ายเทคโนโลยี'], ['ณัฐวุฒิ ศรีสุข', 'Enterprise Architect'], ['สิริกร ทองประเสริฐ', 'หัวหน้าทีม Application'], ['ธีรภัทร สมบูรณ์', 'Developer อาวุโส'], ['พิมพ์ชนก รัตนพันธ์', 'Developer']] },
  D12: { people: [['มาลินี ศรีสวัสดิ์', 'ผู้อำนวยการฝ่ายทรัพยากรบุคคล'], ['ศิริพร ใจดี', 'ผู้จัดการ HR Business Partner'], ['มณีรัตน์ ปัญญาดี', 'HR Business Partner (Learning & Development)'], ['กิตติศักดิ์ มีสุข', 'เจ้าหน้าที่ HR อาวุโส'], ['ณัฐธิดา บุญมา', 'เจ้าหน้าที่ HR']] },
  D13: { people: [['ธนพล ศรีวงศ์', 'ผู้อำนวยการฝ่ายปฏิบัติการ'], ['สุมาลี แก้วกาญจนา', 'ผู้จัดการงานกรมธรรม์'], ['เอกชัย พรหมสุวรรณ', 'หัวหน้าทีมประมวลผล'], ['วาสนา ทองเนื้อดี', 'เจ้าหน้าที่ปฏิบัติการอาวุโส'], ['จักรพันธ์ สายทอง', 'เจ้าหน้าที่ปฏิบัติการ']] },
  D14: { people: [['วีรพงษ์ ธนาวุฒิ', 'ผู้อำนวยการฝ่ายวางแผนกลยุทธ์องค์กร'], ['ปรียานุช สุขสวัสดิ์', 'ผู้จัดการฝ่ายวางแผนองค์กร'], ['ศรัณย์ ภักดีวงศ์', 'หัวหน้าทีมวางแผนธุรกิจ'], ['ธิดารัตน์ แสงจันทร์', 'นักวิเคราะห์กลยุทธ์อาวุโส'], ['ภาณุพงศ์ รักษ์ไทย', 'นักวิเคราะห์กลยุทธ์']] },
}
const LEVELS = ['L5', 'L4', 'L3', 'L2', 'L1']
const HR_ADMIN = 'E1203' // มณีรัตน์: HRBP L&D ใช้ HR Dashboard

export const EMPLOYEES: Employee[] = Object.entries(ORG).flatMap(([dept, o]) => {
  const p = 'E' + dept.slice(1)
  return o.people.map(([name, title], i) => {
    const level = LEVELS[i]
    const track: Track = level === 'L5' || level === 'L3' ? 'Management' : level === 'L4' ? (o.l4Track ?? 'Management') : 'Specialist'
    const managerId = i === 0 ? null : i <= 2 ? `${p}0${i}` : `${p}03` // L4→L5, L3→L4, L2/L1→L3
    const id = `${p}0${i + 1}`
    return { id, name, title, dept, level, track, managerId, ...(id === HR_ADMIN ? { hrAdmin: true } : {}) }
  })
})

/** คนที่มีรูป mockup ใน public/avatars (ที่เหลือแสดงอักษรแรกของชื่อ) */
export const PHOTOS = new Set([
  'E0101', 'E0102', 'E0103', 'E0104', 'E0105', 'E0201', 'E0202', 'E0203', 'E0204', 'E0205',
  'E0301', 'E0401', 'E0501', 'E0502', 'E0601', 'E0701', 'E0801', 'E0901', 'E1001', 'E1101', 'E1102',
  'E1201', 'E1202', 'E1203', 'E1204', 'E1205', 'E1301',
])

export const byId = (id: string) => EMPLOYEES.find((x) => x.id === id)
export const reportsOf = (id: string) => EMPLOYEES.filter((x) => x.managerId === id)
export const inPilot = (_x: Employee) => true

// สถานะตั้งต้นของ Demo: เว้นคนสำคัญไว้ให้ลองกดเอง ที่เหลือมีข้อมูลบางส่วนแล้ว
const PRESET: Record<string, Status> = {
  E0105: 'not_started', // ชลธิชา: ใช้ลองประเมินตนเอง
  E0104: 'submitted', // วรวุฒิ: รอสุภาวดี (E0103) ทบทวน
  E0103: 'not_started',
  E0101: 'not_started',
  E0204: 'confirmed', // ลูกทีมของจิราพร (E0203) หัวหน้าที่เห็นด้วยทุกข้อ
  E0205: 'confirmed',
  E0604: 'confirmed', // ลูกทีมของวิไลวรรณ (E0603) หัวหน้าที่เห็นด้วยทุกข้อ
  E0605: 'confirmed',
  E1203: 'not_started',
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
const WEAK: Record<string, number> = {
  CORE06: 0.55, LEAD06: 0.5, CORE04: 0.3, LEAD03: 0.3,
  UW03: 0.5, CL03: 0.55, AP03: 0.45, CS02: 0.45, IT02: 0.5, FA03: 0.35, SD04: 0.4,
}
// หัวหน้าสมมติที่ "เห็นด้วยทุกข้อ" ใช้โชว์ตัวชี้ calibration
const RUBBER_STAMP = new Set(['E0203', 'E0603'])
const NOTE_DOWN = 'ยังต้องมีคนช่วยดูในเคสที่ซับซ้อน ยังทำเองไม่ได้ครบทุกขั้น'

/** สร้างคะแนนสมมติ: คนมักให้ตัวเองเท่าเป้าหรือสูงกว่า หัวหน้ามักปรับลงบางข้อ */
export function seedAssessments(): Record<string, Assessment> {
  const rnd = mulberry32(20261119)
  const out: Record<string, Assessment> = {}
  for (const emp of EMPLOYEES.filter(inPilot)) {
    const r = rnd()
    const status: Status =
      PRESET[emp.id] ?? (r < 0.12 ? 'not_started' : r < 0.22 ? 'draft' : r < 0.4 ? 'submitted' : 'confirmed')
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
