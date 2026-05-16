import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SplashScreen from './pages/SplashScreen'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import { useAppStore } from './store/useAppStore'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/splash" element={<SplashScreen />} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    </Routes>
  )
}

export default App
