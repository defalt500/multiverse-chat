// Conversation service — Firestore CRUD for the 'conversations' collection

import { db } from '../config/firebase'
import { DbConversation, DbUser, ApiConversation } from '../types'
import { getMessages } from './messageService'
import admin from 'firebase-admin'

const CONVS = 'conversations'

/** Convert a Firestore conversation doc to ApiConversation shape (exported for controller use) */
export async function toApiConversation(
    doc: DbConversation,
    currentUid: string
): Promise<ApiConversation> {
    // Get the other participant's info (for 1-1 chats)
    let name = 'Unknown'
    let avatar = ''
    let isOnline = false

    if (doc.type === 'ai' && doc.aiCharacterId) {
        const charSnap = await db.collection('aiCharacters').doc(doc.aiCharacterId).get()
        if (charSnap.exists) {
            const char = charSnap.data()!
            name = char.name
            avatar = char.avatarUrl
            isOnline = true
        }
    } else {
        const otherUid = doc.participants.find((p) => p !== currentUid)
        if (otherUid) {
            const userSnap = await db.collection('users').doc(otherUid).get()
            if (userSnap.exists) {
                const user = userSnap.data() as DbUser
                name = user.username
                avatar = user.profilePhotoUrl || ''
                isOnline = user.isOnline
            }
        }
    }

    // Fetch recent messages
    const messages = await getMessages(doc.conversationId, 50)

    return {
        id: doc.conversationId,
        name,
        avatar,
        lastMessage: doc.lastMessage || '',
        lastMessageTime: doc.lastMessageTime
            ? doc.lastMessageTime.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : '',
        isOnline,
        isTyping: false,
        isGroup: false,
        type: doc.type,
        aiCharacterId: doc.aiCharacterId,
        aiType: doc.aiType,
        participants: doc.participants,
        messages,
    }
}

/** Get all conversations for a user, sorted by lastMessageTime desc */
export async function getConversationsByUser(uid: string): Promise<ApiConversation[]> {
    // 1. Ensure the user has the mandatory AI bots
    await ensureUserAiConversations(uid)

    // NOTE: Do NOT add orderBy here — it requires a composite Firestore index.
    // We sort in memory after fetching.
    const snap = await db
        .collection(CONVS)
        .where('participants', 'array-contains', uid)
        .limit(50)
        .get()

    const results = await Promise.all(
        snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => toApiConversation(d.data() as DbConversation, uid))
    )

    // Sort newest first (by lastMessageTime) in memory
    results.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return b.lastMessageTime.localeCompare(a.lastMessageTime)
    })

    return results
}

/** Find an existing 1-1 conversation or create a new one */
export async function getOrCreateConversation(
    uid1: string,
    uid2: string
): Promise<DbConversation> {
    // Look for existing conversation with both participants
    const snap = await db
        .collection(CONVS)
        .where('participants', 'array-contains', uid1)
        .where('type', '==', 'user')
        .get()

    const existing = snap.docs.find((d: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = d.data() as DbConversation
        return data.participants.includes(uid2) && data.participants.length === 2
    })

    if (existing) return existing.data() as DbConversation

    // Create new conversation
    const conversationId = db.collection(CONVS).doc().id
    const now = admin.firestore.Timestamp.now()
    const newConv: DbConversation = {
        conversationId,
        participants: [uid1, uid2],
        type: 'user',
        lastMessage: '',
        lastMessageTime: now,
        createdAt: now,
    }
    await db.collection(CONVS).doc(conversationId).set(newConv)
    return newConv
}

/** Create a new AI conversation with a specific character */
export async function createAiConversation(
    uid: string,
    characterId: string
): Promise<DbConversation> {
    const conversationId = db.collection(CONVS).doc().id
    const now = admin.firestore.Timestamp.now()
    const newConv: DbConversation = {
        conversationId,
        participants: [uid],
        type: 'ai',
        aiCharacterId: characterId,
        aiType: characterId as 'math' | 'psychology' | 'finance',
        lastMessage: '',
        lastMessageTime: now,
        createdAt: now,
    }
    await db.collection(CONVS).doc(conversationId).set(newConv)
    return newConv
}

/** Ensure the user has all mandatory AI chatbot conversations */
export async function ensureUserAiConversations(uid: string) {
    const requiredTypes = ['math', 'psychology', 'finance']

    // Check existing AI conversations for this user
    const snap = await db
        .collection(CONVS)
        .where('participants', 'array-contains', uid)
        .where('type', '==', 'ai')
        .get()

    const existingTypes = new Set(
        snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => {
            const data = d.data() as DbConversation
            return data.aiType || data.aiCharacterId
        })
    )

    // Create any missing ones
    for (const charType of requiredTypes) {
        if (!existingTypes.has(charType)) {
            await createAiConversation(uid, charType)
        }
    }
}

/** Update lastMessage and lastMessageTime after a new message */
export async function updateLastMessage(
    convId: string,
    content: string
): Promise<void> {
    await db.collection(CONVS).doc(convId).update({
        lastMessage: content,
        lastMessageTime: admin.firestore.Timestamp.now(),
    })
}

/** Get a single conversation by ID */
export async function getConversationById(convId: string): Promise<DbConversation | null> {
    const snap = await db.collection(CONVS).doc(convId).get()
    if (!snap.exists) return null
    return snap.data() as DbConversation
}

/** Delete a conversation and all its messages */
export async function deleteConversation(convId: string, uid: string): Promise<void> {
    const conv = await getConversationById(convId)
    if (!conv) throw new Error('Conversation not found')
    if (!conv.participants.includes(uid)) throw new Error('Unauthorized')

    // Delete all messages in subcollection
    const msgSnap = await db.collection(CONVS).doc(convId).collection('messages').get()
    const batch = db.batch()
    msgSnap.docs.forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => batch.delete(d.ref))
    batch.delete(db.collection(CONVS).doc(convId))
    await batch.commit()
}
