import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth'
import { adminMiddleware } from '../middlewares/adminMiddleware'
import { aiLimiter } from '../middlewares/rateLimiter'
import {
    listCharacters, createCharacterController, updateCharacterController, deleteCharacterController
} from '../controllers/aiController'

export const aiRouter = Router()

aiRouter.use(authMiddleware as any)
aiRouter.use(aiLimiter)

// Public (authenticated) routes
aiRouter.get('/characters', listCharacters as any)

// Admin-only routes
aiRouter.post('/characters', adminMiddleware as any, createCharacterController as any)
aiRouter.put('/characters/:id', adminMiddleware as any, updateCharacterController as any)
aiRouter.delete('/characters/:id', adminMiddleware as any, deleteCharacterController as any)
