import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth'
import {
    listConversations,
    startConversation,
    removeConversation,
    getConversation,
} from '../controllers/conversationController'

export const conversationsRouter = Router()

conversationsRouter.use(authMiddleware as any)

conversationsRouter.get('/', listConversations as any)
conversationsRouter.post('/', startConversation as any)
conversationsRouter.get('/:id', getConversation as any)
conversationsRouter.delete('/:id', removeConversation as any)
