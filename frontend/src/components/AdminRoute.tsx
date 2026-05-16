import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

interface Props {
    children: React.ReactNode
}

/**
 * AdminRoute — allows access only to authenticated admins.
 * Non-logged-in users → /login
 * Logged-in but not admin → /chat
 */
const AdminRoute = ({ children }: Props) => {
    const currentUser = useAppStore((s) => s.currentUser)

    if (!currentUser) {
        return <Navigate to="/login" replace />
    }

    if (currentUser.role !== 'admin') {
        return <Navigate to="/chat" replace />
    }

    return <>{children}</>
}

export default AdminRoute
