import { Fragment, useMemo, useState } from 'react'
import { CYCLE, byId } from '../data/mock'
import { TH_DEPT, TH_GROUP, TH_LEVEL, TH_TRACK } from '../data/th'
import { buildRows, calibration, heatmap, pending, priorities, progress, RUBBER_STAMP_THRESHOLD, type Cell } from '../lib/analytics'
import { buildXlsx, saveFile } from '../lib/xlsx'
import { useStore } from '../store'
import { Avatar, Button, Card, StatusBadge } from '../components/ui'

const DEPTS = ['D01', 'D02']
const SHORT: Record<string, string> = { D01: 'Underwriting', D02: 'Claims' }

// sequential ramp (blue) ตามสัดส่วนคนที่ต่ำกว่าเป้า
const RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95']
function cellStyle(c: Cell | null) {
  if (!c) return { background: 'transparent' }
  if (c.below === 0) return { background: 'var(--surface-2)', color: 'var(--ink-3)' }
  const i = Math.min(RAMP.length - 1, Math.floor((c.below / c.n) * RAMP.length))
  return { background: RAMP[i], color: i >= 3 ? '#ffffff' : '#0d366b' }
}
const pct = (c: Cell) => Math.round((c.below / c.n) * 100)

export function Dashboard() {
  const all = useStore((s) => s.assessments)
  const [includePending, setIncludePending] = useState(false)
  const [exportMsg, setExportMsg] = useState('')

  const rows = useMemo(() => buildRows(all, includePending), [all, includePending])
  const prog = useMemo(() => progress(all), [all])
  const pend = useMemo(() => pending(all), [all])
  const heat = useMemo(() => heatmap(rows, DEPTS), [rows])
  const prio = useMemo(() => priorities(rows), [rows])
  const calib = useMemo(() => calibration(buildRows(all, false)), [all])
  const people = new Set(rows.map((r) => r.emp.id)).size
  const maxBelow = Math.max(1, ...prio.map((p) => p.below))

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
        r.emp.id, r.emp.name, SHORT[r.emp.dept] ?? r.emp.dept, r.emp.title, r.emp.level, r.emp.track, GROUP_EN[r.item.group],
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

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">HR Dashboard · วางแผน Training</h1>
          <p className="text-sm text-ink-2">{CYCLE.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={doExport}>Export Excel</Button>
          {exportMsg && <span className="text-xs text-ink-2">{exportMsg}</span>}
        </div>
      </div>

      {/* 1. ความคืบหน้า */}
      <Card>
        <h2 className="font-semibold">ความคืบหน้าการประเมิน</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {prog.map((d) => {
            const segs = [
              { k: 'confirmed', label: 'หัวหน้ายืนยันแล้ว', color: 'var(--brand)' },
              { k: 'submitted', label: 'รอหัวหน้าทบทวน', color: '#86b6ef' },
              { k: 'draft', label: 'กำลังทำ', color: 'var(--warn-ink)' },
              { k: 'not_started', label: 'ยังไม่เริ่ม', color: 'var(--line)' },
            ] as const
            return (
              <div key={d.dept}>
                <div className="flex justify-between text-sm">
                  <span>{TH_DEPT[d.dept]}</span>
                  <span className="text-ink-2">
                    ยืนยันแล้ว {d.counts.confirmed}/{d.total} คน
                  </span>
                </div>
                <div className="mt-1.5 flex h-3 gap-0.5 overflow-hidden rounded-full">
                  {segs.map((s) =>
                    d.counts[s.k] ? (
                      <div key={s.k} title={`${s.label} ${d.counts[s.k]} คน`} style={{ flex: d.counts[s.k], background: s.color }} />
                    ) : null,
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-ink-2">
                  {segs.map((s) => (
                    <span key={s.k} className="flex items-center gap-1">
                      <span className="inline-block size-2 rounded-full" style={{ background: s.color }} />
                      {s.label} {d.counts[s.k]}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
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

      {/* ตัวกรองข้อมูล */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        <span className="text-ink-2">
          ข้อมูลด้านล่างมาจาก {people} คน {includePending ? '(รวมผลที่ยังรอหัวหน้ายืนยัน)' : '(เฉพาะที่หัวหน้ายืนยันแล้ว)'}
        </span>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={includePending} onChange={(e) => setIncludePending(e.target.checked)} />
          รวมผลที่ยังรอหัวหน้ายืนยัน
        </label>
      </div>
      {includePending && (
        <p className="-mt-3 text-xs text-warn-ink">
          ผลที่ยังไม่ผ่านหัวหน้าใช้คะแนนที่พนักงานให้ตัวเอง ซึ่งมักสูงกว่าจริง gap จะดูเล็กกว่าความเป็นจริง
        </p>
      )}

      {/* 2. ลำดับ Training */}
      <Card>
        <h2 className="font-semibold">Training ที่ควรเปิดก่อน</h2>
        <p className="text-sm text-ink-2">เรียงตามจำนวนคนที่ต่ำกว่าเป้า ถ้าเท่ากันดูว่าขาดเฉลี่ยกี่ระดับ</p>
        {prio.length === 0 && <p className="mt-4 text-sm text-ink-3">ยังไม่มีข้อมูล</p>}
        <ol className="mt-4 space-y-3">
          {prio.slice(0, 10).map((p, i) => (
            <li key={p.item.id} className="grid grid-cols-[1.5rem_1fr] gap-x-2">
              <span className="text-sm text-ink-3">{i + 1}.</span>
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-sm font-medium">
                    {p.item.name} <span className="font-normal text-ink-3">{p.item.nameEn}</span>
                  </span>
                  <span className="text-sm">
                    <b className="font-semibold">{p.below}</b>
                    <span className="text-ink-2">/{p.n} คนต่ำกว่าเป้า</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-r bg-surface-2">
                  <div className="h-2 rounded-r" style={{ width: `${(p.below / maxBelow) * 100}%`, background: 'var(--series-self)' }} />
                </div>
                <div className="mt-1 text-xs text-ink-2">
                  ขาดเฉลี่ย {p.avgShortfall.toFixed(1)} ระดับ · {TH_GROUP[p.item.group].split(' — ')[0]} · ฝ่าย{' '}
                  {p.depts.map((d) => SHORT[d]).join(', ')} · กลุ่มเป้าหมาย {p.levels.join(', ')}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* 3. Heatmap */}
      <Card>
        <h2 className="font-semibold">% คนที่ต่ำกว่าเป้า แยกตามฝ่าย</h2>
        <p className="text-sm text-ink-2">สีเข้ม = สัดส่วนคนที่ต่ำกว่าเป้ามาก · ช่องว่าง = competency นี้ไม่ใช้กับฝ่ายนั้น</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full table-fixed border-separate border-spacing-0.5 text-sm">
            <thead>
              <tr className="text-xs text-ink-3">
                <th className="text-left font-normal">Competency</th>
                {DEPTS.map((d) => (
                  <th key={d} className="w-16 font-normal sm:w-24">{SHORT[d]}</th>
                ))}
                <th className="w-14 font-normal sm:w-24">รวม</th>
              </tr>
            </thead>
            <tbody>
              {heat.map((h, i) => (
                <Fragment key={h.item.id}>
                  {(i === 0 || heat[i - 1].item.group !== h.item.group) && (
                    <tr>
                      <td colSpan={DEPTS.length + 2} className="pt-3 pb-1 text-xs font-medium text-ink-2">
                        {TH_GROUP[h.item.group]}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 pr-2 text-xs sm:text-sm">{h.item.name}</td>
                    {[...DEPTS.map((d) => h.cells[d]), h.total].map((c, j) => (
                      <td
                        key={j}
                        className="rounded text-center text-xs font-medium"
                        style={cellStyle(c)}
                        title={c ? `ต่ำกว่าเป้า ${c.below} จาก ${c.n} คน` : 'ไม่ใช้กับฝ่ายนี้'}
                      >
                        {c ? `${pct(c)}%` : ''}
                        {c && <span className="sr-only"> ({c.below}/{c.n})</span>}
                      </td>
                    ))}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs text-ink-3">
          0%
          {RAMP.map((c) => (
            <span key={c} className="inline-block h-2.5 w-6" style={{ background: c }} />
          ))}
          100%
        </div>
      </Card>

      {/* 4. Calibration */}
      <Card>
        <h2 className="font-semibold">Calibration หัวหน้า</h2>
        <p className="text-sm text-ink-2">
          จาก {calib.n} ข้อที่หัวหน้ายืนยันแล้ว พนักงานให้คะแนนตัวเอง
          {calib.selfMinusReview >= 0 ? 'สูงกว่า' : 'ต่ำกว่า'}หัวหน้าเฉลี่ย{' '}
          <b className="font-semibold text-ink">{Math.abs(calib.selfMinusReview).toFixed(2)} ระดับ</b>ต่อข้อ
        </p>
        <ul className="mt-3 divide-y divide-line">
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

      <p className="text-xs text-ink-3">
        ระดับ: {Object.entries(TH_LEVEL).slice(0, 5).map(([k, v]) => `${k} ${v}`).join(' · ')} · Track: {TH_TRACK.Management} / {TH_TRACK.Specialist}
      </p>
    </div>
  )
}
