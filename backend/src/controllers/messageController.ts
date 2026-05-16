// Message controller — message history and soft delete

import { Response } from 'express'
import { AuthRequest } from '../types'
import { getMessages, softDeleteMessage, saveMessage } from '../services/messageService'
import { getConversationById, updateLastMessage } from '../services/conversationService'
import { getUserById } from '../services/userService'
import { getIO } from '../sockets/chatSocket'
import { getCharacterById } from '../services/aiCharacterService'
import { generateReplyForConversation } from '../services/aiService'

/**
 * GET /api/messages/:conversationId
 */
export async function listMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
        const conversationId = req.params['conversationId'] as string
        const limit = parseInt((req.query.limit as string) || '50', 10)

        const conv = await getConversationById(conversationId)
        if (!conv) {
            res.status(404).json({ error: 'Conversation not found' })
            return
        }
        if (!conv.participants.includes(req.user!.uid)) {
            res.status(403).json({ error: 'Unauthorized' })
            return
        }

        const messages = await getMessages(conversationId, limit)
        res.json({ messages })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get messages'
        res.status(500).json({ error: message })
    }
}

/**
 * DELETE /api/messages/:conversationId/:messageId
 */
export async function deleteMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
        const conversationId = req.params['conversationId'] as string
        const messageId = req.params['messageId'] as string
        await softDeleteMessage(conversationId, messageId, req.user!.uid)
        res.json({ success: true })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete message'
        res.status(err instanceof Error && err.message === 'Unauthorized' ? 403 : 500).json({
            error: message,
        })
    }
}

/**
 * POST /api/messages
 * Body: { conversationId: string, content: string }
 */
export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { conversationId, content } = req.body
        if (!conversationId || !content?.trim()) {
            res.status(400).json({ error: 'Missing conversationId or content' })
            return
        }

        const uid = req.user!.uid
        const conv = await getConversationById(conversationId)
        if (!conv) {
            res.status(404).json({ error: 'Conversation not found' })
            return
        }
        if (!conv.participants.includes(uid)) {
            res.status(403).json({ error: 'Unauthorized' })
            return
        }

        const sender = await getUserById(uid)
        const senderName = sender?.name || 'User'

        const message = await saveMessage(conversationId, uid, senderName, content.trim())
        await updateLastMessage(conversationId, content.trim())

        // Emit user message via Socket.io
        try {
            getIO().to(conversationId).emit('receive_message', { message })
        } catch (e) {
            console.error('Socket not initialized or failed to emit', e)
        }

        // Respond to client immediately — AI runs in background
        res.json({ message })

        // ── AI Reply (async, after HTTP response) ───────────────────────────
        const aiId = conv.aiType || conv.aiCharacterId
        if (conv.type === 'ai' && aiId) {
            // Run in background so it doesn't block the HTTP response
            handleAiReply(conversationId, aiId, content.trim()).catch((err) =>
                console.error('[AI] handleAiReply error:', err)
            )
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send message'
        res.status(500).json({ error: msg })
    }
}

/** Generate and emit an AI reply for AI conversations */
async function handleAiReply(
    conversationId: string,
    characterId: string,
    userMessage: string
): Promise<void> {
    try {
        const character = await getCharacterById(characterId)
        if (!character) {
            console.error(`[AI] Character not found: ${characterId}`)
            return
        }

        const aiUid = `ai-${characterId}`
        console.log('[AI] Request →', characterId, ':', userMessage.slice(0, 60))

        // Signal "AI is thinking" to all users in this conversation room
        try {
            getIO().to(conversationId).emit('typing', { conversationId, userId: aiUid })
        } catch { /* non-fatal */ }

        let replyContent = ''
        try {
            replyContent = await generateReplyForConversation(
                conversationId,
                character.systemPrompt,
                userMessage,
                aiUid
            )
            console.log('[AI] Response ←', replyContent.slice(0, 80))
        } catch (genError) {
            console.error('[AI] Gemini generation error:', genError)
            replyContent = 'Lo siento, no pude generar una respuesta en este momento.'
        }

        // Stop typing indicator regardless of success/fail
        try {
            getIO().to(conversationId).emit('stop_typing', { conversationId, userId: aiUid })
        } catch { /* non-fatal */ }

        if (!replyContent) {
            console.warn('[AI] Empty response, skipping save/emit')
            return
        }

        // Save AI message to Firestore
        const aiMessage = await saveMessage(conversationId, aiUid, character.name, replyContent)
        await updateLastMessage(conversationId, replyContent)

        // Emit to everyone in the conversation room
        try {
            getIO().to(conversationId).emit('receive_message', { message: aiMessage })
            console.log('[AI] Emitted to room:', conversationId)
        } catch (socketErr) {
            console.error('[AI] Socket emit error:', socketErr)
        }
    } catch (err) {
        console.error('[AI] handleAiReply fatal error:', err)
    }
}
