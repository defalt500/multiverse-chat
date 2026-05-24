// All TypeScript interfaces for Multiverse Chat

export interface User {
    id: string
    name: string
    email: string
    avatar: string
    status: 'online' | 'offline' | 'away'
    role?: 'admin' | 'user'
    bio?: string
    location?: string
    phone?: string
    nickname?: string
}

export interface Message {
    id: string
    conversationId: string
    senderId: string
    senderName: string
    content: string
    type: 'text'
    timestamp: string
    status?: 'sent' | 'delivered' | 'read'
}

export interface Conversation {
    id: string
    name: string
    avatar: string
    lastMessage: string
    lastMessageTime: string
    lastAt?: number          // epoch ms — used for sorting by recency
    unreadCount: number
    isOnline: boolean
    isTyping: boolean
    isGroup: boolean
    messages: Message[]
    // AI conversation metadata
    type?: 'user' | 'ai'
    aiCharacterId?: string
    participants?: string[]
}

export type ActiveView = 'chats' | 'profile' | 'contacts' | 'settings' | 'add-contact'

export interface ContactRequest {
    requestId: string
    fromUser: User
    createdAt: string
}

export type NotificationType = 'contact_request' | 'message'

export interface AppNotification {
    id: string
    type: NotificationType
    title: string
    body: string
    createdAt: string
    read: boolean
    /** For contact_request: the requestId. For message: the conversationId */
    referenceId?: string
    fromUser?: User
}
