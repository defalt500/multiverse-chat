import { useRef, useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Avatar from '../ui/Avatar'
import MessageBubble from '../chat/MessageBubble'
import MessageInput from '../chat/MessageInput'
import TypingIndicator from '../chat/TypingIndicator'
import { fetchApi } from '../../api'

const ChatWindow = () => {
    const {
        conversations, activeConversationId, setActiveConversation,
        openRightPanel, currentUser, typingState,
    } = useAppStore()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const searchInputRef = useRef<HTMLInputElement>(null)

    const conversation = conversations.find((c) => c.id === activeConversationId)

    // Determine if someone else is typing in this conversation
    const typingUsers = activeConversationId
        ? Array.from(typingState[activeConversationId] ?? []).filter(id => id !== currentUser?.id)
        : []
    const someoneIsTyping = typingUsers.length > 0

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversation?.messages])

    // Focus search input when it opens
    useEffect(() => {
        if (searchOpen) searchInputRef.current?.focus()
        else setSearchQuery('')
    }, [searchOpen])

    const handleHeaderClick = async () => {
        if (!conversation) return
        try {
            const res = await fetchApi(`/conversations/${conversation.id}`)
            const otherUserId = res?.conversation?.participants?.find((id: string) => id !== currentUser?.id)
            if (otherUserId) {
                const userRes = await fetchApi(`/users/${otherUserId}`)
                if (userRes?.user) {
                    openRightPanel(userRes.user)
                    return
                }
            }
        } catch { /* fallback below */ }

        openRightPanel({
            id: conversation.id,
            name: conversation.name,
            avatar: conversation.avatar,
            email: '',
            status: conversation.isOnline ? 'online' as const : 'offline' as const,
        })
    }

    // Mobile back — clear active conversation to show list
    const handleMobileBack = () => {
        setActiveConversation(null)
        setSearchOpen(false)
    }

    // Filter messages by search query
    const displayedMessages = conversation?.messages ?? []
    const filteredMessages = searchQuery.trim()
        ? displayedMessages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : displayedMessages

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col bg-gray-bg dark:bg-dark-panel min-w-0 hidden md:flex">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center px-6">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">Multiverse Chat</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Selecciona una conversación para empezar</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-bg dark:bg-dark-panel min-w-0 overflow-hidden">
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-dark-sidebar border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    {/* Mobile: back arrow */}
                    <button
                        onClick={handleMobileBack}
                        className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors flex-shrink-0"
                        aria-label="Volver"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Clickable header → opens profile */}
                    <button
                        onClick={handleHeaderClick}
                        className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity text-left"
                        title="Ver perfil"
                    >
                        <Avatar src={conversation.avatar} name={conversation.name} size="sm" isOnline={conversation.isOnline} />
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-800 dark:text-white text-sm leading-tight truncate">
                                {conversation.name}
                            </h3>
                            <p className={`text-xs ${conversation.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                {someoneIsTyping ? 'escribiendo...' : conversation.isOnline ? 'En línea' : 'Desconectado'}
                            </p>
                        </div>
                    </button>
                </div>

                {/* Right actions: search */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => setSearchOpen(v => !v)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${searchOpen ? 'bg-primary text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'}`}
                        title="Buscar en conversación"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Search bar ── */}
            <div className={`overflow-hidden transition-all duration-200 ease-in-out flex-shrink-0 ${searchOpen ? 'max-h-16' : 'max-h-0'}`}>
                <div className="px-4 py-2 bg-white dark:bg-dark-sidebar border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 bg-gray-bg dark:bg-dark-card rounded-xl px-3 py-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar mensajes..."
                            className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Search results count */}
            {searchQuery.trim() && (
                <div className="px-4 py-1 bg-white dark:bg-dark-sidebar border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <p className="text-xs text-gray-400">
                        {filteredMessages.length === 0
                            ? 'No se encontraron mensajes'
                            : `${filteredMessages.length} mensaje${filteredMessages.length !== 1 ? 's' : ''} encontrado${filteredMessages.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
            )}

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 flex flex-col gap-2.5">
                {/* Date separator */}
                {!searchQuery.trim() && (
                    <div className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                        <span className="text-xs text-gray-400 dark:text-gray-400 font-medium px-2 bg-gray-100 dark:bg-dark-card rounded-full py-0.5 border border-gray-200 dark:border-gray-600">
                            Hoy
                        </span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                    </div>
                )}

                {filteredMessages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} highlight={searchQuery.trim() || undefined} />
                ))}

                {someoneIsTyping && !searchQuery && <TypingIndicator name={conversation.name} avatar={conversation.avatar} />}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <MessageInput conversationId={conversation.id} />
        </div>
    )
}

export default ChatWindow
