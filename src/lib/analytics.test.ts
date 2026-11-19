import { describe, expect, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { seedAssessments } from '../data/mock'
import { buildRows, calibration, heatmap, pending, priorities, progress } from './analytics'
import { buildXlsx } from './xlsx'

const all = seedAssessments()

describe('HR analytics', () => {
  it('confirmed-only rows use manager ratings; pending toggle adds self ratings', () => {
    const conf = buildRows(all, false)
    const withPending = buildRows(all, true)
    expect(conf.every((r) => r.confirmed && r.review === r.final)).toBe(true)
    expect(withPending.length).toBeGreaterThan(conf.length)
    expect(withPending.filter((r) => !r.confirmed).every((r) => r.final === r.self)).toBe(true)
    for (const r of conf) expect(r.gap).toBe(r.final - r.item.target)
  })

  it('progress counts every pilot employee exactly once', () => {
    const p = progress(all)
    expect(p.reduce((s, d) => s + d.total, 0)).toBe(24)
    for (const d of p) expect(Object.values(d.counts).reduce((a, b) => a + b, 0)).toBe(d.total)
    expect(pending(all).length).toBe(24 - p.reduce((s, d) => s + d.counts.confirmed, 0))
  })

  it('heatmap totals equal the sum of department cells; functional cells only in own dept', () => {
    const rows = buildRows(all, false)
    for (const h of heatmap(rows, ['D01', 'D02'])) {
      const cells = Object.values(h.cells).filter(Boolean)
      expect(cells.reduce((s, c) => s + c!.n, 0)).toBe(h.total.n)
      expect(cells.reduce((s, c) => s + c!.below, 0)).toBe(h.total.below)
      if (h.item.id.startsWith('UW')) expect(h.cells.D02).toBeNull()
    }
  })

  it('priorities are sorted and counts match rows below target', () => {
    const rows = buildRows(all, false)
    const p = priorities(rows)
    for (let i = 1; i < p.length; i++) expect(p[i - 1].below).toBeGreaterThanOrEqual(p[i].below)
    for (const x of p) expect(x.below).toBe(rows.filter((r) => r.item.id === x.item.id && r.gap < 0).length)
  })

  it('flags the rubber-stamp managers seeded in mock data', () => {
    const c = calibration(buildRows(all, false))
    const flagged = c.managers.filter((m) => m.flag).map((m) => m.manager.id).sort()
    expect(flagged).toEqual(['E1005', 'E2004'])
    expect(c.selfMinusReview).toBeGreaterThan(0) // คนให้ตัวเองสูงกว่าหัวหน้า
  })

  it('writes an xlsx file (open it with Excel/openpyxl to verify; set XLSX_OUT)', () => {
    const f = buildXlsx('Assessment', ['ID', 'ชื่อ', 'Gap'], [['E1', 'ทดสอบ <&> "q"', -1], ['E2', null, 0]])
    expect(f[0]).toBe(0x50) // "PK" zip header
    writeFileSync(process.env.XLSX_OUT ?? '/dev/null', f)
  })
})

describe('byCategory', () => {
  it('segments add up, shares sum to 100%, comps sorted by rate', async () => {
    const { byCategory } = await import('./analytics')
    const rows = buildRows(all, false)
    const cats = byCategory(rows)
    expect(cats.map((c) => c.group)).toEqual(['core', 'functional', 'leadership'])
    expect(cats.reduce((s, c) => s + c.shareOfGaps, 0)).toBeCloseTo(1)
    expect(cats.reduce((s, c) => s + c.n, 0)).toBe(rows.length)
    for (const c of cats) {
      expect(c.below1 + c.below2 + c.ok).toBe(c.n)
      for (const x of c.comps) expect(x.below1 + x.below2 + x.ok).toBe(x.n)
      for (let i = 1; i < c.comps.length; i++) expect(c.comps[i - 1].rate).toBeGreaterThanOrEqual(c.comps[i].rate)
    }
  })
})
