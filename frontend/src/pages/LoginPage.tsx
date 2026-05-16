import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirebaseAuth } from '../config/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { fetchApi, setAuthToken } from '../api'
import { useAppStore } from '../store/useAppStore'

const LoginPage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const updateCurrentUser = useAppStore(state => state.updateCurrentUser)

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError(null)
        try {
            const provider = new GoogleAuthProvider()
            // Force account picker every time
            provider.setCustomParameters({ prompt: 'select_account' })
            const firebaseAuth = getFirebaseAuth()
            const result = await signInWithPopup(firebaseAuth, provider)
            const token = await result.user.getIdToken()
            setAuthToken(token)
            const response = await fetchApi('/auth/verify', { method: 'POST' })
            if (response?.user) {
                updateCurrentUser(response.user)
                navigate('/splash')
            } else {
                throw new Error('Error al obtener datos del usuario desde el servidor')
            }
        } catch (err: any) {
            // Ignore user-cancelled popup
            if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
                setLoading(false)
                return
            }
            setError(err.message || 'La autenticación falló')
            console.error('Login error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center px-4">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" />
                    </svg>
                </div>
                <span className="text-xl font-bold text-gray-800">Multiverse Chat ITESI</span>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h1>
                <p className="text-gray-500 mt-1 text-sm">Inicia sesión para continuar en Multiverse Chat.</p>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/60 p-6 sm:p-8">
                {error && (
                    <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 py-2 px-3 rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-sm shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <p className="mt-6 text-xs text-gray-400">© 2026 Multiverse Chat</p>
        </div>
    )
}

export default LoginPage
