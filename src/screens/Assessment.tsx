import { useState } from 'react'
import type { Employee } from '../data/mock'
import { TH_GROUP, TH_SCALE } from '../data/th'
import { profileFor } from '../lib/framework'
import { useStore } from '../store'
import { Button, Card } from '../components/ui'

const isRated = (lv: number | undefined) => lv !== undefined && lv >= 0

/** ประเมินทีละ competency — ไม่โชว์ระดับเป้าหมายระหว่างทำ เพื่อไม่ให้คนเลือกตามเป้า */
export function AssessmentWizard({ emp, onDone, onExit }: { emp: Employee; onDone: () => void; onExit: () => void }) {
  const items = profileFor(emp.dept, emp.level, emp.track)
  const a = useStore((s) => s.assessments[emp.id])
  const setSelf = useStore((s) => s.setSelf)
  const submitSelf = useStore((s) => s.submitSelf)
  const firstUnrated = items.findIndex((i) => !isRated(a?.self[i.id]?.level))
  const firstOpen = firstUnrated === -1 ? items.length : firstUnrated
  const [idx, setIdx] = useState(firstOpen)
  const [showEn, setShowEn] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const ratedCount = items.filter((i) => isRated(a?.self[i.id]?.level)).length
  const onSummary = idx >= items.length

  if (onSummary) {
    const missing = items.filter((i) => !isRated(a?.self[i.id]?.level))
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="text-xl font-semibold">ตรวจคำตอบก่อนส่ง</h2>
        <p className="mt-1 text-sm text-ink-2">ส่งแล้วจะแก้ไม่ได้ ผลจะไปให้หัวหน้าทบทวนต่อ</p>
        <Card className="mt-4 p-0">
          {items.map((it, i) => {
            const lv = a?.self[it.id]?.level
            return (
              <button
                key={it.id}
                onClick={() => {
                  setConfirming(false)
                  setIdx(i)
                }}
                className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-left text-sm last:border-0 hover:bg-surface-2"
              >
                <span>
                  <span className="mr-2 text-xs text-ink-3">{i + 1}.</span>
                  {it.name}
                </span>
                {isRated(lv) ? (
                  <span className="shrink-0 font-medium">
                    P{lv} {TH_SCALE[lv!].label}
                  </span>
                ) : (
                  <span className="shrink-0 text-critical">ยังไม่ได้ตอบ</span>
                )}
              </button>
            )
          })}
        </Card>
        {confirming ? (
          <div
            ref={(el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="mt-5 rounded-xl border border-brand bg-brand-soft p-4"
            role="alertdialog"
            aria-label="ยืนยันส่งผลประเมิน"
          >
            <p className="font-medium">ยืนยันส่งผลประเมิน?</p>
            <p className="text-sm text-ink-2">ส่งแล้วจะแก้ไขไม่ได้ ผลจะไปให้หัวหน้าทบทวนต่อ</p>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirming(false)}>
                ยกเลิก
              </Button>
              <Button
                onClick={() => {
                  submitSelf(emp.id)
                  onDone()
                }}
              >
                ยืนยันส่ง
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setIdx(items.length - 1)}>
              ย้อนกลับ
            </Button>
            <div className="flex items-center gap-3">
              {missing.length > 0 && <span className="text-sm text-critical">เหลืออีก {missing.length} ข้อ</span>}
              <Button disabled={missing.length > 0} onClick={() => setConfirming(true)}>
                ส่งผลประเมิน
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const it = items[idx]
  const cur = a?.self[it.id]
  const groupIdx = items.filter((x) => x.group === it.group).indexOf(it) + 1
  const groupTotal = items.filter((x) => x.group === it.group).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between text-sm text-ink-2">
        <button onClick={onExit} className="hover:text-ink">
          ← บันทึกแล้วออก
        </button>
        <span>
          ตอบแล้ว {ratedCount}/{items.length}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-brand transition-all" style={{ width: `${(ratedCount / items.length) * 100}%` }} />
      </div>

      <Card className="mt-5">
        <div className="text-xs text-ink-3">
          ข้อ {idx + 1} จาก {items.length} · {TH_GROUP[it.group]} ({groupIdx}/{groupTotal})
        </div>
        <h2 className="mt-1 text-xl font-semibold">{it.name}</h2>
        <div className="text-sm text-ink-3">{it.nameEn}</div>
        <p className="mt-3 text-ink-2">{showEn ? it.definitionEn : it.definition}</p>

        <p className="mt-5 text-sm font-medium">ข้อไหนตรงกับที่คุณทำได้จริงในงานตอนนี้มากที่สุด?</p>
        <p className="text-xs text-ink-3">เลือกจากสิ่งที่ทำได้สม่ำเสมอ ไม่ใช่สิ่งที่เคยทำได้ครั้งเดียว</p>

        <div className="mt-3 space-y-2" role="radiogroup">
          {TH_SCALE.map((sc, lv) => {
            const text = lv === 0 ? sc.hint : showEn ? it.behavioursEn[lv - 1] : it.behaviours[lv - 1]
            const active = cur?.level === lv
            return (
              <button
                key={sc.code}
                role="radio"
                aria-checked={active}
                onClick={() => setSelf(emp.id, it.id, { level: lv })}
                className={`flex w-full gap-3 rounded-lg border p-3 text-left transition ${
                  active ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink-3'
                }`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? 'border-brand' : 'border-ink-3'
                  }`}
                >
                  {active && <span className="size-2.5 rounded-full bg-brand" />}
                </span>
                <span>
                  <span className="text-sm font-medium">
                    {sc.code} · {sc.label}
                  </span>
                  <span className="block text-sm text-ink-2">{text}</span>
                </span>
              </button>
            )
          })}
        </div>

        <label className="mt-5 block text-sm font-medium" htmlFor="note">
          ตัวอย่างงานที่ทำจริง <span className="font-normal text-ink-3">(ไม่บังคับ แต่ช่วยให้หัวหน้าทบทวนง่ายขึ้น)</span>
        </label>
        <textarea
          id="note"
          rows={2}
          value={cur?.note ?? ''}
          onChange={(e) => setSelf(emp.id, it.id, { note: e.target.value })}
          placeholder="เช่น เดือนที่แล้วรับเคส Property วงเงิน 50 ล้านบาท และส่ง referral ตามขั้นตอน"
          className="mt-1 w-full rounded-lg border border-line bg-surface p-2 text-sm outline-none focus:border-brand"
        />

        {!it.translated && <p className="mt-3 text-xs text-warn-ink">ข้อนี้ยังไม่มีคำแปลไทย แสดงต้นฉบับภาษาอังกฤษ</p>}
        <button onClick={() => setShowEn((v) => !v)} className="mt-3 text-xs text-brand hover:underline">
          {showEn ? 'แสดงภาษาไทย' : 'ดูต้นฉบับภาษาอังกฤษ'}
        </button>
      </Card>

      <div className="mt-5 flex justify-between">
        <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          ก่อนหน้า
        </Button>
        <Button disabled={!isRated(cur?.level)} onClick={() => setIdx(idx + 1)}>
          {idx === items.length - 1 ? 'ตรวจคำตอบ' : 'ถัดไป'}
        </Button>
      </div>
    </div>
  )
}
