import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth'
import { sendRequest, respondRequest, getContacts, getPending, deleteContact } from '../controllers/contactController'

export const contactsRouter = Router()

contactsRouter.use(authMiddleware as any)

contactsRouter.post('/request', sendRequest as any)
contactsRouter.post('/respond', respondRequest as any)
contactsRouter.get('/', getContacts as any)
contactsRouter.get('/requests/pending', getPending as any)
contactsRouter.delete('/:contactId', deleteContact as any)

