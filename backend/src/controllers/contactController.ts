import { Response } from 'express'
import { AuthRequest } from '../types'
import {
    sendContactRequest,
    respondToContactRequest,
    getAcceptedContacts,
    getPendingRequests,
    deleteContactRelationship,
} from '../services/contactService'
import { getUserById } from '../services/userService'
import { getIO } from '../sockets/chatSocket'

export async function sendRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { identifier } = req.body
        if (!identifier) {
            res.status(400).json({ error: 'identifier (email or phone) is required' })
            return
        }
        const result = await sendContactRequest(req.user!.uid, identifier.trim())

        // Emit real-time event to the receiver's personal socket room
        try {
            const fromUser = await getUserById(req.user!.uid)
            getIO().to(result.toUserId).emit('new_contact_request', {
                requestId: result.requestId,
                fromUser,
                createdAt: new Date().toISOString(),
            })
        } catch { /* Socket not fatal — request is already stored */ }

        res.json({ success: true, ...result })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send request'
        res.status(400).json({ error: message })
    }
}

/**
 * POST /api/contacts/respond
 * Body: { requestId: string, accept: boolean }
 */
export async function respondRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { requestId, accept } = req.body
        if (!requestId || accept === undefined) {
            res.status(400).json({ error: 'requestId and accept are required' })
            return
        }
        const result = await respondToContactRequest(requestId, req.user!.uid, Boolean(accept))
        res.json({ success: true, accepted: Boolean(accept), ...result })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to respond'
        res.status(400).json({ error: message })
    }
}

/**
 * GET /api/contacts
 * Returns all accepted contacts for the current user.
 */
export async function getContacts(req: AuthRequest, res: Response): Promise<void> {
    try {
        const contacts = await getAcceptedContacts(req.user!.uid)
        res.json({ contacts })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get contacts'
        res.status(500).json({ error: message })
    }
}

/**
 * GET /api/contacts/requests/pending
 * Returns pending incoming contact requests.
 */
export async function getPending(req: AuthRequest, res: Response): Promise<void> {
    try {
        const requests = await getPendingRequests(req.user!.uid)
        res.json({ requests })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get requests'
        res.status(500).json({ error: message })
    }
}

/**
 * DELETE /api/contacts/:contactId
 * Removes the contact relationship between the current user and contactId.
 */
export async function deleteContact(req: AuthRequest, res: Response): Promise<void> {
    try {
        const contactId = req.params['contactId'] as string
        if (!contactId) {
            res.status(400).json({ error: 'contactId is required' })
            return
        }
        await deleteContactRelationship(req.user!.uid, contactId)
        res.json({ success: true })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete contact'
        res.status(400).json({ error: message })
    }
}
