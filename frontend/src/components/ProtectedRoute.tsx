import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

interface Props {
    children: React.ReactNode
}

/**
 * Redirects unauthenticated users to /login.
 * Uses the currentUser in the Zustand store (set after Firebase auth).
 */
const ProtectedRoute = ({ children }: Props) => {
    const currentUser = useAppStore((s) => s.currentUser)

    if (!currentUser) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

export default ProtectedRoute
