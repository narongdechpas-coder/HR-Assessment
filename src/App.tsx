import { useEffect, useRef, useState } from 'react'
import { byId } from './data/mock'
import { useStore } from './store'
import { Avatar, DemoBanner } from './components/ui'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { AssessmentWizard } from './screens/Assessment'
import { ReviewScreen } from './screens/Review'
import { Dashboard } from './screens/Dashboard'
import { FrameworkBrowser } from './screens/Framework'

type View = 'home' | 'assess' | 'review' | 'dashboard' | 'framework'

export default function App() {
  const userId = useStore((s) => s.userId)
  const logout = useStore((s) => s.logout)
  const [view, setView] = useState<View>('home')
  const [reviewId, setReviewId] = useState<string | null>(null)
  const reviewee = reviewId ? byId(reviewId) : undefined
  const emp = userId ? byId(userId) : undefined
  const go = (v: View) => {
    setView(v)
    window.scrollTo(0, 0)
  }
  // พอเปลี่ยนผู้ใช้ ให้ไปหน้าที่เหมาะกับคนนั้น (HR ไป Dashboard ก่อน)
  const lastUser = useRef(userId)
  useEffect(() => {
    if (userId === lastUser.current) return
    lastUser.current = userId
    if (userId) {
      setView(byId(userId)?.hrAdmin ? 'dashboard' : 'home')
      window.scrollTo(0, 0)
    }
  }, [userId])

  const tab = (v: View, label: string) => (
    <button
      onClick={() => go(v)}
      className={`rounded-lg px-2.5 py-1 ${view === v ? 'bg-brand-soft font-medium text-brand' : 'text-ink-2 hover:bg-surface-2'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen">
      <DemoBanner />
      {emp && (
        <header className="border-b border-line bg-surface">
          <div className={`mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${view === 'dashboard' ? 'max-w-[1600px]' : 'max-w-4xl'}`}>
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {tab('home', 'ของฉัน')}
              {emp.hrAdmin && tab('dashboard', 'HR Dashboard')}
              {tab('framework', 'ข้อคำถาม')}
            </nav>
            <div className="flex items-center gap-3 text-sm">
              <Avatar id={emp.id} name={emp.name} size={28} />
              <span className="hidden text-ink-2 sm:inline">{emp.name}</span>
              <button
                className="text-brand hover:underline"
                onClick={() => {
                  setView('home')
                  logout()
                }}
              >
                สลับผู้ใช้
              </button>
            </div>
          </div>
        </header>
      )}

      {!emp && view !== 'framework' && <Login onBrowse={() => go('framework')} />}
      {view === 'framework' && <FrameworkBrowser onBack={() => go('home')} />}
      {emp && view === 'dashboard' && emp.hrAdmin && <Dashboard />}
      {emp && view === 'home' && (
        <Home
          emp={emp}
          onStart={() => go('assess')}
          onReview={(id) => {
            setReviewId(id)
            go('review')
          }}
        />
      )}
      {emp && view === 'review' && reviewee && reviewee.managerId === emp.id && (
        <ReviewScreen emp={reviewee} onBack={() => go('home')} />
      )}
      {emp && view === 'assess' && <AssessmentWizard emp={emp} onDone={() => go('home')} onExit={() => go('home')} />}
    </div>
  )
}

