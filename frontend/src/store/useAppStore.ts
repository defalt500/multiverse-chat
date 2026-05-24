import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Conversation, User, ActiveView, Message, ContactRequest, AppNotification } from '../types'
import { fetchApi } from '../api'

interface AppState {
    currentUser: User | null
    conversations: Conversation[]
    activeConversationId: string | null
    activeView: ActiveView
    darkMode: boolean
    searchQuery: string
    rightPanelUser: User | null
    sidebarOpen: boolean

    // Notifications
    notifications: AppNotification[]
    contactRequests: ContactRequest[]
    /** conversationId → Set of userIds currently typing */
    typingState: Record<string, Set<string>>
    /** conversationId → true while AI is generating a reply */
    isAIGenerating: Record<string, boolean>

    /** Track which conversations have had messages loaded at least once */
    messagesLoadedFor: Set<string>
    /** Track in-flight loadMessages to prevent concurrent duplicate fetches */
    loadingMessages: Set<string>

    setActiveConversation: (id: string | null) => void
    setActiveView: (view: ActiveView) => void
    toggleDarkMode: () => void
    setSearchQuery: (q: string) => void
    openRightPanel: (user: User) => void
    closeRightPanel: () => void
    setSidebarOpen: (open: boolean) => void
    updateCurrentUser: (user: Partial<User>) => void
    logout: () => void

    // Real-time actions
    loadConversations: () => Promise<void>
    loadMessages: (conversationId: string, force?: boolean) => Promise<void>
    sendMessage: (conversationId: string, content: string) => Promise<void>
    receiveMessage: (message: Message) => void

    // Notification actions
    loadPendingRequests: () => Promise<void>
    addContactRequest: (req: ContactRequest) => void
    removeContactRequest: (requestId: string) => void
    pushNotification: (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
    markNotificationsRead: () => void
    clearNotifications: () => void
    setTyping: (conversationId: string, userId: string, isTyping: boolean) => void
    setAIGenerating: (conversationId: string, generating: boolean) => void

    // Presence
    updateConversationPresence: (userId: string, isOnline: boolean) => void
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            conversations: [],
            activeConversationId: null,
            activeView: 'chats',
            darkMode: false,
            searchQuery: '',
            rightPanelUser: null,
            sidebarOpen: false,
            notifications: [],
            contactRequests: [],
            typingState: {},
            isAIGenerating: {},
            messagesLoadedFor: new Set(),
            loadingMessages: new Set(),

            setActiveConversation: (id) => {
                const prev = get().activeConversationId
                set({ activeConversationId: id })

                if (id) {
                    // Reset unread count when opening a conversation
                    set((state) => ({
                        conversations: state.conversations.map(c =>
                            c.id === id ? { ...c, unreadCount: 0 } : c
                        )
                    }))

                    // Always refresh messages when switching conversations
                    get().loadMessages(id, true)

                    // Join socket room for real-time messages
                    import('../socket').then(({ joinConversation }) => joinConversation(id))
                }
                // Suppress unused variable warning
                void prev
            },
            setActiveView: (view) => set({ activeView: view }),
            toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
            setSearchQuery: (q) => set({ searchQuery: q }),
            openRightPanel: (user) => set({ rightPanelUser: user }),
            closeRightPanel: () => set({ rightPanelUser: null }),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            updateCurrentUser: (updates) =>
                set((state) => ({
                    currentUser: state.currentUser ? { ...state.currentUser, ...updates } : (updates as User)
                })),
            logout: () => {
                localStorage.removeItem('firebase_token')
                set({
                    currentUser: null,
                    conversations: [],
                    activeView: 'chats',
                    activeConversationId: null,
                    rightPanelUser: null,
                    sidebarOpen: false,
                    searchQuery: '',
                    notifications: [],
                    contactRequests: [],
                    typingState: {},
                    messagesLoadedFor: new Set(),
                    loadingMessages: new Set(),
                })
            },

            // ── API actions ───────────────────────────────────────────────────
            loadConversations: async () => {
                try {
                    const res = await fetchApi('/conversations')
                    if (res?.conversations) {
                        set((state) => {
                            // Merge fresh conversation list with existing messages
                            // so we don't lose already-loaded message arrays
                            const existingMap = new Map(state.conversations.map(c => [c.id, c]))
                            const merged = res.conversations.map((fresh: Conversation) => {
                                const existing = existingMap.get(fresh.id)
                                if (existing && existing.messages.length > 0) {
                                    // Preserve loaded messages; update metadata
                                    return {
                                        ...fresh,
                                        messages: existing.messages,
                                        unreadCount: state.activeConversationId === fresh.id
                                            ? 0
                                            : fresh.unreadCount ?? existing.unreadCount,
                                    }
                                }
                                return { ...fresh, messages: fresh.messages ?? [] }
                            })
                            return { conversations: merged }
                        })
                    }
                } catch (e) {
                    console.error('Failed to load conversations', e)
                }
            },

            loadMessages: async (conversationId: string, force = false) => {
                const state = get()

                // Skip if already loading this conversation's messages
                if (state.loadingMessages.has(conversationId)) return

                // Skip if already loaded and not forced
                if (!force && state.messagesLoadedFor.has(conversationId)) return

                // Mark as loading
                set((s) => ({ loadingMessages: new Set([...s.loadingMessages, conversationId]) }))

                // Retry up to 3 times on failure (handles transient token/network issues)
                let lastError: unknown = null
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        const res = await fetchApi(`/messages/${conversationId}`)
                        if (res?.messages) {
                            set((s) => {
                                // Merge: keep any in-memory messages that Firestore doesn't have yet
                                // (race condition: sent just before fetch completed)
                                const existing = s.conversations.find(c => c.id === conversationId)
                                const existingMsgs = existing?.messages ?? []
                                const serverIds = new Set(res.messages.map((m: Message) => m.id))

                                // Messages in memory that server doesn't have yet (very recent sends)
                                const memOnly = existingMsgs.filter(m =>
                                    !serverIds.has(m.id) && !m.id.startsWith('temp-')
                                )

                                // Remove temp messages — server has the real ones now
                                const merged = [...res.messages, ...memOnly]
                                    .sort((a, b) => a.timestamp < b.timestamp ? -1 : 1)

                                const newLoaded = new Set([...s.messagesLoadedFor, conversationId])
                                const newLoading = new Set([...s.loadingMessages])
                                newLoading.delete(conversationId)

                                return {
                                    conversations: s.conversations.map(c =>
                                        c.id === conversationId
                                            ? { ...c, messages: merged }
                                            : c
                                    ),
                                    messagesLoadedFor: newLoaded,
                                    loadingMessages: newLoading,
                                }
                            })
                            return // Success
                        }
                        break
                    } catch (e) {
                        lastError = e
                        if (attempt < 3) {
                            // Wait before retry: 500ms, 1000ms
                            await new Promise(resolve => setTimeout(resolve, attempt * 500))
                        }
                    }
                }

