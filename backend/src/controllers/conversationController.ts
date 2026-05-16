import { Response } from 'express'
import { AuthRequest } from '../types'
import {
    getConversationsByUser,
    getOrCreateConversation,
    createAiConversation,
    deleteConversation,
    getConversationById,
    toApiConversation,
} from '../services/conversationService'

/**
 * GET /api/conversations
 */
export async function listConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
        const conversations = await getConversationsByUser(req.user!.uid)
        res.json({ conversations })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get conversations'
        res.status(500).json({ error: message })
    }
}

/**
 * POST /api/conversations
 * Body: { participantId?: string, type?: 'user'|'ai', aiCharacterId?: string }
 */
export async function startConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { participantId, type = 'user', aiCharacterId } = req.body
        const uid = req.user!.uid

        if (type === 'ai') {
            if (!aiCharacterId) {
                res.status(400).json({ error: 'aiCharacterId is required for AI conversations' })
                return
            }
            const conv = await createAiConversation(uid, aiCharacterId as string)
            res.json({ conversation: conv })
            return
        }

        if (!participantId) {
            res.status(400).json({ error: 'participantId is required for user conversations' })
            return
        }

        const conv = await getOrCreateConversation(uid, participantId as string)
        // Return the full ApiConversation so frontend has correct id, name, avatar immediately
        const apiConv = await toApiConversation(conv, uid)
        res.json({ conversation: apiConv })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create conversation'
        res.status(500).json({ error: message })
    }
}

/**
 * DELETE /api/conversations/:id
 */
export async function removeConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        await deleteConversation(id, req.user!.uid)
        res.json({ success: true })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete conversation'
        res.status(err instanceof Error && err.message === 'Unauthorized' ? 403 : 500).json({
            error: message,
        })
    }
}

/**
 * GET /api/conversations/:id
 */
export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const conv = await getConversationById(id)
        if (!conv) {
            res.status(404).json({ error: 'Conversation not found' })
            return
        }
        if (!conv.participants.includes(req.user!.uid)) {
            res.status(403).json({ error: 'Unauthorized' })
            return
        }
        res.json({ conversation: conv })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get conversation'
        res.status(500).json({ error: message })
    }
}
