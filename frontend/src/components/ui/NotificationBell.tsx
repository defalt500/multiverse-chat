import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { fetchApi } from '../../api'
import Avatar from './Avatar'

const NotificationBell = ({ mobileMode = false }: { mobileMode?: boolean }) => {
    const [open, setOpen] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    const notifications = useAppStore(s => s.notifications)
    const markNotificationsRead = useAppStore(s => s.markNotificationsRead)
    const clearNotifications = useAppStore(s => s.clearNotifications)
    const setActiveView = useAppStore(s => s.setActiveView)
    const setActiveConversation = useAppStore(s => s.setActiveConversation)
    const removeContactRequest = useAppStore(s => s.removeContactRequest)
    const loadConversations = useAppStore(s => s.loadConversations)

    const unread = notifications.filter(n => !n.read).length

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const handleOpen = () => {
        setOpen(v => !v)
        if (!open) markNotificationsRead()
    }

    const handleNotifClick = (notif: typeof notifications[0]) => {
        setOpen(false)
        if (notif.type === 'contact_request') {
            setActiveView('contacts')
        } else if (notif.type === 'message' && notif.referenceId) {
            setActiveConversation(notif.referenceId)
        }
    }

    const handleAccept = async (requestId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await fetchApi('/contacts/respond', {
                method: 'POST',
                body: JSON.stringify({ requestId, accept: true }),
            })
            removeContactRequest(requestId)
            await loadConversations()
            // Update notification body
            useAppStore.setState(state => ({
                notifications: state.notifications.map(n =>
                    n.referenceId === requestId
                        ? { ...n, body: 'Solicitud de contacto aceptada ✓', read: true }
                        : n
                )
            }))
        } catch (err: any) { console.error(err.message) }
    }

    const handleReject = async (requestId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await fetchApi('/contacts/respond', {
                method: 'POST',
                body: JSON.stringify({ requestId, accept: false }),
            })
            removeContactRequest(requestId)
            useAppStore.setState(state => ({
                notifications: state.notifications.filter(n => n.referenceId !== requestId)
            }))
        } catch (err: any) { console.error(err.message) }
    }

    const BellIcon = (
        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    )

    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <div className="relative" ref={panelRef}>
                {/* Bell button — two display modes */}
                {mobileMode ? (
                    <button
                        onClick={handleOpen}
                        aria-label="Notificaciones"
                        className="bottom-nav-item bottom-nav-item-inactive relative"
                    >
                        <span className={`bottom-nav-icon-wrap ${open ? 'bottom-nav-icon-active' : ''}`}>
                            {BellIcon}
                            {unread > 0 && (
                                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                    {unread > 9 ? '9+' : unread}
                                </span>
                            )}
                        </span>
                        <span className="bottom-nav-label">Notif.</span>
                        {unread > 0 && <span className="bottom-nav-pip" />}
                    </button>
                ) : (
                    <button
                        onClick={handleOpen}
                        title="Notifications"
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors relative"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unread > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                {unread > 9 ? '9+' : unread}
                            </span>
                        )}
                    </button>
                )}

                {/* Notification panel
                    Desktop: absolute to the right of the bell (left-full)
                    Mobile:  fixed bottom sheet anchored to bottom of screen */}
                {open && (
                    <div className="
                            bg-white dark:bg-dark-sidebar border border-gray-100 dark:border-gray-700 shadow-xl z-50 overflow-hidden
                            fixed bottom-0 left-0 right-0 rounded-t-2xl max-h-[70vh] flex flex-col
                            md:absolute md:bottom-auto md:left-full md:right-auto md:top-0 md:ml-2 md:w-80 md:rounded-2xl md:max-h-96 md:block
                        "
                        style={{ zIndex: 50 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Notificaciones</h3>
                            <div className="flex items-center gap-3">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearNotifications}
                                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        Borrar todo
                                    </button>
                                )}
                                {/* Close button — visible on mobile */}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto md:max-h-96 flex-1">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-gray-400">
                                    <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <p className="text-sm">No hay notificaciones</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotifClick(notif)}
                                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-card transition-colors text-left ${!notif.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                    >
                                        <div className="flex-shrink-0 mt-0.5">
                                            {notif.fromUser ? (
                                                <Avatar src={notif.fromUser.avatar} name={notif.fromUser.name} size="sm" />
                                            ) : (
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${notif.type === 'message' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                                                    {notif.type === 'message' ? (
                                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                        </svg>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
                                                {notif.title}
                                                {!notif.read && (
                                                    <span className="ml-1.5 w-1.5 h-1.5 bg-primary rounded-full inline-block" />
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{notif.body}</p>
                                            {notif.type === 'contact_request' && notif.referenceId && notif.body !== 'Solicitud de contacto aceptada ✓' && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={(e) => handleAccept(notif.referenceId!, e)}
                                                        className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                                                    >
                                                        Aceptar
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleReject(notif.referenceId!, e)}
                                                        className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors font-medium"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default NotificationBell
