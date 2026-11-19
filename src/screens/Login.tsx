import { useState } from 'react'
import { CYCLE, EMPLOYEES, byId, reportsOf } from '../data/mock'
import { TH_DEPT, TH_LEVEL, TH_TRACK } from '../data/th'
import { useStore } from '../store'
import { Avatar, Button, StatusBadge } from '../components/ui'

const DEMO = [
  { id: 'E0105', what: 'ลองประเมินตนเองจนส่ง (พนักงาน L1)' },
  { id: 'E0103', what: 'หัวหน้าทบทวนคะแนนลูกทีม (L3)' },
  { id: 'E1203', what: 'HR Dashboard และ Export Excel' },
]

export function Login({ onBrowse }: { onBrowse: () => void }) {
  const login = useStore((s) => s.login)
  const resetDemo = useStore((s) => s.resetDemo)
  const assessments = useStore((s) => s.assessments)
  const [dept, setDept] = useState('D01')
  const [confirmReset, setConfirmReset] = useState(false)
  const depts = Object.keys(TH_DEPT)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">ประเมินสมรรถนะตนเอง</h1>
      <p className="mt-1 text-ink-2">
        {CYCLE.name} · {depts.length} ฝ่าย · {EMPLOYEES.length} คน (ข้อมูลสมมติ)
      </p>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <p className="text-sm font-medium">ลอง Demo เร็วๆ</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {DEMO.map(({ id, what }) => {
            const e = byId(id)!
            return (
              <button
                key={id}
                onClick={() => login(id)}
                className="flex items-center gap-3 rounded-lg border border-line p-2.5 text-left hover:border-brand"
              >
                <Avatar id={id} name={e.name} size={40} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{e.name.split(' ')[0]}</span>
                  <span className="block text-xs text-ink-2">{what}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-2">
          <span>ระบบจริงจะให้ login ด้วยบัญชีบริษัท หน้านี้มีไว้สลับผู้ใช้ตอน Demo เท่านั้น</span>
          <Button variant="outline" onClick={onBrowse}>
            ดูข้อคำถามตามตำแหน่ง
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-ink-2">เลือกพนักงานตามฝ่าย</h2>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          aria-label="เลือกฝ่าย"
        >
          {depts.map((d) => (
            <option key={d} value={d}>
              {TH_DEPT[d]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {EMPLOYEES.filter((x) => x.dept === dept).map((emp) => {
          const team = reportsOf(emp.id).length
          const a = assessments[emp.id]
          return (
            <button
              key={emp.id}
              onClick={() => login(emp.id)}
              className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3 text-left hover:border-brand"
            >
              <Avatar id={emp.id} name={emp.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {emp.name} <span className="text-xs font-normal text-ink-3">{emp.id}</span>
                </div>
                <div className="truncate text-xs text-ink-2">{emp.title}</div>
                <div className="mt-1 text-xs text-ink-3">
                  {emp.level} {TH_LEVEL[emp.level]} · {TH_TRACK[emp.track]}
                  {team > 0 && ` · หัวหน้าของ ${team} คน`}
                  {emp.hrAdmin && ' · เข้า HR Dashboard ได้'}
                </div>
              </div>
              {a && <StatusBadge status={a.status} />}
            </button>
          )
        })}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-end gap-2">
        {confirmReset ? (
          <>
            <span className="text-sm text-ink-2">ล้างข้อมูลที่กรอกไว้ทั้งหมด แล้วกลับไปใช้ข้อมูลสมมติตั้งต้น?</span>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                resetDemo()
                setConfirmReset(false)
              }}
            >
              ยืนยันรีเซ็ต
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmReset(true)}>
            รีเซ็ตข้อมูล Demo
          </Button>
        )}
      </div>
    </div>
  )
}
