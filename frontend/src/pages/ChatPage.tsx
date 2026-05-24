import { useEffect } from 'react'
import IconSidebar from '../components/layout/IconSidebar'
import ConversationPanel from '../components/layout/ConversationPanel'
import ChatWindow from '../components/layout/ChatWindow'
import BottomNav from '../components/layout/BottomNav'
import UserProfileDrawer from '../components/profile/UserProfileDrawer'
import ToastNotifications from '../components/ui/ToastNotifications'
import { initSocket, joinConversation, getSocket } from '../socket'
import { useAppStore } from '../store/useAppStore'
import { getFirebaseAuth } from '../config/firebase'
import { setAuthToken } from '../api'

const ChatPage = () => {
    const { conversations, loadConversations, loadPendingRequests, activeConversationId } = useAppStore()

    useEffect(() => {
        let refreshTimer: ReturnType<typeof setInterval> | null = null
        let pollTimer: ReturnType<typeof setInterval> | null = null
        let tokenTimer: ReturnType<typeof setInterval> | null = null
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null

        const boot = async () => {
            const socket = await initSocket()

            // Re-join all known conversation rooms
            if (socket) {
                conversations.forEach(c => joinConversation(c.id))
            }

            // Refresh conversation list & pending requests on boot
            loadConversations()
            loadPendingRequests()
        }

        boot()

        // ── Periodic conversation refresh ─────────────────────────────────────
        // Ensures sidebar shows correct lastMessage and unreadCount even after
        // reconnects, browser wake from sleep, or missed socket events
        refreshTimer = setInterval(() => {
            loadConversations()
        }, 60_000) // every 60 seconds

        // Poll pending contact requests every 30s as a fallback for missed socket events
        pollTimer = setInterval(() => {
            loadPendingRequests()
        }, 30_000)

        // ── Presence heartbeat ────────────────────────────────────────────────
        // Emits a heartbeat every 30s so the server can accurately track lastActive
        // and mark users offline if they lose connection without a clean disconnect
        heartbeatTimer = setInterval(() => {
            const s = getSocket()
            if (s?.connected) {
                s.emit('heartbeat')
            }
        }, 30_000)

        // ── Firebase token refresh every 50 min ───────────────────────────────
        const scheduleTokenRefresh = () => {
            tokenTimer = setInterval(async () => {
                try {
                    const user = getFirebaseAuth().currentUser
                    if (!user) return
                    const fresh = await user.getIdToken(true)
                    setAuthToken(fresh)
                    const s = getSocket()
                    if (s) (s.auth as Record<string, string>).token = fresh
                } catch { /* non-fatal */ }
            }, 50 * 60 * 1000)
        }

        scheduleTokenRefresh()

        return () => {
            if (refreshTimer) clearInterval(refreshTimer)
            if (pollTimer) clearInterval(pollTimer)
            if (tokenTimer) clearInterval(tokenTimer)
            if (heartbeatTimer) clearInterval(heartbeatTimer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Mobile: show conversation panel OR chat window depending on whether a chat is open
    const mobileShowChat = !!activeConversationId

    return (
        <div className="app-height flex overflow-hidden bg-gray-bg dark:bg-dark-panel animate-page-in">
            {/* ── Desktop: Icon sidebar always visible ── */}
            <div className="hidden md:flex flex-shrink-0">
                <IconSidebar />
            </div>

            {/* ── Mobile: ConversationPanel — full width, full height, no overflow ── */}
            <div className={`
                md:flex flex-shrink-0
                ${mobileShowChat
                    ? 'hidden'
                    : 'flex flex-col w-full min-h-0 flex-1 animate-slide-in-left'}
                md:flex-col md:w-auto md:flex-none
            `}>
                <ConversationPanel />
            </div>

            {/* ── Mobile: ChatWindow — full width, full height, no overflow ── */}
            <div className={`
                md:flex flex-1 min-w-0 min-h-0
                ${mobileShowChat ? 'flex flex-col animate-slide-in-right' : 'hidden'}
                md:flex-col
            `}>
                <ChatWindow />
            </div>

            {/* Right Profile Drawer */}
            <UserProfileDrawer />

            {/* ── Mobile: Fixed bottom navigation ── */}
            <BottomNav />

            {/* ── Toast notifications (fixed overlay) ── */}
            <ToastNotifications />
        </div>
    )
}

export default ChatPage