                // All retries failed — remove from loading set so user can retry
                set((s) => {
                    const newLoading = new Set([...s.loadingMessages])
                    newLoading.delete(conversationId)
                    return { loadingMessages: newLoading }
                })
                console.error(`Failed to load messages for ${conversationId} after 3 attempts:`, lastError)
            },

            sendMessage: async (conversationId: string, content: string) => {
                const { currentUser, conversations } = get()
                if (!currentUser) return

                // Check if this is an AI conversation before sending
                const conv = conversations.find(c => c.id === conversationId)
                const isAIConv = conv && !conv.isGroup && conv.messages.some(
                    m => m.senderId !== currentUser.id && m.senderId?.startsWith('ai-')
                )
                // Immediately show the AI thinking indicator
                if (isAIConv) {
                    set((state) => ({ isAIGenerating: { ...state.isAIGenerating, [conversationId]: true } }))
                }

                // Optimistic update — show message instantly without waiting for server
                const tempId = `temp-${Date.now()}-${Math.random()}`
                const optimisticMsg: Message = {
                    id: tempId,
                    conversationId,
                    senderId: currentUser.id,
                    senderName: currentUser.name,
                    content,
                    type: 'text' as const,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'sent' as const,
                }
                set((state) => ({
                    conversations: state.conversations.map(conv =>
                        conv.id === conversationId
                            ? {
                                ...conv,
                                messages: [...(conv.messages || []), optimisticMsg],
                                lastMessage: content,
                                lastMessageTime: optimisticMsg.timestamp,
                                lastAt: Date.now(),
                            }
                            : conv
                    )
                }))

                try {
                    await fetchApi('/messages', {
                        method: 'POST',
                        body: JSON.stringify({ conversationId, content })
                    })
                    // Note: the server also emits receive_message via socket which will
                    // replace the temp message via receiveMessage(). No manual replacement needed.
                } catch (e) {
                    // Remove optimistic message on failure
                    set((state) => ({
                        conversations: state.conversations.map(conv =>
                            conv.id === conversationId
                                ? { ...conv, messages: (conv.messages || []).filter(m => m.id !== tempId) }
                                : conv
                        )
                    }))
                    console.error('Failed to send message', e)
                }
            },

            receiveMessage: (message: Message) => {
                const { currentUser } = get()
                set((state) => {
                    const convs = [...state.conversations]
                    const idx = convs.findIndex(c => c.id === message.conversationId)

                    if (idx > -1) {
                        const updated = { ...convs[idx] }
                        if (!updated.messages) updated.messages = []

                        // Skip if exact id already exists (dedup)
                        const alreadyExists = updated.messages.find(m => m.id === message.id)
                        if (!alreadyExists) {
                            // Remove optimistic temp message with same content+sender (avoids duplicate)
                            const withoutTemp = updated.messages.filter(m =>
                                !(m.id.startsWith('temp-') &&
                                    m.senderId === message.senderId &&
                                    m.content === message.content)
                            )
                            updated.messages = [...withoutTemp, message]
                            updated.lastMessage = message.content
                            updated.lastMessageTime = message.timestamp
                            updated.lastAt = Date.now()

                            // Increment unread count only for messages from others in non-active conversations
                            const isActive = state.activeConversationId === message.conversationId
                            const isFromMe = message.senderId === currentUser?.id
                            if (!isActive && !isFromMe) {
                                updated.unreadCount = (updated.unreadCount || 0) + 1
                            }
                        }
                        convs[idx] = updated
                    }

                    // Add notification if message is from someone else
                    const newNotifs = [...state.notifications]
                    if (message.senderId !== currentUser?.id) {
                        // Only add notification if not already there for this message
                        const alreadyNotified = newNotifs.find(n => n.id === `msg-${message.id}`)
                        if (!alreadyNotified) {
                            const conv = state.conversations.find(c => c.id === message.conversationId)
                            newNotifs.unshift({
                                id: `msg-${message.id}`,
                                type: 'message',
                                title: message.senderName || 'New message',
                                body: message.content.length > 60 ? message.content.slice(0, 57) + '...' : message.content,
                                createdAt: new Date().toISOString(),
                                read: false,
                                referenceId: message.conversationId,
                                fromUser: conv ? { id: message.senderId, name: message.senderName, email: '', avatar: '', status: 'online' } : undefined,
                            })
                        }
                    }
                    // Clear AI generating indicator when AI message arrives
                    const newAIGenerating = { ...state.isAIGenerating }
                    if (message.senderId?.startsWith('ai-')) {
                        newAIGenerating[message.conversationId] = false
                    }
                    return { conversations: convs, notifications: newNotifs.slice(0, 50), isAIGenerating: newAIGenerating }
                })
            },

            // ── Notification / contact request actions ─────────────────────────
            loadPendingRequests: async () => {
                try {
                    const res = await fetchApi('/contacts/requests/pending')
                    if (res?.requests) {
                        const incoming: ContactRequest[] = res.requests
                        set((state) => {
                            const existingNotifIds = new Set(state.notifications.map(n => n.referenceId))
                            const newNotifs = incoming
                                .filter(r => !existingNotifIds.has(r.requestId))
                                .map(r => ({
                                    id: `req-${r.requestId}`,
                                    type: 'contact_request' as const,
                                    title: r.fromUser?.name || 'Someone',
                                    body: 'sent you a contact request',
                                    createdAt: r.createdAt || new Date().toISOString(),
                                    read: false,
                                    referenceId: r.requestId,
                                    fromUser: r.fromUser,
                                }))
                            return {
                                contactRequests: incoming,
                                notifications: newNotifs.length
                                    ? [...newNotifs, ...state.notifications]
                                    : state.notifications,
                            }
                        })
                    }
                } catch (e) {
                    console.error('Failed to load pending requests', e)
                }
            },

            addContactRequest: (req: ContactRequest) => {
                set((state) => {
                    if (state.contactRequests.find(r => r.requestId === req.requestId)) return state
                    return {
                        contactRequests: [req, ...state.contactRequests],
                        notifications: [
                            {
                                id: `req-${req.requestId}`,
                                type: 'contact_request',
                                title: req.fromUser?.name || 'Someone',
                                body: 'sent you a contact request',
                                createdAt: req.createdAt || new Date().toISOString(),
                                read: false,
                                referenceId: req.requestId,
                                fromUser: req.fromUser,
                            },
                            ...state.notifications,
                        ],
                    }
                })
            },

            removeContactRequest: (requestId: string) => {
                set((state) => ({
                    contactRequests: state.contactRequests.filter(r => r.requestId !== requestId),
                }))
            },

            pushNotification: (notif) => {
                set((state) => ({
                    notifications: [
                        {
                            ...notif,
                            id: `notif-${Date.now()}`,
                            read: false,
                            createdAt: new Date().toISOString(),
                        },
                        ...state.notifications,
                    ].slice(0, 50),
                }))
            },

            markNotificationsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map(n => ({ ...n, read: true })),
                }))
            },

            clearNotifications: () => set({ notifications: [] }),

            setTyping: (conversationId: string, userId: string, isTyping: boolean) => {
                set((state) => {
                    const prev = state.typingState[conversationId]
                    const next = new Set(prev)
                    if (isTyping) {
                        next.add(userId)
                    } else {
                        next.delete(userId)
                    }
                    return { typingState: { ...state.typingState, [conversationId]: next } }
                })
            },

            setAIGenerating: (conversationId: string, generating: boolean) => {
                set((state) => ({ isAIGenerating: { ...state.isAIGenerating, [conversationId]: generating } }))
            },

            updateConversationPresence: (userId: string, isOnline: boolean) => {
                set((state) => ({
                    conversations: state.conversations.map(c =>
                        // The conversation "name" matches the other user — match by participant id
                        // We track presence on conversations by the other participant's id
                        c.id === userId
                            ? { ...c, isOnline }
                            : c
                    )
                }))
            },
        }),
        {
            name: 'multiverse-storage',
            // Only persist UI preferences — never persist messages or auth state
            partialize: (state) => ({ darkMode: state.darkMode }),
        }
    )
)
