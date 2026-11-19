// คำนวณตัวเลขสำหรับ HR Dashboard จากผลประเมินทั้งหมด
import { EMPLOYEES, byId, inPilot, type Assessment, type Employee, type Status } from '../data/mock'
import { profileFor, type Group, type ProfileItem } from './framework'

export type Row = {
  emp: Employee
  item: ProfileItem
  self: number
  review?: number
  final: number // คะแนนที่ใช้วางแผน: หัวหน้ายืนยันแล้วใช้ของหัวหน้า ถ้ายังไม่ยืนยันใช้ของพนักงาน
  gap: number // final - target (ติดลบ = ต่ำกว่าเป้า)
  confirmed: boolean
  note: string
}

const pilot = () => EMPLOYEES.filter(inPilot)

/** แถวผลประเมิน 1 แถวต่อ 1 คน × 1 competency (เฉพาะคนที่ส่งแล้ว) */
export function buildRows(all: Record<string, Assessment>, includePending: boolean): Row[] {
  const rows: Row[] = []
  for (const emp of pilot()) {
    const a = all[emp.id]
    if (!a) continue
    const confirmed = a.status === 'confirmed'
    if (!confirmed && !(includePending && a.status === 'submitted')) continue
    for (const item of profileFor(emp.dept, emp.level, emp.track)) {
      const s = a.self[item.id]
      if (!s || s.level < 0) continue
      const review = confirmed ? a.review[item.id]?.level : undefined
      const final = review ?? s.level
      rows.push({ emp, item, self: s.level, review, final, gap: final - item.target, confirmed, note: s.note })
    }
  }
  return rows
}

export type DeptProgress = { dept: string; total: number; counts: Record<Status, number> }
export function progress(all: Record<string, Assessment>): DeptProgress[] {
  const out: Record<string, DeptProgress> = {}
  for (const emp of pilot()) {
    const d = (out[emp.dept] ??= {
      dept: emp.dept,
      total: 0,
      counts: { not_started: 0, draft: 0, submitted: 0, confirmed: 0 },
    })
    d.total++
    d.counts[all[emp.id]?.status ?? 'not_started']++
  }
  return Object.values(out)
}

export function pending(all: Record<string, Assessment>) {
  return pilot()
    .map((emp) => ({ emp, status: all[emp.id]?.status ?? 'not_started', manager: emp.managerId ? byId(emp.managerId) : undefined }))
    .filter((x) => x.status !== 'confirmed')
}

export type Cell = { below: number; n: number }
export type HeatRow = { item: ProfileItem; cells: Record<string, Cell | null>; total: Cell }
/** แถว = competency, คอลัมน์ = ฝ่าย, ค่า = จำนวนคนที่ต่ำกว่าเป้า / จำนวนคนที่ประเมิน */
export function heatmap(rows: Row[], depts: string[]): HeatRow[] {
  const map = new Map<string, HeatRow>()
  for (const r of rows) {
    let h = map.get(r.item.id)
    if (!h) {
      h = { item: r.item, cells: Object.fromEntries(depts.map((d) => [d, null])), total: { below: 0, n: 0 } }
      map.set(r.item.id, h)
    }
    const c = (h.cells[r.emp.dept] ??= { below: 0, n: 0 })
    c.n++
    h.total.n++
    if (r.gap < 0) {
      c.below++
      h.total.below++
    }
  }
  const order = ['core', 'functional', 'leadership']
  return [...map.values()].sort((a, b) => order.indexOf(a.item.group) - order.indexOf(b.item.group) || a.item.id.localeCompare(b.item.id))
}

export type Priority = {
  item: ProfileItem
  below: number
  n: number
  avgShortfall: number // ขาดเฉลี่ยกี่ระดับ (เฉพาะคนที่ต่ำกว่าเป้า)
  levels: string[]
  depts: string[]
  people: Employee[]
}
/** ลำดับ Training: competency ที่มีคนต่ำกว่าเป้ามากที่สุดก่อน แล้วดูว่าขาดมากแค่ไหน */
export function priorities(rows: Row[]): Priority[] {
  const map = new Map<string, Row[]>()
  for (const r of rows) map.set(r.item.id, [...(map.get(r.item.id) ?? []), r])
  return [...map.values()]
    .map((rs) => {
      const low = rs.filter((r) => r.gap < 0)
      return {
        item: rs[0].item,
        below: low.length,
        n: rs.length,
        avgShortfall: low.length ? low.reduce((s, r) => s - r.gap, 0) / low.length : 0,
        levels: [...new Set(low.map((r) => r.emp.level))].sort(),
        depts: [...new Set(low.map((r) => r.emp.dept))].sort(),
        people: low.map((r) => r.emp),
      }
    })
    .filter((p) => p.below > 0)
    .sort((a, b) => b.below - a.below || b.avgShortfall - a.avgShortfall)
}

