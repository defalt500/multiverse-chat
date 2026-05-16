import { Router } from 'express'
import { verifyToken } from '../controllers/authController'

export const authRouter = Router()

// POST /api/auth/verify — no auth middleware needed (verifies the token itself)
authRouter.post('/verify', verifyToken)
