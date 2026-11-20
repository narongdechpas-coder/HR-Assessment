import { Fragment, useMemo, useState } from 'react'
import { CYCLE, byId } from '../data/mock'
import { DEPT_SHORT, TH_DEPT, TH_GROUP, TH_LEVEL, TH_TRACK } from '../data/th'
import { departments } from '../lib/framework'
import { buildRows, byCategory, calibration, functionalByDept, heatmap, pending, progress, RUBBER_STAMP_THRESHOLD, type Cell } from '../lib/analytics'
import { buildXlsx, saveFile } from '../lib/xlsx'
import { useStore } from '../store'
import { Avatar, Button, Card, StatusBadge } from '../components/ui'
import { CategoryOverview, CompetencyStack, FunctionalByDept, StackLegend } from '../components/StackChart'

const DEPTS = Object.keys(TH_DEPT)
const SHORT = DEPT_SHORT
const DEPT_EN = Object.fromEntries(departments.map((d) => [d.id, d.name]))
// รหัสสั้นสำหรับหัวคอลัมน์ heatmap
const CODE: Record<string, string> = {
  D01: 'UW', D02: 'CL', D03: 'ACT', D04: 'SAL', D05: 'MKT', D06: 'CS', D07: 'RI',
  D08: 'RM', D09: 'LC', D10: 'FIN', D11: 'IT', D12: 'HR', D13: 'OPS', D14: 'STR',
}

// สเกลเขียว-เหลือง-ส้ม-แดง ตาม % คนที่ต่ำกว่าเป้า (ช่วงตายตัว ไล่ความเข้มอ่อน→เข้ม เผื่อคนตาบอดสี)
const BANDS = [
  { max: 25, label: 'ต่ำกว่า 25%', bg: '#dff3df', fg: '#0a5c0a' },
  { max: 50, label: '25–49%', bg: '#f2cc55', fg: '#5c4300' },
  { max: 75, label: '50–74%', bg: '#ee9050', fg: '#5a2100' },
  { max: Infinity, label: '75% ขึ้นไป', bg: '#c23434', fg: '#ffffff' },
]
function cellStyle(c: Cell | null) {
  if (!c) return { background: 'transparent', color: 'var(--ink-3)' }
  const b = BANDS.find((x) => (c.below / c.n) * 100 < x.max)!
  return { background: b.bg, color: b.fg }
}
const deptTh = (d: string) => TH_DEPT[d].replace(/^ฝ่าย/, '').replace(/ \(.*\)$/, '')
const pct = (c: Cell) => Math.round((c.below / c.n) * 100)

