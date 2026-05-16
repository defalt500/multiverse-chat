import { useEffect } from 'react'
import IconSidebar from '../components/layout/IconSidebar'
import ConversationPanel from '../components/layout/ConversationPanel'
import ChatWindow from '../components/layout/ChatWindow'
import BottomNav from '../components/layout/BottomNav'
import UserProfileDrawer from '../components/profile/UserProfileDrawer'
import { initSocket, joinConversation, getSocket } from '../socket'
import { useAppStore } from '../store/useAppStore'
import { getFirebaseAuth } from '../config/firebase'
import { setAuthToken } from '../api'

const ChatPage = () => {
    const { conversations, loadConversations, loadPendingRequests, activeConversationId } = useAppStore()

    useEffect(() => {
        let refreshTimer: ReturnType<typeof setInterval> | null = null
        let pollTimer: ReturnType<typeof setInterval> | null = null

        const boot = async () => {
            const socket = await initSocket()

            // Re-join all known conversation rooms
            if (socket) {
                conversations.forEach(c => joinConversation(c.id))
            }

            // Refresh data in case messages/requests were missed while offline
            loadConversations()
            loadPendingRequests()
        }

        boot()

        // Poll pending contact requests every 30s as a fallback for missed socket events
        pollTimer = setInterval(() => {
            loadPendingRequests()
        }, 30_000)

        // Refresh Firebase token every 50 min
        const scheduleTokenRefresh = () => {
            refreshTimer = setInterval(async () => {
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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Mobile: show conversation panel OR chat window depending on whether a chat is open
    const mobileShowChat = !!activeConversationId

    return (
        <div className="h-screen flex overflow-hidden bg-gray-bg dark:bg-dark-panel">
            {/* ── Desktop: Icon sidebar always visible ── */}
            <div className="hidden md:flex">
                <IconSidebar />
            </div>

            {/* ── Desktop: ConversationPanel always shown ── */}
            {/* ── Mobile: ConversationPanel shown only when no chat is active ── */}
            <div className={`
                md:flex flex-col flex-shrink-0
                ${mobileShowChat ? 'hidden' : 'flex w-full'}
                md:w-auto
            `}>
                <ConversationPanel />
            </div>

            {/* ── Desktop: ChatWindow always shown ── */}
            {/* ── Mobile: ChatWindow shown only when a chat is selected ── */}
            <div className={`
                md:flex flex-1 flex-col min-w-0
                ${mobileShowChat ? 'flex' : 'hidden'}
                md:flex
            `}>
                <ChatWindow />
            </div>

            {/* Right Profile Drawer */}
            <UserProfileDrawer />

            {/* ── Mobile: Fixed bottom navigation ── */}
            <BottomNav />
        </div>
    )
}

export default ChatPage
