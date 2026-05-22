import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { AppNotification } from '../../types'
import Avatar from './Avatar'

interface ToastItem extends AppNotification {
    exiting: boolean
}

const TOAST_DURATION = 4500  // ms before auto-dismiss
const MAX_TOASTS = 4       // max visible at once

const ToastNotifications = () => {
    const notifications = useAppStore(s => s.notifications)
    const setActiveConversation = useAppStore(s => s.setActiveConversation)
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const seenIds = useRef(new Set<string>())

    // Watch for NEW unread notifications and queue them as toasts
    useEffect(() => {
        const fresh = notifications.filter(
            n => !n.read && !seenIds.current.has(n.id)
        )
        if (!fresh.length) return

        fresh.forEach(n => seenIds.current.add(n.id))

        setToasts(prev => {
            const next = [
                ...fresh.map(n => ({ ...n, exiting: false })),
                ...prev,
            ].slice(0, MAX_TOASTS)
            return next
        })
    }, [notifications])

    // Auto-dismiss each toast after TOAST_DURATION
    useEffect(() => {
        if (!toasts.length) return

        const timers = toasts
            .filter(t => !t.exiting)
            .map(t => {
                const timer = setTimeout(() => dismissToast(t.id), TOAST_DURATION)
                return timer
            })

        return () => timers.forEach(clearTimeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toasts.map(t => t.id).join(',')])

    const dismissToast = (id: string) => {
        // Mark as exiting (triggers exit animation)
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
        // Remove from DOM after animation completes
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 320)
    }

    const handleToastClick = (toast: ToastItem) => {
        if (toast.type === 'message' && toast.referenceId) {
            setActiveConversation(toast.referenceId)
        }
        dismissToast(toast.id)
    }

    if (!toasts.length) return null

    return (
        <div
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none"
            aria-live="polite"
            aria-label="Notificaciones"
        >
            {toasts.map(toast => (
                <ToastCard
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => dismissToast(toast.id)}
                    onClick={() => handleToastClick(toast)}
                />
            ))}
        </div>
    )
}

// ── Individual Toast Card ─────────────────────────────────────────────────────

interface ToastCardProps {
    toast: ToastItem
    onDismiss: () => void
    onClick: () => void
}

const ToastCard = ({ toast, onDismiss, onClick }: ToastCardProps) => {
    const isMessage = toast.type === 'message'

    return (
        <div
            className={`
                pointer-events-auto
                w-[320px] max-w-[calc(100vw-2rem)]
                flex items-start gap-3
                bg-white/95 dark:bg-dark-sidebar/95
                backdrop-blur-xl
                border border-white/60 dark:border-gray-700/60
                rounded-2xl
                px-4 py-3
                shadow-2xl shadow-black/15 dark:shadow-black/40
                cursor-pointer
                transition-all
                select-none
                ${toast.exiting ? 'animate-toast-out' : 'animate-toast-in'}
            `}
            role="alert"
            onClick={onClick}
        >
            {/* Avatar / Icon */}
            <div className="flex-shrink-0 mt-0.5">
                {toast.fromUser ? (
                    <Avatar
                        src={toast.fromUser.avatar}
                        name={toast.fromUser.name}
                        size="sm"
                        isOnline={isMessage}
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {isMessage ? '💬 Mensaje nuevo' : '👤 Solicitud'}
                    </span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">ahora</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate leading-tight">
                    {toast.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mt-0.5">
                    {toast.body}
                </p>
            </div>

            {/* Dismiss button */}
            <button
                onClick={e => { e.stopPropagation(); onDismiss() }}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors mt-0.5"
                aria-label="Cerrar notificación"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
                <div
                    className="h-full bg-primary/50 origin-left animate-toast-progress"
                    style={{ animationDuration: `${TOAST_DURATION}ms` }}
                />
            </div>
        </div>
    )
}

export default ToastNotifications
