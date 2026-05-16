import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchApi, getAuthToken } from '../api'
import { useAppStore } from '../store/useAppStore'
import { initSocket } from '../socket'

const SplashScreen = () => {
    const navigate = useNavigate()

    const updateCurrentUser = useAppStore(s => s.updateCurrentUser)
    const loadConversations = useAppStore(s => s.loadConversations)
    const loadPendingRequests = useAppStore(s => s.loadPendingRequests)

    useEffect(() => {
        const checkAuth = async () => {
            const token = getAuthToken()
            if (!token) {
                setTimeout(() => navigate('/login', { replace: true }), 1000)
                return
            }

            try {
                const res = await fetchApi('/users/me')
                if (res?.user) {
                    updateCurrentUser(res.user)
                    await loadConversations()
                    await loadPendingRequests()

                    // Init real-time sockets (async — fetches a fresh Firebase token)
                    await initSocket()

                    // Role-based redirect
                    if (res.user.role === 'admin') {
                        navigate('/admin-dashboard', { replace: true })
                    } else {
                        navigate('/chat', { replace: true })
                    }
                } else {
                    navigate('/login', { replace: true })
                }
            } catch (err) {
                console.error("Auth check failed:", err)
                navigate('/login', { replace: true })
            }
        }

        checkAuth()
    }, [navigate, updateCurrentUser, loadConversations, loadPendingRequests])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F2F5] dark:bg-dark-panel">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                {/* Logo Icon */}
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" />
                    </svg>
                </div>
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">
                    Multiverse Chat ITESI
                </h1>
                {/* Loading Indicatior */}
                <div className="mt-2 flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    )
}

export default SplashScreen
