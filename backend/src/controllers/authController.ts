// Auth controller — handles token verification and user upsert

import { Response } from 'express'
import { AuthRequest } from '../types'
import { getOrCreateUser } from '../services/userService'
import { auth } from '../config/firebase'

/**
 * POST /api/auth/verify
 * Verifies a Firebase ID token and upserts the user in Firestore.
 * Returns a normalized user object.
 */
export async function verifyToken(req: AuthRequest, res: Response): Promise<void> {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing Authorization header' })
            return
        }

        const token = authHeader.split('Bearer ')[1]
        const decoded = await auth.verifyIdToken(token)

        const user = await getOrCreateUser(decoded.uid, {
            email: decoded.email || '',
            username: decoded.name || decoded.email?.split('@')[0] || '',
            profilePhotoUrl: decoded.picture || '',
        })

        res.json({ user })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Auth failed'
        res.status(401).json({ error: message })
    }
}
