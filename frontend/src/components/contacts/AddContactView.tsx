import { useState } from 'react'
import { fetchApi } from '../../api'
import { useAppStore } from '../../store/useAppStore'

interface FeedbackState {
    type: 'success' | 'error' | null
    message: string
}

const AddContactView = () => {
    const [email, setEmail] = useState('')
    const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: '' })
    const [loading, setLoading] = useState(false)
    const { setActiveView } = useAppStore()

    const handleSend = async () => {
        const trimmed = email.trim().toLowerCase()
        if (!trimmed) {
            setFeedback({ type: 'error', message: 'Por favor ingresa un correo electrónico.' })
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setFeedback({ type: 'error', message: 'Ingresa un correo electrónico válido.' })
            return
        }

        setLoading(true)
        setFeedback({ type: null, message: '' })

        try {
            await fetchApi('/contacts/request', {
                method: 'POST',
                body: JSON.stringify({ identifier: trimmed }),
            })
            setFeedback({ type: 'success', message: `¡Solicitud de contacto enviada a ${trimmed}!` })
            setEmail('')
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message || 'Error al enviar la solicitud.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center gap-3">
                <button
                    onClick={() => setActiveView('contacts')}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Añadir Contacto</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Envía una solicitud de amistad por correo</p>
                </div>
            </div>

            <div className="flex-1 px-4 py-6 flex flex-col gap-5">
                {/* Icon illustration */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                </div>

                {/* Email Input */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Correo Electrónico
                    </label>
                    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border-2 transition-colors bg-gray-bg dark:bg-dark-card ${feedback.type === 'error'
                        ? 'border-red-400'
                        : 'border-transparent focus-within:border-primary'
                        }`}>
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                if (feedback.type) setFeedback({ type: null, message: '' })
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                            placeholder="user@example.com"
                            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
                        />
                    </div>
                </div>

                {/* Feedback Message */}
                {feedback.type && (
                    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm ${feedback.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}>
                        {feedback.type === 'success' ? (
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {feedback.message}
                    </div>
                )}

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors disabled:opacity-60 shadow-md shadow-primary/25"
                >
                    {loading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Enviando...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Enviar Solicitud
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

export default AddContactView
