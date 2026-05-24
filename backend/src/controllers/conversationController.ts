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
import { validateFirestoreId } from '../middlewares/validation'

/**
 * GET /api/conversations
 */
export async function listConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
        const conversations = await getConversationsByUser(req.user!.uid)
        res.json({ conversations })
    } catch (err) {
        res.status(500).json({ error: 'Failed to get conversations' })
    }
}

/**
 * POST /api/conversations
 * Body: { participantId?: string, type?: 'user'|'ai', aiCharacterId?: string }
 */
export async function startConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { participantId, type, aiCharacterId } = req.body
        const uid = req.user!.uid

        // Validate type
        const convType = type === 'ai' ? 'ai' : 'user'

        if (convType === 'ai') {
            if (!aiCharacterId) {
                res.status(400).json({ error: 'aiCharacterId is required for AI conversations' })
                return
            }
            const idResult = validateFirestoreId(aiCharacterId)
            if (!idResult.valid) { res.status(400).json({ error: idResult.error }); return }

            const conv = await createAiConversation(uid, aiCharacterId as string)
            res.json({ conversation: conv })
            return
        }

        if (!participantId) {
            res.status(400).json({ error: 'participantId is required for user conversations' })
            return
        }
        const idResult = validateFirestoreId(participantId)
        if (!idResult.valid) { res.status(400).json({ error: idResult.error }); return }

        // Prevent chatting with yourself
        if (participantId === uid) {
            res.status(400).json({ error: 'Cannot create a conversation with yourself' })
            return
        }

        const conv = await getOrCreateConversation(uid, participantId as string)
        const apiConv = await toApiConversation(conv, uid)
        res.json({ conversation: apiConv })
    } catch (err) {
        res.status(500).json({ error: 'Failed to create conversation' })
    }
}

/**
 * DELETE /api/conversations/:id
 */
export async function removeConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const idResult = validateFirestoreId(id)
        if (!idResult.valid) { res.status(400).json({ error: idResult.error }); return }

        await deleteConversation(id, req.user!.uid)
        res.json({ success: true })
    } catch (err) {
        const message = err instanceof Error && err.message === 'Unauthorized' ? 'Unauthorized' : 'Failed to delete conversation'
        const status = err instanceof Error && err.message === 'Unauthorized' ? 403 : 500
        res.status(status).json({ error: message })
    }
}

/**
 * GET /api/conversations/:id
 */
export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const idResult = validateFirestoreId(id)
        if (!idResult.valid) { res.status(400).json({ error: idResult.error }); return }

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
        res.status(500).json({ error: 'Failed to get conversation' })
    }
}
