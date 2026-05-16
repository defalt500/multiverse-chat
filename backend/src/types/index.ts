// Shared TypeScript interfaces for Multiverse Chat backend
// These mirror the Firestore document structure

import { Request } from 'express'
import { Timestamp } from 'firebase-admin/firestore'

// ─── Firestore Document Types ─────────────────────────────────────────────────

export interface DbUser {
    userId: string
    username: string
    email: string
    profilePhotoUrl: string
    bio?: string
    phone?: string
    role: 'user' | 'admin'
    createdAt: Timestamp
    lastActive: Timestamp
    isOnline: boolean
}

export interface DbMessage {
    messageId: string
    senderId: string
    senderName: string
    content: string
    timestamp: Timestamp
    isDeleted: boolean
    status: 'sent' | 'delivered' | 'read'
}

export interface DbConversation {
    conversationId: string
    participants: string[]          // array of userIds
    type: 'user' | 'ai'
    aiCharacterId?: string
    aiType?: 'math' | 'psychology' | 'finance'
    lastMessage: string
    lastMessageTime: Timestamp
    createdAt: Timestamp
}

export interface DbContact {
    requestId: string
    fromUserId: string
    toUserId: string
    status: 'pending' | 'accepted' | 'rejected'
    createdAt: Timestamp
    updatedAt: Timestamp
}

export interface DbAiCharacter {
    characterId: string
    name: string
    personality: string
    systemPrompt: string
    avatarUrl: string
    createdAt: Timestamp
}

// ─── API Response Types ───────────────────────────────────────────────────────

/** Normalized user returned to the frontend */
export interface ApiUser {
    id: string
    name: string
    email: string
    avatar: string
    status: 'online' | 'offline' | 'away'
    bio?: string
    phone?: string
    role?: string
}

/** Normalized message returned to the frontend */
export interface ApiMessage {
    id: string
    conversationId: string
    senderId: string
    senderName: string
    content: string
    type: 'text'
    timestamp: string
    status: 'sent' | 'delivered' | 'read'
    isDeleted: boolean
}

/** Normalized conversation returned to the frontend */
export interface ApiConversation {
    id: string
    name: string
    avatar: string
    lastMessage: string
    lastMessageTime: string
    isOnline: boolean
    isTyping: boolean
    isGroup: boolean
    type: 'user' | 'ai'
    aiCharacterId?: string
    aiType?: 'math' | 'psychology' | 'finance'
    participants: string[]
    messages: ApiMessage[]
}

export interface ApiAiCharacter {
    id: string
    name: string
    personality: string
    avatarUrl: string
}

// ─── Contact Request ──────────────────────────────────────────────────────────

export interface ApiContactRequest {
    requestId: string
    fromUser: ApiUser
    status: 'pending' | 'accepted' | 'rejected'
    createdAt: string
}

// ─── Express Extensions ───────────────────────────────────────────────────────

/** Extended Request with authenticated user attached by authMiddleware */
export interface AuthRequest extends Request {
    user?: {
        uid: string
        email: string
    }
}