export type Calib = {
  manager: Employee
  reviewed: number // จำนวนลูกทีมที่ยืนยันแล้ว
  items: number
  agreeRate: number // สัดส่วนข้อที่ให้เท่ากับพนักงาน
  avgDiff: number // หัวหน้า - พนักงาน (ติดลบ = หัวหน้าให้ต่ำกว่า)
  flag: boolean
}
export const RUBBER_STAMP_THRESHOLD = 0.95

/** หัวหน้าแต่ละคนปรับคะแนนลูกทีมมากน้อยแค่ไหน — เห็นด้วยเกือบทุกข้อ = ควรคุย calibration */
export function calibration(rows: Row[]): { managers: Calib[]; selfMinusReview: number; n: number } {
  const confirmed = rows.filter((r) => r.confirmed && r.review !== undefined)
  const byMgr = new Map<string, Row[]>()
  for (const r of confirmed) if (r.emp.managerId) byMgr.set(r.emp.managerId, [...(byMgr.get(r.emp.managerId) ?? []), r])
  const managers = [...byMgr.entries()]
    .map(([id, rs]) => {
      const agree = rs.filter((r) => r.review === r.self).length / rs.length
      return {
        manager: byId(id)!,
        reviewed: new Set(rs.map((r) => r.emp.id)).size,
        items: rs.length,
        agreeRate: agree,
        avgDiff: rs.reduce((s, r) => s + (r.review! - r.self), 0) / rs.length,
        flag: agree >= RUBBER_STAMP_THRESHOLD,
      }
    })
    .sort((a, b) => b.agreeRate - a.agreeRate)
  const selfMinusReview = confirmed.length ? confirmed.reduce((s, r) => s + (r.self - r.review!), 0) / confirmed.length : 0
  return { managers, selfMinusReview, n: confirmed.length }
}

export type CompStack = {
  item: ProfileItem
  n: number
  below1: number // ขาด 1 ระดับ
  below2: number // ขาด 2 ระดับขึ้นไป
  ok: number // ตรงหรือสูงกว่าเป้า
  rate: number // สัดส่วนที่ต่ำกว่าเป้า
  levels: string[]
}
export type CategoryStack = {
  group: Group
  n: number
  below1: number
  below2: number
  ok: number
  rate: number
  shareOfGaps: number // หมวดนี้คิดเป็นกี่ % ของ gap ทั้งหมด
  comps: CompStack[] // เรียงจากอัตราต่ำกว่าเป้ามากไปน้อย
}

/** สรุปแยกหมวด Core / Functional / Leadership และแยกรายหัวข้อในหมวด */
export function byCategory(rows: Row[]): CategoryStack[] {
  const totalBelow = rows.filter((r) => r.gap < 0).length
  const groups: Group[] = ['core', 'functional', 'leadership']
  return groups
    .map((g) => {
      const gr = rows.filter((r) => r.item.group === g)
      const ids = [...new Set(gr.map((r) => r.item.id))]
      const comps = ids
        .map((id) => {
          const rs = gr.filter((r) => r.item.id === id)
          const below1 = rs.filter((r) => r.gap === -1).length
          const below2 = rs.filter((r) => r.gap <= -2).length
          return {
            item: rs[0].item,
            n: rs.length,
            below1,
            below2,
            ok: rs.length - below1 - below2,
            rate: (below1 + below2) / rs.length,
            levels: [...new Set(rs.filter((r) => r.gap < 0).map((r) => r.emp.level))].sort(),
          }
        })
        .sort((a, b) => b.rate - a.rate || b.below2 - a.below2 || b.n - a.n)
      const below1 = comps.reduce((s, c) => s + c.below1, 0)
      const below2 = comps.reduce((s, c) => s + c.below2, 0)
      return {
        group: g,
        n: gr.length,
        below1,
        below2,
        ok: gr.length - below1 - below2,
        rate: gr.length ? (below1 + below2) / gr.length : 0,
        shareOfGaps: totalBelow ? (below1 + below2) / totalBelow : 0,
        comps,
      }
    })
    .filter((c) => c.n > 0)
}
