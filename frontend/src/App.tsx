import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SplashScreen from './pages/SplashScreen'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import { useAppStore } from './store/useAppStore'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

/** Thin wrapper that re-mounts (giving a new key) on path change so the
 *  `animate-page-in` class always fires on each navigation. */
const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="contents animate-page-in">
      {children}
    </div>
  )
}

function App() {
  const darkMode = useAppStore((s) => s.darkMode)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
      <Route path="/splash" element={<AnimatedPage><SplashScreen /></AnimatedPage>} />
      <Route path="/chat" element={<AnimatedPage><ProtectedRoute><ChatPage /></ProtectedRoute></AnimatedPage>} />
      <Route path="/profile" element={<AnimatedPage><ProtectedRoute><ProfilePage /></ProtectedRoute></AnimatedPage>} />
      <Route path="/admin-dashboard" element={<AnimatedPage><AdminRoute><AdminDashboard /></AdminRoute></AnimatedPage>} />
    </Routes>
  )
}

export default App
