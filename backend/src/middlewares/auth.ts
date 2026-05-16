// Firebase ID token verification middleware
// Attaches req.user = { uid, email } for protected routes

import { Response, NextFunction } from 'express'
import { auth } from '../config/firebase'
import { AuthRequest } from '../types'

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid Authorization header' })
            return
        }

        const token = authHeader.split('Bearer ')[1]
        const decoded = await auth.verifyIdToken(token)

        req.user = {
            uid: decoded.uid,
            email: decoded.email || '',
        }

        next()
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}
