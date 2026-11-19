import { useState } from 'react'
import type { Employee } from '../data/mock'
import { TH_DEPT, TH_GROUP, TH_LEVEL, TH_SCALE, TH_TRACK } from '../data/th'
import { GROUP_ORDER, profileFor, type ProfileItem } from '../lib/framework'
import { useStore } from '../store'
import { Avatar, Button, Card, StatusBadge } from '../components/ui'
import { GapChart } from '../components/GapChart'

const behaviourOf = (it: ProfileItem, lv: number) => (lv === 0 ? TH_SCALE[0].hint : it.behaviours[lv - 1])

/** หัวหน้าทบทวนคะแนนของลูกทีม — ไม่เติมคะแนนพนักงานไว้ให้ก่อน หัวหน้าต้องเลือกเองทุกข้อ */
export function ReviewScreen({ emp, onBack }: { emp: Employee; onBack: () => void }) {
  const items = profileFor(emp.dept, emp.level, emp.track)
  const a = useStore((s) => s.assessments[emp.id])
  const setReview = useStore((s) => s.setReview)
  const confirmReview = useStore((s) => s.confirmReview)
  const returnToEmployee = useStore((s) => s.returnToEmployee)
  const [mode, setMode] = useState<'none' | 'confirm' | 'return'>('none')
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)

  if (!a) return null
  const readOnly = a.status !== 'submitted'

  const lvOf = (id: string) => a.review[id]?.level ?? -1
  const notReviewed = items.filter((i) => lvOf(i.id) < 0)
  const needNote = items.filter((i) => lvOf(i.id) >= 0 && lvOf(i.id) !== a.self[i.id]?.level && !a.review[i.id]?.note.trim())
  const changed = items.filter((i) => lvOf(i.id) >= 0 && lvOf(i.id) !== a.self[i.id]?.level)
  const ready = notReviewed.length === 0 && needNote.length === 0

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <button onClick={onBack} className="text-sm text-ink-2 hover:text-ink">
        ← กลับไปหน้าทีมของฉัน
      </button>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-ink-3">ทบทวนผลประเมินของ</div>
            <h1 className="text-xl font-semibold">{emp.name}</h1>
            <div className="mt-1 text-sm text-ink-2">
              {emp.title} · {TH_DEPT[emp.dept]}
            </div>
            <div className="text-sm text-ink-2">
              {emp.level} {TH_LEVEL[emp.level]} · {TH_TRACK[emp.track]}
            </div>
            <div className="mt-2">
              <StatusBadge status={a.status} />
            </div>
          </div>
          <Avatar id={emp.id} name={emp.name} size={120} square className="hidden sm:block" />
          <Avatar id={emp.id} name={emp.name} size={72} square className="sm:hidden" />
        </div>
      </Card>

      {readOnly ? (
        <Card>
          <h2 className="mb-4 font-semibold">ผลหลังทบทวน</h2>
          <GapChart items={items} self={a.self} review={a.review} />
          <Comments items={items} a={a} />
        </Card>
      ) : (
        <>
          <div className="rounded-xl bg-brand-soft p-4 text-sm text-brand">
            เลือกระดับที่คุณเห็นจริงจากการทำงานของลูกทีม ถ้าตรงกับที่ลูกทีมประเมินตัวเอง กด "เห็นด้วย" ได้เลย
            ถ้าให้ระดับต่างจากลูกทีม ต้องเขียนเหตุผลประกอบ เพื่อให้ลูกทีมรู้ว่าต้องพัฒนาตรงไหน
          </div>

          {GROUP_ORDER.map((g) => {
            const rows = items.filter((i) => i.group === g)
            if (!rows.length) return null
            return (
              <section key={g}>
                <h2 className="mb-2 text-sm font-medium text-ink-2">{TH_GROUP[g]}</h2>
                <div className="space-y-3">
                  {rows.map((it) => {
                    const self = a.self[it.id]
                    const lv = lvOf(it.id)
                    const differs = lv >= 0 && lv !== self?.level
                    const missingNote = differs && !a.review[it.id]?.note.trim()
                    const flag = tried && (lv < 0 || missingNote)
                    return (
                      <Card key={it.id} className={flag ? '!border-critical' : ''}>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-ink-3">{it.nameEn}</div>

                        <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm">
                          <div>
                            <span className="text-ink-3">ลูกทีมประเมินตัวเอง: </span>
                            <b className="font-medium">
                              P{self?.level} {TH_SCALE[self?.level ?? 0].label}
                            </b>
                          </div>
                          <div className="text-ink-2">{behaviourOf(it, self?.level ?? 0)}</div>
                          {self?.note && <div className="mt-1 text-ink-2">ตัวอย่างงาน: “{self.note}”</div>}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-sm text-ink-2">คุณให้:</span>
                          {TH_SCALE.map((sc, i) => (
                            <button
                              key={sc.code}
                              aria-pressed={lv === i}
                              onClick={() => setReview(emp.id, it.id, { level: i })}
                              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                                lv === i ? 'border-brand bg-brand text-on-brand' : 'border-line hover:border-ink-3'
                              }`}
                            >
                              {sc.code}
                            </button>
                          ))}
                          <button
                            onClick={() => setReview(emp.id, it.id, { level: self?.level ?? 0 })}
                            className="ml-auto rounded-lg px-3 py-1.5 text-sm text-brand hover:bg-brand-soft"
                          >
                            ✓ เห็นด้วย
                          </button>
                        </div>
                        {lv >= 0 && (
                          <div className="mt-2 text-sm text-ink-2">
                            <b className="font-medium text-ink">
                              P{lv} {TH_SCALE[lv].label}:
                            </b>{' '}
                            {behaviourOf(it, lv)}
                          </div>
                        )}

                        {differs && (
                          <div className="mt-3">
                            <label className="text-sm font-medium" htmlFor={`n-${it.id}`}>
                              เหตุผลที่ให้ต่างจากลูกทีม <span className="text-critical">*</span>
                            </label>
                            <textarea
                              id={`n-${it.id}`}
                              rows={2}
                              value={a.review[it.id]?.note ?? ''}
                              onChange={(e) => setReview(emp.id, it.id, { note: e.target.value })}
                              placeholder="เช่น ยังต้องให้หัวหน้าช่วยดูเคส referral อยู่ ยังไม่ได้ทำเองครบทุกขั้น"
                              className="mt-1 w-full rounded-lg border border-line bg-surface p-2 text-sm outline-none focus:border-brand"
                            />
                          </div>
                        )}
                        {flag && (
                          <p className="mt-2 text-sm text-critical">{lv < 0 ? 'ยังไม่ได้เลือกระดับ' : 'กรุณาใส่เหตุผล'}</p>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </section>
            )
          })}

          <Card>
            <div className="text-sm text-ink-2">
              ทบทวนแล้ว {items.length - notReviewed.length}/{items.length} ข้อ · ปรับต่างจากลูกทีม {changed.length} ข้อ
            </div>

            {mode === 'none' && (
              <div className="mt-3 flex flex-wrap justify-between gap-2">
                <Button variant="outline" onClick={() => setMode('return')}>
                  ส่งกลับให้ลูกทีมแก้
                </Button>
                <Button
                  onClick={() => {
                    setTried(true)
                    if (ready) setMode('confirm')
                  }}
                >
                  ยืนยันผลประเมิน
                </Button>
              </div>
            )}
            {mode === 'none' && tried && !ready && (
              <p className="mt-2 text-right text-sm text-critical">
                {notReviewed.length > 0 && `ยังไม่ได้ทบทวน ${notReviewed.length} ข้อ `}
                {needNote.length > 0 && `ขาดเหตุผล ${needNote.length} ข้อ`} (ดูข้อที่มีกรอบสีแดง)
              </p>
            )}

            {mode === 'confirm' && (
              <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="mt-3 rounded-lg border border-brand bg-brand-soft p-3">
                <p className="font-medium">ยืนยันผลประเมินของ {emp.name}?</p>
                <p className="text-sm text-ink-2">ยืนยันแล้วแก้ไม่ได้ ผลนี้จะเป็นตัวเลขที่ HR ใช้วางแผน Training</p>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMode('none')}>
                    ยกเลิก
                  </Button>
                  <Button onClick={() => confirmReview(emp.id)}>ยืนยัน</Button>
                </div>
              </div>
            )}

            {mode === 'return' && (
              <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="mt-3 rounded-lg border border-line bg-surface-2 p-3">
                <label className="text-sm font-medium" htmlFor="ret">
                  บอกลูกทีมว่าต้องแก้อะไร <span className="text-critical">*</span>
                </label>
                <textarea
                  id="ret"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="เช่น ช่วยใส่ตัวอย่างงานจริงในข้อ Functional ทั้ง 4 ข้อ"
                  className="mt-1 w-full rounded-lg border border-line bg-surface p-2 text-sm outline-none focus:border-brand"
                />
                <p className="text-xs text-ink-3">คะแนนที่คุณทบทวนไว้ในรอบนี้จะถูกล้าง</p>
                <div className="mt-2 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMode('none')}>
                    ยกเลิก
                  </Button>
                  <Button
                    disabled={!reason.trim()}
                    onClick={() => {
                      returnToEmployee(emp.id, reason.trim())
                      onBack()
                    }}
                  >
                    ส่งกลับ
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

/** ความเห็นของหัวหน้าในข้อที่ปรับคะแนน — ใช้ทั้งฝั่งหัวหน้าและฝั่งพนักงาน */
export function Comments({ items, a }: { items: ProfileItem[]; a: { self: Record<string, { level: number }>; review: Record<string, { level: number; note: string }> } }) {
  const rows = items.filter((i) => a.review[i.id]?.note?.trim())
  if (!rows.length) return null
  return (
    <div className="mt-2">
      <h3 className="mb-2 text-sm font-medium">ความเห็นของหัวหน้า</h3>
      <ul className="space-y-2">
        {rows.map((it) => (
          <li key={it.id} className="rounded-lg bg-surface-2 p-3 text-sm">
            <div className="font-medium">
              {it.name}{' '}
              <span className="font-normal text-ink-3">
                (ประเมินตนเอง P{a.self[it.id]?.level} → หัวหน้า P{a.review[it.id].level})
              </span>
            </div>
            <div className="text-ink-2">{a.review[it.id].note}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
