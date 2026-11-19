import { useState } from 'react'
import type { CategoryStack, CompStack } from '../lib/analytics'
import { TH_GROUP } from '../data/th'

// ลำดับสี (ordinal ramp สีน้ำเงิน): ขาดมาก = เข้ม, ขาดน้อย = อ่อน, ผ่านเป้า = เทาเป็นกลาง
export const SEG = [
  { key: 'below2', label: 'ขาด 2 ระดับขึ้นไป', color: '#1c5cab' },
  { key: 'below1', label: 'ขาด 1 ระดับ', color: '#86b6ef' },
  { key: 'ok', label: 'ตรงหรือสูงกว่าเป้า', color: 'var(--line)' },
] as const

type Counts = { n: number; below1: number; below2: number; ok: number }

export function StackLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
      {SEG.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

/** แท่ง stacked แนวตั้ง 100% — ส่วนที่ขาดเป้าอยู่ล่างสุด ตัวเลขด้านบน = % ต่ำกว่าเป้า */
function Column({
  c, height, label, sub, tip, active, onActive, highlight,
}: {
  c: Counts
  height: number
  label: string
  sub: string
  tip: string[]
  active: boolean
  onActive: (on: boolean) => void
  highlight?: boolean
}) {
  const rate = c.n ? Math.round(((c.below1 + c.below2) / c.n) * 100) : 0
  const segs = (['ok', 'below1', 'below2'] as const).map((k) => ({ k, v: c[k], color: SEG.find((s) => s.key === k)!.color }))
  return (
    <div
      className={`flex w-[76px] flex-none cursor-pointer flex-col items-center rounded-lg pt-1 outline-none sm:w-auto sm:min-w-[64px] sm:flex-1 ${active ? 'bg-surface-2' : ''}`}
      tabIndex={0}
      onMouseEnter={() => onActive(true)}
      onFocus={() => onActive(true)}
      onClick={() => onActive(true)}
      aria-label={tip.join(' · ')}
    >
      <div className={`mb-1 text-sm ${highlight ? 'font-semibold text-ink' : 'text-ink-2'}`}>{rate}%</div>
      <div className="flex w-full max-w-11 flex-col gap-[2px]" style={{ height }}>
        {segs.map((s, i) =>
          s.v > 0 ? (
            <div
              key={s.k}
              style={{ flex: s.v, background: s.color }}
              className={i === segs.findIndex((x) => x.v > 0) ? 'rounded-t' : ''}
            />
          ) : null,
        )}
      </div>
      <div className="mt-1.5 line-clamp-3 h-[42px] w-full px-0.5 text-center text-[11px] leading-[14px] text-ink-2">{label}</div>
      <div className="line-clamp-2 h-[28px] pb-1 text-center text-[11px] leading-[14px] text-ink-3">{sub}</div>
    </div>
  )
}

const tipFor = (name: string, c: Counts, extra: string[] = []) => [
  name,
  `ต่ำกว่าเป้า ${c.below1 + c.below2} จาก ${c.n} (${c.n ? Math.round(((c.below1 + c.below2) / c.n) * 100) : 0}%)`,
  `ขาด 2+ ระดับ ${c.below2} · ขาด 1 ระดับ ${c.below1} · ผ่านเป้า ${c.ok}`,
  ...extra,
]

/** ภาพรวม 3 หมวด: หมวดไหนมี gap มากที่สุด */
export function CategoryOverview({ cats }: { cats: CategoryStack[] }) {
  const [active, setActive] = useState<string | null>(null)
  const top = [...cats].sort((a, b) => b.shareOfGaps - a.shareOfGaps)[0]?.group
  return (
    <div>
    <div className="flex items-end justify-around gap-2">
      {cats.map((c) => (
        <Column
          key={c.group}
          c={c}
          height={150}
          label={TH_GROUP[c.group].split(' — ')[0]}
          sub={`${Math.round(c.shareOfGaps * 100)}% ของ gap ทั้งหมด`}
          tip={tipFor(TH_GROUP[c.group], c, [`คิดเป็น ${Math.round(c.shareOfGaps * 100)}% ของ gap ทั้งหมด`])}
          active={active === c.group}
          onActive={(on) => setActive(on ? c.group : null)}
        />
      ))}
    </div>
    <Detail tip={(() => { const c = cats.find((x) => x.group === active) ?? cats.find((x) => x.group === top)!; return tipFor(TH_GROUP[c.group], c, [`คิดเป็น ${Math.round(c.shareOfGaps * 100)}% ของ gap ทั้งหมด`]) })()} />
    </div>
  )
}

const SHORT_DEPT: Record<string, string> = { D01: 'UW', D02: 'Claims' }

/** แยกรายหัวข้อในหมวด เรียงจากอัตราต่ำกว่าเป้ามากไปน้อย */
export function CompetencyStack({ comps, showDept }: { comps: CompStack[]; showDept?: boolean }) {
  const [active, setActive] = useState<string | null>(null)
  return (
    <div className="overflow-x-auto [contain:inline-size]">
      <div className="flex min-w-max items-end gap-1 sm:min-w-0">
        {comps.map((c, i) => {
          const d = showDept ? c.item.dept : null
          return (
            <Column
              key={c.item.id}
              c={c}
              height={130}
              label={c.item.name}
              sub={`${c.below1 + c.below2}/${c.n} คน${d ? ` · ${SHORT_DEPT[d] ?? d}` : ''}`}
              tip={tipFor(`${c.item.name} (${c.item.nameEn})`, c, c.levels.length ? [`กลุ่มเป้าหมาย ${c.levels.join(', ')}`] : [])}
              active={active === c.item.id}
              onActive={(on) => setActive(on ? c.item.id : null)}
              highlight={i === 0}
            />
          )
        })}
      </div>
      {comps.length > 0 && (
        <Detail
          tip={(() => {
            const c = comps.find((x) => x.item.id === active) ?? comps[0]
            return tipFor(`${c.item.name} (${c.item.nameEn})`, c, c.levels.length ? [`กลุ่มเป้าหมาย ${c.levels.join(', ')}`] : [])
          })()}
        />
      )}
    </div>
  )
}

/** กล่องรายละเอียดใต้กราฟ (แทน tooltip ลอย ใช้บนมือถือได้ง่ายกว่า) */
function Detail({ tip }: { tip: string[] }) {
  return (
    <div className="mt-2 rounded-lg bg-surface-2 p-2.5 text-xs" aria-live="polite">
      <div className="font-medium text-ink">{tip[0]}</div>
      <div className="text-ink-2">{tip.slice(1).join(' · ')}</div>
    </div>
  )
}
