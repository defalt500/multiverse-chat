import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Avatar from '../ui/Avatar'
import { User } from '../../types'
import { fetchApi } from '../../api'

interface PendingRequest {
    requestId: string
    fromUser: User
    createdAt: string
}

const ContactsView = () => {
    const { setActiveConversation, setActiveView, loadConversations } = useAppStore()
    const [tab, setTab] = useState<'contacts' | 'requests'>('contacts')
    const [search, setSearch] = useState('')
    const [contacts, setContacts] = useState<User[]>([])
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
    const [loadingChatFor, setLoadingChatFor] = useState<string | null>(null)
    const [loadingReqId, setLoadingReqId] = useState<string | null>(null)
    const [deletingContact, setDeletingContact] = useState<string | null>(null)

    const loadContacts = useCallback(async () => {
        try {
            const res = await fetchApi('/contacts')
            if (res?.contacts) setContacts(res.contacts)
        } catch (e) { console.error(e) }
    }, [])

    const loadPending = useCallback(async () => {
        try {
            const res = await fetchApi('/contacts/requests/pending')
            if (res?.requests) setPendingRequests(res.requests)
        } catch (e) { console.error(e) }
    }, [])

    useEffect(() => {
        loadContacts()
        loadPending()
    }, [loadContacts, loadPending])

    const handleRespond = async (requestId: string, accept: boolean) => {
        setLoadingReqId(requestId)
        try {
            const res = await fetchApi('/contacts/respond', {
                method: 'POST',
                body: JSON.stringify({ requestId, accept }),
            })
            // Remove from pending list
            setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId))
            if (accept) {
                // Reload contacts + conversations (conversation auto-created by backend)
                await loadContacts()
                await loadConversations()
                // If backend returned the conversationId, switch to it
                if (res?.conversationId) {
                    setActiveConversation(res.conversationId)
                    setActiveView('chats')
                }
            }
        } catch (e) { console.error(e) }
        finally { setLoadingReqId(null) }
    }

    const handleOpenChat = async (user: User) => {
        if (loadingChatFor) return   // prevent double-click
        setLoadingChatFor(user.id)
        try {
            const res = await fetchApi('/conversations', {
                method: 'POST',
                body: JSON.stringify({ participantId: user.id, type: 'user' }),
            })
            if (res?.conversation) {
                const conv = res.conversation
                // conv is now ApiConversation with .id, .name, .avatar already set
                const convId = conv.id || conv.conversationId

                // Switch view first so the user sees the chat pane
                setActiveView('chats')

                // Inject the conversation into the Zustand store immediately
                // so ChatWindow can find it before loadConversations completes
                useAppStore.setState((state) => {
                    const exists = state.conversations.find((c: any) => c.id === convId)
                    if (exists) return state
                    return {
                        conversations: [{ ...conv, id: convId, messages: [] }, ...state.conversations]
                    }
                })

                // Set active (triggers loadMessages)
                setActiveConversation(convId)

                // Then reload all conversations in background to sync list
                loadConversations()
            }
        } catch (e) { console.error('Failed to open chat', e) }
        finally { setLoadingChatFor(null) }
    }



    const handleDeleteContact = async (user: User) => {
        if (!window.confirm(`¿Eliminar a ${user.name} de tus contactos?`)) return
        setDeletingContact(user.id)
        try {
            await fetchApi(`/contacts/${user.id}`, { method: 'DELETE' })
            setContacts((prev) => prev.filter((c) => c.id !== user.id))
        } catch (e) { console.error('Failed to delete contact', e) }
        finally { setDeletingContact(null) }
    }

    const filteredContacts = contacts.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    )


    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Contactos</h2>
                    <button
                        onClick={() => setActiveView('add-contact')}
                        title="Add contact"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-bg dark:bg-dark-card rounded-xl p-1">
                    <button
                        onClick={() => setTab('contacts')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === 'contacts'
                            ? 'bg-white dark:bg-dark-panel text-primary shadow-sm'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        Contactos
                    </button>
                    <button
                        onClick={() => setTab('requests')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${tab === 'requests'
                            ? 'bg-white dark:bg-dark-panel text-primary shadow-sm'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        Solicitudes
                        {pendingRequests.length > 0 && (
                            <span className="w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* --- CONTACTS TAB --- */}
            {tab === 'contacts' && (
                <>
                    <div className="px-4 py-2 flex-shrink-0">
                        <div className="flex items-center gap-2 bg-gray-bg dark:bg-dark-card rounded-xl px-3 py-2">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar contactos..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2">
                        {filteredContacts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                                </svg>
                                <p className="text-sm">Aún no tienes contactos</p>
                                <button
                                    onClick={() => setActiveView('add-contact')}
                                    className="mt-2 text-xs text-primary hover:underline"
                                >Añadir a alguien</button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {filteredContacts.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleOpenChat(user)}
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-card transition-colors cursor-pointer group"
                                    >
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {loadingChatFor === user.id ? (
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <Avatar src={user.avatar} name={user.name} size="sm" isOnline={user.status === 'online'} />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>

                                        {/* Delete contact button */}
                                        <div
                                            onClick={(e) => { e.stopPropagation(); handleDeleteContact(user) }}
                                            title="Remove contact"
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0 ${deletingContact === user.id ? 'opacity-100 cursor-not-allowed text-red-400' : 'text-gray-300 dark:text-gray-600 cursor-pointer'}`}
                                        >
                                            {deletingContact === user.id ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </div>

                                        <div className="flex-shrink-0">
                                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* --- REQUESTS TAB --- */}
            {tab === 'requests' && (
                <div className="flex-1 overflow-y-auto px-2 py-2">
                    {pendingRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">No hay solicitudes pendientes</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {pendingRequests.map((req) => (
                                <div key={req.requestId} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-dark-card">
                                    <Avatar src={req.fromUser.avatar} name={req.fromUser.name} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{req.fromUser.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{req.fromUser.email}</p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => handleRespond(req.requestId, true)}
                                            disabled={loadingReqId === req.requestId}
                                            title="Accept"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleRespond(req.requestId, false)}
                                            disabled={loadingReqId === req.requestId}
                                            title="Reject"
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 transition-colors disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ContactsView
