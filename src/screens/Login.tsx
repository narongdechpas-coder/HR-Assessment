import { useState } from 'react'
import { CYCLE, EMPLOYEES, reportsOf } from '../data/mock'
import { TH_DEPT, TH_LEVEL } from '../data/th'
import { useStore } from '../store'
import { Avatar, Button, StatusBadge } from '../components/ui'

export function Login() {
  const login = useStore((s) => s.login)
  const resetDemo = useStore((s) => s.resetDemo)
  const assessments = useStore((s) => s.assessments)
  const depts = ['D01', 'D02', 'D12']
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">ประเมินสมรรถนะตนเอง</h1>
      <p className="mt-1 text-ink-2">{CYCLE.name} · ฝ่ายรับประกันภัย และฝ่ายสินไหมทดแทน</p>

      <div className="mt-6 rounded-xl border border-line bg-surface p-4 text-sm text-ink-2">
        <p className="font-medium text-ink">วิธีลอง Demo</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5">
          <li>
            เข้าเป็น <b className="font-medium text-ink">ชลธิชา (E1010)</b> แล้วลองประเมินตนเองจนส่ง
          </li>
          <li>
            เข้าเป็น <b className="font-medium text-ink">สุภาวดี (E1004)</b> หัวหน้าของชลธิชา เพื่อทบทวนคะแนน
          </li>
          <li>
            เข้าเป็น <b className="font-medium text-ink">มณีรัตน์ (HR)</b> เพื่อดู Dashboard วางแผน Training และ Export Excel
          </li>
        </ol>
        <p className="mt-2">ระบบจริงจะให้ login ด้วยบัญชีบริษัท หน้านี้มีไว้สลับผู้ใช้ตอน Demo เท่านั้น</p>
      </div>

      {depts.map((d) => (
        <section key={d} className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-ink-2">{TH_DEPT[d]}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {EMPLOYEES.filter((x) => x.dept === d).map((emp) => {
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
                      {emp.role === 'hr' ? 'HR' : `${emp.level} ${TH_LEVEL[emp.level]}`}
                      {team > 0 && ` · หัวหน้าของ ${team} คน`}
                    </div>
                  </div>
                  {a && <StatusBadge status={a.status} />}
                </button>
              )
            })}
          </div>
        </section>
      ))}

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
