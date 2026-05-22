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
    loadMessages: (conversationId: string) => Promise<void>
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

            setActiveConversation: (id) => {
                set({ activeConversationId: id })
                if (id) {
                    get().loadMessages(id)
                    // Join socket room for real-time messages
                    import('../socket').then(({ joinConversation }) => joinConversation(id))
                }
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
                })
            },

            // ── API actions ───────────────────────────────────────────────────
            loadConversations: async () => {
                try {
                    const res = await fetchApi('/conversations')
                    if (res?.conversations) {
                        set({ conversations: res.conversations })
                    }
                } catch (e) {
                    console.error('Failed to load conversations', e)
                }
            },

            loadMessages: async (conversationId: string) => {
                try {
                    const res = await fetchApi(`/messages/${conversationId}`)
                    if (res?.messages) {
                        set((state) => ({
                            conversations: state.conversations.map(conv =>
                                conv.id === conversationId ? { ...conv, messages: res.messages } : conv
                            )
                        }))
                    }
                } catch (e) {
                    console.error('Failed to load messages', e)
                }
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
                const optimisticMsg = {
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

                        // Skip if exact id already exists
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
                        }
                        convs[idx] = updated
                    }

                    // Add notification if message is from someone else
                    const newNotifs = [...state.notifications]
                    if (message.senderId !== currentUser?.id) {
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
                    // Clear AI generating indicator when AI message arrives
                    const newAIGenerating = { ...state.isAIGenerating }
                    if (message.senderId?.startsWith('ai-')) {
                        newAIGenerating[message.conversationId] = false
                    }
                    return { conversations: convs, notifications: newNotifs, isAIGenerating: newAIGenerating }
                })
            },

            // ── Notification / contact request actions ─────────────────────────
            loadPendingRequests: async () => {
                try {
                    const res = await fetchApi('/contacts/requests/pending')
                    if (res?.requests) {
                        const incoming: ContactRequest[] = res.requests
                        set((state) => {
                            // Find requests that don't have a notification yet
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
                    // Avoid duplicates
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
                    ].slice(0, 50), // cap at 50
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
        }),
        {
            name: 'multiverse-storage',
            partialize: (state) => ({ darkMode: state.darkMode }),
        }
    )
)
