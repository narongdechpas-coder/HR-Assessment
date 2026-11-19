import { describe, expect, it } from 'vitest'
import { profileFor } from './framework'
import { EMPLOYEES, inPilot, seedAssessments } from '../data/mock'
import { TH_COMPETENCY } from '../data/th'
import data from '../data/framework.json'

describe('framework from Excel', () => {
  it('has the same size as the workbook', () => {
    expect(data.competencies).toHaveLength(68)
    const rows = Object.values(data.targets).flatMap((l) => Object.values(l).flatMap((t) => Object.values(t).flatMap((c) => Object.values(c))))
    expect(rows).toHaveLength(3003)
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
    expect(a.E1010.status).toBe('not_started')
    for (const x of Object.values(a)) for (const r of [...Object.values(x.self), ...Object.values(x.review)]) {
      expect(r.level).toBeGreaterThanOrEqual(0)
      expect(r.level).toBeLessThanOrEqual(4)
    }
  })
})
