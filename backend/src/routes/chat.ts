import { Router } from 'express'
import { getMessages } from '../controllers/chatController'

export const chatRouter = Router()

chatRouter.get('/messages', getMessages)