export function Dashboard() {
  const all = useStore((s) => s.assessments)
  const [includePending, setIncludePending] = useState(false)
  const [exportMsg, setExportMsg] = useState('')

  const rows = useMemo(() => buildRows(all, includePending), [all, includePending])
  const prog = useMemo(() => progress(all), [all])
  const pend = useMemo(() => pending(all), [all])
  const heat = useMemo(() => heatmap(rows, DEPTS), [rows])
  const cats = useMemo(() => byCategory(rows), [rows])
  const fnDept = useMemo(() => functionalByDept(rows), [rows])
  const heatMain = heat.filter((h) => h.item.group !== 'functional')
  const fnCells: Record<string, Cell | null> = Object.fromEntries(
    DEPTS.map((d) => {
      const f = fnDept.find((x) => x.dept === d)
      return [d, f && f.n ? { below: f.below1 + f.below2, n: f.n } : null]
    }),
  )
  const fnTotal = Object.values(fnCells).reduce<Cell>((t, c) => (c ? { below: t.below + c.below, n: t.n + c.n } : t), { below: 0, n: 0 })
  const calib = useMemo(() => calibration(buildRows(all, false)), [all])
  const people = new Set(rows.map((r) => r.emp.id)).size

  async function doExport() {
    const header = [
      'Employee ID', 'Employee Name', 'Department', 'Job Title', 'Job Level', 'Career Track', 'Competency Group',
      'Competency ID', 'Competency Name', 'Target Proficiency', 'Actual Proficiency', 'Gap (Actual-Target)',
      'Evidence / Behaviour Observed', 'Development Action', 'Owner', 'Due Date', 'Status',
      'Self Rating', 'Manager Rating', 'Manager Comment',
    ]
    const GROUP_EN = { core: 'Core', functional: 'Functional', leadership: 'Managerial / Leadership' }
    const data = buildRows(all, true).map((r) => {
      const a = all[r.emp.id]
      return [
        r.emp.id, r.emp.name, DEPT_EN[r.emp.dept] ?? r.emp.dept, r.emp.title, r.emp.level, r.emp.track, GROUP_EN[r.item.group],
        r.item.id, r.item.nameEn, r.item.target, r.final, r.gap,
        r.note, '', r.emp.managerId ? byId(r.emp.managerId)?.name : '', '',
        r.confirmed ? 'Confirmed by manager' : 'Self-assessed (pending manager review)',
        r.self, r.review ?? '', a.review[r.item.id]?.note ?? '',
      ]
    })
    const file = buildXlsx('Assessment', header, data, [11, 22, 14, 30, 9, 12, 22, 12, 34, 10, 10, 10, 40, 30, 22, 12, 34, 10, 10, 40])
    const res = await saveFile(`competency-assessment-${CYCLE.id}.xlsx`, file)
    setExportMsg(res === 'saved' ? `ส่งออก ${data.length} แถวแล้ว` : res === 'declined' ? 'ยกเลิกการบันทึกไฟล์' : 'ส่งออกไม่สำเร็จ')
  }

  const catCard = (g: 'core' | 'functional' | 'leadership') => {
    const c = cats.find((x) => x.group === g)
    if (!c) return null
    return (
        <Card className="h-full">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className="font-semibold">{TH_GROUP[c.group]}</h2>
            <span className="text-sm text-ink-2">
              อัตราต่ำกว่าเป้า {Math.round(c.rate * 100)}% · {Math.round(c.shareOfGaps * 100)}% ของ gap ทั้งหมด
            </span>
          </div>
          <p className="text-xs text-ink-3">เรียงจากอัตราคนต่ำกว่าเป้ามากไปน้อย · แตะหรือชี้ที่แท่งเพื่อดูรายละเอียด</p>
          {c.group === 'functional' ? <FunctionalByDept depts={fnDept} /> : <CompetencyStack comps={c.comps} />}
        </Card>
    )
  }

  const totalEmp = prog.reduce((t, d) => t + d.total, 0)
  const confirmedN = prog.reduce((t, d) => t + d.counts.confirmed, 0)
  const submittedN = prog.reduce((t, d) => t + d.counts.submitted, 0)
  const belowN = rows.filter((r) => r.gap < 0).length
  const flagged = calib.managers.filter((m) => m.flag).length
  const kpis = [
    { label: 'หัวหน้ายืนยันแล้ว', value: `${confirmedN}/${totalEmp}`, sub: `${totalEmp ? Math.round((confirmedN / totalEmp) * 100) : 0}% ของพนักงานทั้งหมด` },
    { label: 'รอหัวหน้าทบทวน', value: `${submittedN} คน`, sub: 'ส่งแล้ว ยังไม่ได้ยืนยัน' },
    { label: 'อัตราต่ำกว่าเป้ารวม', value: `${rows.length ? Math.round((belowN / rows.length) * 100) : 0}%`, sub: `${belowN} จาก ${rows.length} ข้อ-คน`, tone: 'critical' as const },
    { label: 'หัวหน้าที่ควรคุย calibration', value: `${flagged} คน`, sub: `จาก ${calib.managers.length} คนที่ยืนยันผลแล้ว`, tone: flagged ? ('critical' as const) : undefined },
  ]

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-12">
      <div className="lg:col-span-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">HR Dashboard · วางแผน Training</h1>
            <p className="text-sm text-ink-2">
              {CYCLE.name} · ข้อมูลจาก {people} คน {includePending ? '(รวมผลที่ยังรอหัวหน้ายืนยัน)' : '(เฉพาะที่หัวหน้ายืนยันแล้ว)'}
            </p>
            {includePending && (
              <p className="text-xs text-warn-ink">ผลที่ยังไม่ผ่านหัวหน้าใช้คะแนนที่พนักงานให้ตัวเอง ซึ่งมักสูงกว่าจริง gap จะดูเล็กกว่าความเป็นจริง</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-2">
                <input type="checkbox" checked={includePending} onChange={(e) => setIncludePending(e.target.checked)} />
                รวมผลที่ยังรอหัวหน้ายืนยัน
              </label>
              <Button onClick={doExport}>Export Excel</Button>
            </div>
            {exportMsg && <span className="text-xs text-ink-2">{exportMsg}</span>}
          </div>
        </div>

      </div>
      <div className="grid grid-cols-2 gap-4 lg:col-span-12 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="h-full p-4!">
            <div className="text-xs text-ink-2">{k.label}</div>
            <div className={`mt-1 text-2xl font-semibold ${k.tone === 'critical' ? 'text-critical' : ''}`}>{k.value}</div>
            <div className="text-xs text-ink-3">{k.sub}</div>
          </Card>
        ))}
      </div>
      <div className="lg:col-span-6 xl:col-span-4">
      {/* 1. ความคืบหน้า */}
      <Card className="h-full">
        <h2 className="font-semibold">ความคืบหน้าการประเมิน</h2>
        {(() => {
          const segs = [
            { k: 'confirmed', label: 'หัวหน้ายืนยันแล้ว', color: 'var(--brand)' },
            { k: 'submitted', label: 'รอหัวหน้าทบทวน', color: '#86b6ef' },
            { k: 'draft', label: 'กำลังทำ', color: 'var(--warn-ink)' },
            { k: 'not_started', label: 'ยังไม่เริ่ม', color: 'var(--line)' },
          ] as const
          const sum = (k: (typeof segs)[number]['k']) => prog.reduce((t, d) => t + d.counts[k], 0)
          const total = prog.reduce((t, d) => t + d.total, 0)
          return (
            <>
              <p className="mt-1 text-sm text-ink-2">
                หัวหน้ายืนยันแล้ว <b className="font-semibold text-ink">{sum('confirmed')}</b>/{total} คน (
                {Math.round((sum('confirmed') / total) * 100)}%)
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-ink-2">
                {segs.map((sg) => (
                  <span key={sg.k} className="flex items-center gap-1">
                    <span className="inline-block size-2 rounded-full" style={{ background: sg.color }} />
                    {sg.label} {sum(sg.k)}
                  </span>
                ))}
              </div>
              <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-1">
                {prog.map((d) => (
                  <li key={d.dept} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-sm" title={TH_DEPT[d.dept]}>
                    <span className="truncate text-ink-2">{SHORT[d.dept]}</span>
                    <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                      {segs.map((sg) =>
                        d.counts[sg.k] ? (
                          <span key={sg.k} title={`${sg.label} ${d.counts[sg.k]} คน`} style={{ flex: d.counts[sg.k], background: sg.color }} />
                        ) : null,
                      )}
                    </span>
                    <span className="text-right text-xs text-ink-2">
                      {d.counts.confirmed}/{d.total}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )
        })()}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-brand">ดูรายชื่อที่ยังไม่เสร็จ ({pend.length} คน)</summary>
          <ul className="mt-2 divide-y divide-line">
            {pend.map(({ emp, status, manager }) => (
              <li key={emp.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <Avatar id={emp.id} name={emp.name} size={28} />
                  {emp.name}
                  <span className="text-xs text-ink-3">{SHORT[emp.dept]} · {emp.level}</span>
                </span>
                <span className="flex items-center gap-2 text-xs text-ink-2">
                  {status === 'submitted' && manager ? `รอ ${manager.name}` : manager ? `หัวหน้า: ${manager.name}` : ''}
                  <StatusBadge status={status} />
                </span>
              </li>
            ))}
          </ul>
        </details>
      </Card>

      </div>
      <div className="lg:col-span-6 xl:col-span-4">
      {/* 2. Training แยกหมวด */}
      <Card className="h-full">
        <h2 className="font-semibold">Training แยกตามหมวด</h2>
        <p className="text-sm text-ink-2">หมวดไหนมี gap มากที่สุด และในหมวดนั้นเรื่องไหนมีอัตราคนต่ำกว่าเป้าสูงสุด</p>
        {cats.length === 0 ? (
          <p className="mt-4 text-sm text-ink-3">ยังไม่มีข้อมูล</p>
        ) : (
          <>
            <div className="mt-3">
              <StackLegend />
            </div>
            <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_1.4fr] sm:items-end xl:grid-cols-1">
              <CategoryOverview cats={cats} />
              <ul className="space-y-2 text-sm">
                {[...cats]
                  .sort((a, b) => b.shareOfGaps - a.shareOfGaps)
                  .map((c) => (
                    <li key={c.group} className="rounded-lg bg-surface-2 p-3">
                      <div className="font-medium">{TH_GROUP[c.group]}</div>
                      <div className="text-ink-2">
                        {Math.round(c.shareOfGaps * 100)}% ของ gap ทั้งหมด · อัตราต่ำกว่าเป้า {Math.round(c.rate * 100)}%
                      </div>
                      {c.comps[0] && c.comps[0].rate > 0 && (
                        <div className="text-ink-2">
                          สูงสุด: <b className="font-medium text-ink">{c.comps[0].item.name}</b>
                          {c.comps[0].item.dept && ` (${SHORT[c.comps[0].item.dept]})`} {Math.round(c.comps[0].rate * 100)}%
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          </>
        )}
      </Card>

      </div>
      <div className="lg:col-span-12 xl:col-span-4">
      {/* 4. Calibration */}
      <Card className="h-full">
        <h2 className="font-semibold">Calibration หัวหน้า</h2>
        <p className="text-sm text-ink-2">
          จาก {calib.n} ข้อที่หัวหน้ายืนยันแล้ว พนักงานให้คะแนนตัวเอง
          {calib.selfMinusReview >= 0 ? 'สูงกว่า' : 'ต่ำกว่า'}หัวหน้าเฉลี่ย{' '}
          <b className="font-semibold text-ink">{Math.abs(calib.selfMinusReview).toFixed(2)} ระดับ</b>ต่อข้อ
        </p>
        <ul className="mt-3 max-h-[22rem] divide-y divide-line overflow-y-auto pr-1">
          {calib.managers.map((m) => (
            <li key={m.manager.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="flex items-center gap-2 text-sm">
                <Avatar id={m.manager.id} name={m.manager.name} size={32} />
                <span>
                  {m.manager.name}
                  <span className="block text-xs text-ink-3">ยืนยันแล้ว {m.reviewed} คน ({m.items} ข้อ)</span>
                </span>
              </span>
              <span className="flex items-center gap-3 text-sm">
                <span className="text-ink-2">เห็นด้วย {Math.round(m.agreeRate * 100)}%</span>
                <span className="w-24 text-right text-ink-2">ปรับเฉลี่ย {m.avgDiff > 0 ? '+' : ''}{m.avgDiff.toFixed(2)}</span>
                {m.flag ? (
                  <span className="rounded-full bg-critical-soft px-2.5 py-0.5 text-xs font-medium text-critical">⚠ ควรคุย</span>
                ) : (
                  <span className="rounded-full bg-good-soft px-2.5 py-0.5 text-xs font-medium text-good">✓ ปกติ</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-3">
          "ควรคุย" = เห็นด้วยกับลูกทีมตั้งแต่ {Math.round(RUBBER_STAMP_THRESHOLD * 100)}% ของข้อขึ้นไป อาจเป็นการยืนยันผ่านๆ
          ไม่ได้แปลว่าผิดเสมอไป ทีมที่เก่งจริงก็เป็นแบบนี้ได้ HR ควรคุยเพื่อดูหลักฐานประกอบ
        </p>
      </Card>

      </div>
      <div className="lg:col-span-12 xl:col-span-6">{catCard('core')}</div>
      <div className="lg:col-span-12 xl:col-span-6">{catCard('leadership')}</div>
      <div className="lg:col-span-12 xl:col-span-6">{catCard('functional')}</div>
      <div className="lg:col-span-12 xl:col-span-6">
      {/* 3. Heatmap */}
      <Card className="h-full">
        <h2 className="font-semibold">% คนที่ต่ำกว่าเป้า แยกตามฝ่าย</h2>
        <p className="text-sm text-ink-2">เขียว = ส่วนใหญ่ถึงเป้า · แดง = ส่วนใหญ่ต่ำกว่าเป้า · Functional รวม 4 หัวข้อของแต่ละฝ่าย</p>
        <div className="relative mt-3 overflow-x-auto [contain:inline-size]">
          <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0.5 text-sm">
            <thead>
              <tr className="text-xs text-ink-3">
                <th className="sticky left-0 w-40 bg-surface text-left font-normal">Competency</th>
                {DEPTS.map((d) => (
                  <th key={d} className="font-normal" title={TH_DEPT[d]}>{CODE[d]}</th>
                ))}
                <th className="w-12 font-normal">รวม</th>
              </tr>
            </thead>
            <tbody>
              {heatMain.map((h, i) => (
                <Fragment key={h.item.id}>
                  {(i === 0 || heatMain[i - 1].item.group !== h.item.group) && (
                    <tr>
                      <td colSpan={DEPTS.length + 2} className="pt-3 pb-1 text-xs font-medium text-ink-2">
                        {TH_GROUP[h.item.group]}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="sticky left-0 bg-surface py-1 pr-2 text-xs">{h.item.name}</td>
                    {[...DEPTS.map((d) => h.cells[d]), h.total].map((c, j) => (
                      <td
                        key={j}
                        className="rounded text-center text-xs font-medium"
                        style={cellStyle(c)}
                        title={c ? `ต่ำกว่าเป้า ${c.below} จาก ${c.n} คน` : 'ไม่มีคนประเมินข้อนี้'}
                      >
                        {c ? `${pct(c)}%` : '–'}
                        {c && <span className="sr-only"> ({c.below}/{c.n})</span>}
                      </td>
                    ))}
                  </tr>
                  {h.item.group === 'core' && heatMain[i + 1]?.item.group !== 'core' && (
                    <>
                      <tr>
                        <td colSpan={DEPTS.length + 2} className="pt-3 pb-1 text-xs font-medium text-ink-2">
                          {TH_GROUP.functional}
                        </td>
                      </tr>
                      <tr>
                        <td className="sticky left-0 bg-surface py-1 pr-2 text-xs">Functional ของฝ่าย (4 หัวข้อ)</td>
                        {[...DEPTS.map((d) => fnCells[d]), fnTotal.n ? fnTotal : null].map((c, j) => (
                          <td
                            key={j}
                            className="rounded text-center text-xs font-medium"
                            style={cellStyle(c)}
                            title={c ? `ต่ำกว่าเป้า ${c.below} จาก ${c.n} ข้อ-คน` : 'ไม่มีข้อมูล'}
                          >
                            {c ? `${pct(c)}%` : '–'}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-3">
          {DEPTS.map((d) => `${CODE[d]} ${deptTh(d)}`).join(' · ')} · – = ยังไม่มีคนที่หัวหน้ายืนยันผล
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
          <span className="text-ink-3">% คนที่ต่ำกว่าเป้า:</span>
          {BANDS.map((b) => (
            <span key={b.label} className="flex items-center gap-1">
              <span className="inline-block h-3 w-5 rounded-sm" style={{ background: b.bg }} />
              {b.label}
            </span>
          ))}
        </div>
      </Card>

      </div>
      <div className="lg:col-span-12">
      <p className="text-xs text-ink-3">
        ระดับ: {Object.entries(TH_LEVEL).slice(0, 5).map(([k, v]) => `${k} ${v}`).join(' · ')} · Track: {TH_TRACK.Management} / {TH_TRACK.Specialist}
      </p>
      </div>
    </div>
  )
}
