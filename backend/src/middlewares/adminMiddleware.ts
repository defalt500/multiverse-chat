// adminMiddleware — verifies requesting user has role:'admin' in Firestore
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import { db } from '../config/firebase'
import { DbUser } from '../types'

export async function adminMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user?.uid) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }
        const snap = await db.collection('users').doc(req.user.uid).get()
        if (!snap.exists) {
            res.status(403).json({ error: 'Forbidden' })
            return
        }
        const user = snap.data() as DbUser
        if (user.role !== 'admin') {
            res.status(403).json({ error: 'Admin access required' })
            return
        }
        next()
    } catch (err) {
        res.status(500).json({ error: 'Auth check failed' })
    }
}
