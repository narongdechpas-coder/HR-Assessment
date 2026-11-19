import type { Employee } from '../data/mock'
import { CYCLE, reportsOf } from '../data/mock'
import { TH_DEPT, TH_LEVEL, TH_TRACK } from '../data/th'
import { gapStatus, profileFor } from '../lib/framework'
import { useStore } from '../store'
import { Avatar, Button, Card, StatusBadge } from '../components/ui'
import { GapChart } from '../components/GapChart'
import { Comments } from './Review'

export function Home({ emp, onStart, onReview }: { emp: Employee; onStart: () => void; onReview: (id: string) => void }) {
  const all = useStore((s) => s.assessments)
  const a = useStore((s) => s.assessments[emp.id])
  const items = profileFor(emp.dept, emp.level, emp.track)
  const team = reportsOf(emp.id)
  const rated = items.filter((i) => (a?.self[i.id]?.level ?? -1) >= 0).length
  const done = a && (a.status === 'submitted' || a.status === 'confirmed')

  const finalOf = (id: string) => a?.review[id]?.level ?? a?.self[id]?.level ?? 0
  const below = done ? items.filter((i) => gapStatus(finalOf(i.id), i.target) === 'below') : []

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
        <div className="text-xs text-ink-3">{CYCLE.name}</div>
        <h1 className="mt-1 text-xl font-semibold">สวัสดี {emp.name.split(' ')[0]}</h1>
        <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-ink-2 sm:grid-cols-2">
          <div>ตำแหน่ง: {emp.title}</div>
          <div>{TH_DEPT[emp.dept]}</div>
          <div>
            Job Level: {emp.level} {TH_LEVEL[emp.level]}
          </div>
          <div>Career Track: {TH_TRACK[emp.track]}</div>
        </div>
        </div>
        <Avatar id={emp.id} name={emp.name} size={88} square className="hidden sm:block" />
        <Avatar id={emp.id} name={emp.name} size={64} square className="sm:hidden" />
        </div>
        <p className="mt-3 text-xs text-ink-3">ข้อมูลตำแหน่งไม่ถูกต้อง? แจ้ง HR ก่อนเริ่มประเมิน เพราะตำแหน่งเป็นตัวกำหนดว่าต้องประเมินข้อไหนและเป้าหมายเท่าไร</p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">แบบประเมินของฉัน</h2>
            <p className="text-sm text-ink-2">
              {items.length} ข้อ · ใช้เวลาประมาณ {Math.round(items.length * 1.5)} นาที
            </p>
          </div>
          {a && <StatusBadge status={a.status} />}
        </div>

        {!done && a?.returnReason && (
          <div className="mt-4 rounded-lg bg-warn-soft p-3 text-sm text-warn-ink">
            <b className="font-medium">หัวหน้าส่งกลับให้แก้:</b> {a.returnReason}
          </div>
        )}
        {!done && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={onStart}>{rated === 0 ? 'เริ่มประเมิน' : `ทำต่อ (ตอบแล้ว ${rated}/${items.length})`}</Button>
            <span className="text-xs text-ink-3">ระบบบันทึกให้อัตโนมัติ ออกกลางคันแล้วกลับมาทำต่อได้</span>
          </div>
        )}

        {done && a && (
          <div className="mt-5">
            <div className="mb-4 grid grid-cols-3 gap-2 text-center">
              <Stat n={below.length} label="ต่ำกว่าเป้า" tone="critical" />
              <Stat n={items.filter((i) => gapStatus(finalOf(i.id), i.target) === 'meet').length} label="ตรงเป้า" />
              <Stat n={items.filter((i) => gapStatus(finalOf(i.id), i.target) === 'above').length} label="สูงกว่าเป้า" />
            </div>
            {a.status === 'submitted' && (
              <p className="mb-4 rounded-lg bg-brand-soft p-3 text-sm text-brand">
                ผลด้านล่างมาจากการประเมินตนเอง ยังรอหัวหน้าทบทวน คะแนนอาจเปลี่ยนหลังหัวหน้ายืนยัน
              </p>
            )}
            <GapChart items={items} self={a.self} review={a.status === 'confirmed' ? a.review : undefined} />
            {a.status === 'confirmed' && <Comments items={items} a={a} />}
          </div>
        )}
      </Card>

      {team.length > 0 && (
        <Card>
          <h2 className="font-semibold">ทีมของฉัน ({team.length} คน)</h2>
          <p className="text-sm text-ink-2">
            รอคุณทบทวน {team.filter((t) => all[t.id]?.status === 'submitted').length} คน
          </p>
          <ul className="mt-3 divide-y divide-line">
            {team.map((t) => {
              const ta = all[t.id]
              const st = ta?.status ?? 'not_started'
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar id={t.id} name={t.name} size={44} />
                    <div className="min-w-0">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-ink-2">
                      {t.title} · {t.level}
                    </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={st} />
                    {st === 'submitted' && <Button onClick={() => onReview(t.id)}>ทบทวน</Button>}
                    {st === 'confirmed' && (
                      <Button variant="outline" onClick={() => onReview(t.id)}>
                        ดูผล
                      </Button>
                    )}
                    {(st === 'not_started' || st === 'draft') && <span className="w-16 text-right text-xs text-ink-3">รอลูกทีมส่ง</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone?: 'critical' }) {
  return (
    <div className="rounded-lg bg-surface-2 py-3">
      <div className={`text-2xl font-semibold ${tone === 'critical' && n > 0 ? 'text-critical' : ''}`}>{n}</div>
      <div className="text-xs text-ink-2">{label}</div>
    </div>
  )
}
