import { useState } from 'react'
import { byId } from './data/mock'
import { useStore } from './store'
import { Avatar, DemoBanner } from './components/ui'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { AssessmentWizard } from './screens/Assessment'
import { ReviewScreen } from './screens/Review'
import { Dashboard } from './screens/Dashboard'

export default function App() {
  const userId = useStore((s) => s.userId)
  const logout = useStore((s) => s.logout)
  const [view, setView] = useState<'home' | 'assess' | 'review'>('home')
  const [reviewId, setReviewId] = useState<string | null>(null)
  const reviewee = reviewId ? byId(reviewId) : undefined
  const emp = userId ? byId(userId) : undefined

  return (
    <div className="min-h-screen">
      <DemoBanner />
      {emp && (
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <button className="font-semibold" onClick={() => setView('home')}>
              ประเมินสมรรถนะ
            </button>
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

      {!emp && <Login />}
      {emp?.role === 'hr' && <Dashboard />}
      {emp?.role === 'employee' && view === 'home' && (
        <Home
          emp={emp}
          onStart={() => setView('assess')}
          onReview={(id) => {
            setReviewId(id)
            setView('review')
            window.scrollTo(0, 0)
          }}
        />
      )}
      {emp?.role === 'employee' && view === 'review' && reviewee && reviewee.managerId === emp.id && (
        <ReviewScreen emp={reviewee} onBack={() => setView('home')} />
      )}
      {emp?.role === 'employee' && view === 'assess' && (
        <AssessmentWizard emp={emp} onDone={() => setView('home')} onExit={() => setView('home')} />
      )}
    </div>
  )
}
