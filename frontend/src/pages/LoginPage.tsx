import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirebaseAuth } from '../config/firebase'
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
} from 'firebase/auth'
import { fetchApi, setAuthToken } from '../api'
import { useAppStore } from '../store/useAppStore'

const LoginPage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const updateCurrentUser = useAppStore(state => state.updateCurrentUser)

    // ── Handle redirect result after returning from Google OAuth ──────────────
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const firebaseAuth = getFirebaseAuth()
                const result = await getRedirectResult(firebaseAuth)
                if (!result) return  // No redirect result — normal page load

                setLoading(true)
                setError(null)
                const token = await result.user.getIdToken(true)
                setAuthToken(token)
                const response = await fetchApi('/auth/verify', { method: 'POST' })
                if (response?.user) {
                    updateCurrentUser(response.user)
                    navigate('/splash')
                } else {
                    throw new Error('Error al obtener datos del usuario desde el servidor')
                }
            } catch (err: any) {
                if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return
                if (err?.code === 'auth/no-current-user') return
                if (err?.message?.includes('No redirect')) return
                setError(err.message || 'La autenticación falló')
                console.error('Redirect login error:', err)
            } finally {
                setLoading(false)
            }
        }

        handleRedirectResult()
    }, [navigate, updateCurrentUser])

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError(null)
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        const firebaseAuth = getFirebaseAuth()

        try {
            const result = await signInWithPopup(firebaseAuth, provider)
            const token = await result.user.getIdToken(true)
            setAuthToken(token)
            const response = await fetchApi('/auth/verify', { method: 'POST' })
            if (response?.user) {
                updateCurrentUser(response.user)
                navigate('/splash')
            } else {
                throw new Error('Error al obtener datos del usuario desde el servidor')
            }
        } catch (err: any) {
            if (
                err?.code === 'auth/popup-blocked' ||
                err?.code === 'auth/popup-closed-by-user' ||
                err?.code === 'auth/cancelled-popup-request' ||
                err?.code === 'auth/operation-not-supported-in-this-environment'
            ) {
                await signInWithRedirect(firebaseAuth, provider)
                return
            }
            setError(err.message || 'La autenticación falló')
            console.error('Login error:', err)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center px-4 overflow-hidden animate-page-in">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#eef0ff] via-[#f5f5ff] to-[#e8eeff] dark:from-[#0e1230] dark:via-[#141838] dark:to-[#1a1f42]" />
            {/* Decorative blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
            <div className="absolute bottom-[-5%] right-[-5%] w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />

            <div className="relative z-10 w-full flex flex-col items-center">
                {/* Logo */}
                <div className="flex items-center gap-2.5 mb-7">
                    <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Multiverse Chat ITESI</span>
                </div>

                <div className="text-center mb-7">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Iniciar Sesión</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Inicia sesión para continuar en Multiverse Chat.</p>
                </div>

                {/* Card */}
                <div className="w-full max-w-md bg-white/90 dark:bg-dark-sidebar/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary/10 dark:shadow-black/40 border border-white/60 dark:border-gray-700/50 p-6 sm:p-8 transition-all">
                    {error && (
                        <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-500/10 py-2 px-3 rounded-xl border border-red-100 dark:border-red-500/20">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-input hover:border-primary/30 hover:shadow-md hover:shadow-primary/10 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {loading ? (
                            <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        {loading ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
                    </button>
                </div>

                <p className="mt-6 text-xs text-gray-400 dark:text-gray-600 relative z-10">© 2026 Multiverse Chat</p>
            </div>
        </div>
    )
}

export default LoginPage
