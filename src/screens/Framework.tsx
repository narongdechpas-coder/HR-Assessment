import { useState } from 'react'
import { TH_DEPT, TH_GROUP, TH_LEVEL, TH_SCALE, TH_TRACK } from '../data/th'
import { GROUP_ORDER, profileFor, type Track } from '../lib/framework'
import { Card } from '../components/ui'

const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']

/** ดูข้อคำถามและระดับเป้าหมายของแต่ละตำแหน่ง (ฝ่าย × Level × Track) ตาม Master Matrix */
export function FrameworkBrowser({ onBack }: { onBack: () => void }) {
  const [dept, setDept] = useState('D01')
  const [level, setLevel] = useState('L1')
  const [track, setTrack] = useState<Track>('Specialist')
  const [open, setOpen] = useState<string | null>(null)
  const items = profileFor(dept, level, track)

  const sel = 'rounded-lg border border-line bg-surface px-3 py-2 text-sm'
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <button onClick={onBack} className="text-sm text-ink-2 hover:text-ink">
        ← กลับ
      </button>
      <div>
        <h1 className="text-xl font-semibold">ข้อคำถามตามตำแหน่ง</h1>
        <p className="text-sm text-ink-2">เลือกฝ่าย Level และ Track เพื่อดูว่าตำแหน่งนั้นต้องประเมินข้อไหน และเป้าหมายระดับไหน</p>
      </div>

      <Card className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-ink-2">ฝ่าย</span>
          <select className={`${sel} w-full`} value={dept} onChange={(e) => setDept(e.target.value)}>
            {Object.entries(TH_DEPT).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-2">Job Level</span>
          <select className={`${sel} w-full`} value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l} {TH_LEVEL[l]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-ink-2">Career Track</span>
          <select className={`${sel} w-full`} value={track} onChange={(e) => setTrack(e.target.value as Track)}>
            {(['Specialist', 'Management'] as const).map((t) => (
              <option key={t} value={t}>{TH_TRACK[t]}</option>
            ))}
          </select>
        </label>
      </Card>

      <p className="text-sm text-ink-2">
        ตำแหน่งนี้ประเมิน <b className="font-medium text-ink">{items.length} ข้อ</b> ·{' '}
        {GROUP_ORDER.map((g) => `${TH_GROUP[g].split(' — ')[0]} ${items.filter((i) => i.group === g).length}`).join(' · ')}
      </p>

      {GROUP_ORDER.map((g) => {
        const rows = items.filter((i) => i.group === g)
        if (!rows.length) return null
        return (
          <Card key={g} className="p-0">
            <h2 className="border-b border-line px-5 py-3 text-sm font-medium">{TH_GROUP[g]}</h2>
            <ul className="divide-y divide-line">
              {rows.map((it) => (
                <li key={it.id}>
                  <button
                    onClick={() => setOpen(open === it.id ? null : it.id)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-surface-2"
                    aria-expanded={open === it.id}
                  >
                    <span>
                      <span className="text-sm">{it.name}</span>
                      <span className="block text-xs text-ink-3">{it.id} · {it.nameEn}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">
                      เป้า P{it.target} {TH_SCALE[it.target].label}
                    </span>
                  </button>
                  {open === it.id && (
                    <div className="space-y-1.5 px-5 pb-4 text-sm">
                      <p className="text-ink-2">{it.definition}</p>
                      {it.behaviours.map((b, i) => (
                        <div
                          key={i}
                          className={`rounded-lg p-2 ${i + 1 === it.target ? 'bg-brand-soft' : 'bg-surface-2'}`}
                        >
                          <b className="font-medium">P{i + 1} {TH_SCALE[i + 1].label}</b>
                          {i + 1 === it.target && <span className="text-xs text-brand"> · ระดับเป้าหมาย</span>}
                          <div className="text-ink-2">{b}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </div>
  )
}
