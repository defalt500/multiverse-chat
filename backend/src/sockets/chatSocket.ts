// Socket.io event handler — all real-time chat functionality
//
// Events (client → server):
//   join_conversation   { conversationId }
//   send_message        { conversationId, content }
//   typing              { conversationId }
//   stop_typing         { conversationId }
//   message_delivered   { conversationId, messageId }
//   message_read        { conversationId, messageId }
//
// Events (server → client):
//   receive_message         { message: ApiMessage }
//   new_contact_request     { requestId, fromUser, createdAt }   → personal room
//   typing                  { conversationId, userId }
//   stop_typing             { conversationId, userId }
//   message_read            { conversationId, messageId }
//   error                   { error: string }

import { Server, Socket } from 'socket.io'
import { auth, db } from '../config/firebase'
import admin from 'firebase-admin'
import { setOnlineStatus, getUserById } from '../services/userService'
import { saveMessage } from '../services/messageService'
import { updateLastMessage, getConversationById } from '../services/conversationService'
import { updateMessageStatus } from '../services/messageService'
import { generateReplyForConversation } from '../services/aiService'
import { getCharacterById } from '../services/aiCharacterService'

/** Map of userId → socketId for routing AI replies and status */
const userSockets = new Map<string, string>()

let globalIo: Server | null = null

export function getIO(): Server {
    if (!globalIo) throw new Error('Socket.io not initialized')
    return globalIo
}

export function registerSocketHandlers(io: Server): void {
    globalIo = io

    // ── Authentication handshake ─────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token as string | undefined
            if (!token) return next(new Error('Missing auth token'))

            const decoded = await auth.verifyIdToken(token)
            // Attach user info to socket data for use in event handlers
            socket.data.uid = decoded.uid
            socket.data.email = decoded.email || ''
            next()
        } catch {
            next(new Error('Invalid or expired token'))
        }
    })

    io.on('connection', async (socket: Socket) => {
        const uid: string = socket.data.uid
        console.log(`🔌 Socket connected: ${socket.id} (uid: ${uid})`)

        // Join personal room — used for targeted events (new_contact_request, etc.)
        socket.join(uid)

        // Track socket and set user online
        userSockets.set(uid, socket.id)
        await setOnlineStatus(uid, true).catch(() => { })

        // ── Join a conversation room ─────────────────────────────────────────
        socket.on('join_conversation', ({ conversationId }: { conversationId: string }) => {
            if (!conversationId) return
            socket.join(conversationId)
        })

        // ── Send a message ───────────────────────────────────────────────────
        socket.on(
            'send_message',
            async ({ conversationId, content }: { conversationId: string; content: string }) => {
                if (!conversationId || !content?.trim()) return

                try {
                    // Get sender info for senderName
                    const sender = await getUserById(uid)
                    const senderName = sender?.name || 'User'

                    // 1. Persist message to Firestore
                    const message = await saveMessage(conversationId, uid, senderName, content.trim())

                    // 2. Update conversation's lastMessage
                    await updateLastMessage(conversationId, content.trim())

                    // 3. Broadcast to all participants in the room
                    io.to(conversationId).emit('receive_message', { message })

                    // 4. If this is an AI conversation, generate and send AI reply
                    const conv = await getConversationById(conversationId)
                    const aiId = conv?.aiType || conv?.aiCharacterId
                    if (conv?.type === 'ai' && aiId) {
                        await handleAiReply(io, conversationId, aiId, content.trim())
                    }
                } catch (err) {
                    const errMsg = err instanceof Error ? err.message : 'Failed to send message'
                    socket.emit('error', { error: errMsg })
                }
            }
        )

        // ── Typing indicators ────────────────────────────────────────────────
        socket.on('typing', ({ conversationId }: { conversationId: string }) => {
            if (!conversationId) return
            socket.to(conversationId).emit('typing', { conversationId, userId: uid })
        })

        socket.on('stop_typing', ({ conversationId }: { conversationId: string }) => {
            if (!conversationId) return
            socket.to(conversationId).emit('stop_typing', { conversationId, userId: uid })
        })

        // ── Delivery / read receipts ─────────────────────────────────────────
        socket.on(
            'message_delivered',
            async ({
                conversationId,
                messageId,
            }: {
                conversationId: string
                messageId: string
            }) => {
                if (!conversationId || !messageId) return
                await updateMessageStatus(conversationId, messageId, 'delivered').catch(() => { })
            }
        )

        socket.on(
            'message_read',
            async ({
                conversationId,
                messageId,
            }: {
                conversationId: string
                messageId: string
            }) => {
                if (!conversationId || !messageId) return
                await updateMessageStatus(conversationId, messageId, 'read').catch(() => { })
                // Notify the conversation room that the message was read
                io.to(conversationId).emit('message_read', { conversationId, messageId, readBy: uid })
            }
        )

        // ── Disconnect ───────────────────────────────────────────────────────
        socket.on('disconnect', async () => {
            console.log(`🔌 Socket disconnected: ${socket.id} (uid: ${uid})`)
            userSockets.delete(uid)
            await setOnlineStatus(uid, false).catch(() => { })
        })
    })

    // Auto-offline: every 60s mark users offline if lastActive > 60s ago
    const AUTO_OFFLINE_INTERVAL = 60_000   // 1 minute
    setInterval(async () => {
        const cutoff = Date.now() - AUTO_OFFLINE_INTERVAL
        const cutoffTs = admin.firestore.Timestamp.fromMillis(cutoff)
        try {
            const staleSnap = await db
                .collection('users')
                .where('isOnline', '==', true)
                .where('lastActive', '<', cutoffTs)
                .get()
            const batch = db.batch()
            staleSnap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                batch.update(doc.ref, { isOnline: false })
            })
            if (!staleSnap.empty) await batch.commit()
        } catch { /* non-fatal */ }
    }, AUTO_OFFLINE_INTERVAL)
}

// ── AI Reply Helper ──────────────────────────────────────────────────────────

/** Generate an AI reply and emit it to the conversation room */
async function handleAiReply(
    io: Server,
    conversationId: string,
    characterId: string,
    userMessage: string
): Promise<void> {
    try {
        const character = await getCharacterById(characterId)
        if (!character) return

        const aiUid = `ai-${characterId}`

        console.log("AI request:", userMessage, aiUid);

        // Signal that the AI is "typing" while generating
        io.to(conversationId).emit('typing', { conversationId, userId: aiUid })

        // Generate the reply using Gemini
        let replyContent = '';
        try {
            replyContent = await generateReplyForConversation(
                conversationId,
                character.systemPrompt,
                userMessage,
                aiUid
            )
            console.log("AI response:", replyContent);
        } catch (error) {
            console.error("Gemini error:", error);
            // Fallback response explicitly requested by user
            replyContent = "Lo siento, no pude generar una respuesta en este momento.";
        }

        // Stop the typing indicator
        io.to(conversationId).emit('stop_typing', { conversationId, userId: aiUid })

        if (!replyContent) return

        // Persist the AI's message
        const aiMessage = await saveMessage(conversationId, aiUid, character.name, replyContent)
        await updateLastMessage(conversationId, replyContent)

        // Send to everyone in the conversation room
        io.to(conversationId).emit('receive_message', { message: aiMessage })
    } catch (err) {
        console.error('AI reply error:', err)
        // Gracefully fail — don't crash the socket handler
    }
}
