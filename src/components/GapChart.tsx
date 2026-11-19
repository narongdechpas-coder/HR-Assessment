import { GROUP_ORDER, gapStatus, type ProfileItem } from '../lib/framework'
import { TH_GROUP } from '../data/th'

type Props = {
  items: ProfileItem[]
  self: Record<string, { level: number }>
  review?: Record<string, { level: number }>
}

const pct = (lv: number) => `${(lv / 4) * 100}%`

/** แถวละ 1 competency: จุด = ระดับที่ประเมิน, เส้นตั้ง = ระดับเป้าหมาย */
export function GapChart({ items, self, review }: Props) {
  const hasReview = !!review && Object.keys(review).length > 0
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-ink-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ background: 'var(--series-self)' }} /> ประเมินตนเอง
        </span>
        {hasReview && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: 'var(--series-review)' }} /> หัวหน้ายืนยัน
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5" style={{ background: 'var(--target)' }} /> ระดับเป้าหมายของตำแหน่ง
        </span>
      </div>

      {GROUP_ORDER.map((g) => {
        const rows = items.filter((i) => i.group === g)
        if (!rows.length) return null
        return (
          <div key={g} className="mb-5">
            <div className="mb-1 grid grid-cols-1 text-xs text-ink-3 sm:grid-cols-[40%_1fr_7rem]">
              <div>{TH_GROUP[g]}</div>
              <div className="hidden justify-between px-0.5 sm:flex">
                {['P0', 'P1', 'P2', 'P3', 'P4'].map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
            </div>
            {rows.map((it) => {
              const s = self[it.id]?.level ?? 0
              const r = review?.[it.id]?.level
              const final = r ?? s
              const st = gapStatus(final, it.target)
              const gap = final - it.target
              return (
                <div key={it.id} className="grid grid-cols-[1fr_7rem] items-center border-t border-line py-2 sm:grid-cols-[40%_1fr_7rem]">
                  <div className="order-1 pr-3 text-sm">
                    {it.name}
                    <div className="text-xs text-ink-3">{it.nameEn}</div>
                  </div>
                  <div
                    className="relative order-3 col-span-2 mt-2 h-5 sm:order-2 sm:col-span-1 sm:mt-0"
                    title={`ประเมินตนเอง P${s}${r !== undefined ? ` · หัวหน้า P${r}` : ''} · เป้า P${it.target}`}
                  >
                    <div className="absolute inset-x-1.5 top-1/2 h-px bg-line" />
                    {[0, 1, 2, 3, 4].map((t) => (
                      <div key={t} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-line" style={{ left: `calc(6px + (100% - 12px) * ${t / 4})` }} />
                    ))}
                    <div
                      className="absolute top-0 h-5 w-0.5 -translate-x-1/2"
                      style={{ left: `calc(6px + (100% - 12px) * ${it.target / 4})`, background: 'var(--target)' }}
                    />
                    <Dot left={pct(s)} color="var(--series-self)" offset={r !== undefined && r !== s ? -4 : 0} />
                    {r !== undefined && <Dot left={pct(r)} color="var(--series-review)" offset={r !== s ? 4 : 0} />}
                  </div>
                  <div className="order-2 pl-3 text-right text-xs sm:order-3">
                    {st === 'below' && <span className="font-medium text-critical">▼ ต่ำกว่าเป้า {-gap}</span>}
                    {st === 'meet' && <span className="text-good">✓ ตรงเป้า</span>}
                    {st === 'above' && <span className="text-good">▲ สูงกว่าเป้า {gap}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function Dot({ left, color, offset }: { left: string; color: string; offset: number }) {
  return (
    <div
      className="absolute size-3 -translate-x-1/2 rounded-full ring-2 ring-[var(--surface)]"
      style={{ left: `calc(6px + (100% - 12px) * ${parseFloat(left) / 100})`, top: `calc(50% - 6px + ${offset}px)`, background: color }}
    />
  )
}
