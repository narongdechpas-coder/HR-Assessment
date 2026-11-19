import { useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { PHOTOS, type Status } from '../data/mock'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</div>
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' }
export function Button({ variant = 'primary', className = '', ...p }: BtnProps) {
  const v = {
    primary: 'bg-brand text-on-brand hover:opacity-90 disabled:opacity-40',
    outline: 'border border-line bg-surface text-ink hover:bg-surface-2 disabled:opacity-40',
    ghost: 'text-ink-2 hover:bg-surface-2 disabled:opacity-40',
  }[variant]
  return <button {...p} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${v} ${className}`} />
}

const STATUS: Record<Status, { label: string; cls: string }> = {
  not_started: { label: 'ยังไม่เริ่ม', cls: 'bg-surface-2 text-ink-2' },
  draft: { label: 'กำลังทำ', cls: 'bg-warn-soft text-warn-ink' },
  submitted: { label: 'ส่งแล้ว · รอหัวหน้าทบทวน', cls: 'bg-brand-soft text-brand' },
  confirmed: { label: 'หัวหน้ายืนยันแล้ว', cls: 'bg-good-soft text-good' },
}
export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
}

export function DemoBanner() {
  return (
    <div className="bg-warn-soft px-4 py-1.5 text-center text-xs text-warn-ink">
      Demo · ชื่อและคะแนนทั้งหมดเป็นข้อมูลสมมติ · ข้อมูลเก็บไว้ใน browser เครื่องนี้เท่านั้น
    </div>
  )
}

/** รูปพนักงาน (Demo ใช้รูป mockup ใน public/avatars) ถ้าโหลดไม่ได้จะแสดงอักษรแรกของชื่อแทน */
export function Avatar({
  id, name, size = 40, square = false, className = '',
}: { id: string; name: string; size?: number; square?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false)
  const shape = square ? 'rounded-2xl shadow-md' : 'rounded-full'
  const style = { width: size, height: size }
  if (failed || !PHOTOS.has(id))
    return (
      <span
        style={{ ...style, fontSize: size * 0.4 }}
        className={`inline-flex shrink-0 items-center justify-center ${shape} bg-brand-soft font-medium text-brand ${className}`}
      >
        {initial(name)}
      </span>
    )
  return (
    <img
      src={`${import.meta.env.BASE_URL}avatars/${id}.jpg`}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={style}
      className={`shrink-0 ${shape} bg-surface-2 object-cover ${className}`}
    />
  )
}

/** อักษรแรกของชื่อไทย (ข้ามสระหน้า เ แ โ ใ ไ) */
function initial(name: string) {
  const c = [...name].find((ch) => !'เแโใไ'.includes(ch))
  return c ?? name.charAt(0)
}
