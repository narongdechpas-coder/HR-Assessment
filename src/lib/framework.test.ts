import { describe, expect, it } from 'vitest'
import { profileFor } from './framework'
import { EMPLOYEES, inPilot, seedAssessments } from '../data/mock'
import { TH_COMPETENCY } from '../data/th'
import data from '../data/framework.json'

describe('framework from Excel', () => {
  it('has the same size as the workbook', () => {
    const fromExcel = data.competencies.filter((c) => !('draft' in c))
    expect(fromExcel).toHaveLength(68)
    const rows = Object.values(data.targets).flatMap((l) => Object.values(l).flatMap((t) => Object.values(t).flatMap((c) => Object.values(c))))
    expect(rows).toHaveLength(3003 + 231) // Excel + ฝ่ายวางแผนกลยุทธ์ (ร่าง)
  })

  it('UW L1 Specialist: 8 core + 4 UW + 4 leadership = 16 items, ordered core→functional→leadership', () => {
    const p = profileFor('D01', 'L1', 'Specialist')
    expect(p).toHaveLength(16)
    expect(p.map((x) => x.group)).toEqual([...Array(8).fill('core'), ...Array(4).fill('functional'), ...Array(4).fill('leadership')])
    expect(p.find((x) => x.id === 'UW01')?.target).toBe(2)
    expect(p.some((x) => x.id === 'LEAD01')).toBe(false) // LEAD01 ไม่มีใน L1 Specialist ตาม Matrix
  })

  it('Claims profile does not include Underwriting functional competencies', () => {
    const p = profileFor('D02', 'L3', 'Management')
    expect(p.some((x) => x.id.startsWith('UW'))).toBe(false)
    expect(p.filter((x) => x.id.startsWith('CL'))).toHaveLength(4)
  })

  it('every pilot employee has a non-empty profile, fully translated', () => {
    for (const emp of EMPLOYEES.filter(inPilot)) {
      const p = profileFor(emp.dept, emp.level, emp.track)
      expect(p.length, emp.id).toBeGreaterThanOrEqual(16)
      for (const it of p) expect(TH_COMPETENCY[it.id], it.id).toBeDefined()
    }
  })

  it('mock seed is deterministic and keeps levels in 0..4', () => {
    const a = seedAssessments()
    expect(seedAssessments()).toEqual(a)
    expect(a.E0105.status).toBe('not_started')
    for (const x of Object.values(a)) for (const r of [...Object.values(x.self), ...Object.values(x.review)]) {
      expect(r.level).toBeGreaterThanOrEqual(0)
      expect(r.level).toBeLessThanOrEqual(4)
    }
  })
})

describe('draft department D14 (Corporate Strategy & Planning)', () => {
  it('follows the same target rules as Excel departments', () => {
    for (const lv of ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'])
      for (const tr of ['Management', 'Specialist'] as const) {
        const a = profileFor('D14', lv, tr)
        const b = profileFor('D10', lv, tr)
        expect(a.filter((x) => x.group !== 'functional').map((x) => [x.id, x.target])).toEqual(
          b.filter((x) => x.group !== 'functional').map((x) => [x.id, x.target]),
        )
        expect(a.filter((x) => x.group === 'functional').map((x) => x.target)).toEqual(
          b.filter((x) => x.group === 'functional').map((x) => x.target),
        )
        expect(a.filter((x) => x.group === 'functional').every((x) => x.draft && x.id.startsWith('SP'))).toBe(true)
      }
  })
})

describe('mock organisation', () => {
  it('14 departments × 5 people, L5→L1, reporting lines inside the department', () => {
    const byDept = new Map<string, typeof EMPLOYEES>()
    for (const e of EMPLOYEES) byDept.set(e.dept, [...(byDept.get(e.dept) ?? []), e])
    expect(byDept.size).toBe(14)
    for (const [d, list] of byDept) {
      expect(list.map((e) => e.level), d).toEqual(['L5', 'L4', 'L3', 'L2', 'L1'])
      for (const e of list) if (e.managerId) expect(EMPLOYEES.find((m) => m.id === e.managerId)?.dept).toBe(d)
    }
    expect(EMPLOYEES.filter((e) => e.hrAdmin).map((e) => e.id)).toEqual(['E1203'])
  })

  it('questions differ by department and level', () => {
    const ids = (d: string, l: string, t: 'Management' | 'Specialist') => profileFor(d, l, t).map((x) => x.id)
    expect(ids('D01', 'L1', 'Specialist')).not.toEqual(ids('D02', 'L1', 'Specialist')) // Functional ต่างฝ่าย
    expect(ids('D01', 'L1', 'Specialist').length).toBeLessThan(ids('D01', 'L3', 'Management').length) // Leadership เพิ่มตาม Level
  })
})
