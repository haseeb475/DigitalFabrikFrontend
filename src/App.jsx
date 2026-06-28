import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiService } from './services/mockApi'
import { LocaleProvider } from './i18n/useLocale'
import { LandingPage } from './components/features/LandingPage'
import { DashboardShell } from './pages/DashboardShell'

function DashboardGuard({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    apiService.fetchUserProgress().then((session) => {
      setStatus(session?.sessionId ? 'ok' : 'redirect')
    })
  }, [])

  if (status === 'loading') return null
  if (status === 'redirect') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <LocaleProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <DashboardGuard>
              <DashboardShell />
            </DashboardGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LocaleProvider>
  )
}
