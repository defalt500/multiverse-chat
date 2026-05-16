import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth'
import { listMessages, deleteMessage, sendMessage } from '../controllers/messageController'

export const messagesRouter = Router()

messagesRouter.use(authMiddleware as any)

messagesRouter.post('/', sendMessage as any)
messagesRouter.get('/:conversationId', listMessages as any)
messagesRouter.delete('/:conversationId/:messageId', deleteMessage as any)
