import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth'
import { adminMiddleware } from '../middlewares/adminMiddleware'
import {
    getMe, updateMe, searchUsersController, getUserProfile,
    getAllUsersController, adminUpdateUser, adminDeleteUser
} from '../controllers/userController'

export const usersRouter = Router()

// All routes require authentication
usersRouter.use(authMiddleware as any)

// Specific routes BEFORE wildcard /:id
usersRouter.get('/me', getMe as any)
usersRouter.put('/me', updateMe as any)
usersRouter.get('/search', searchUsersController as any)
usersRouter.get('/all', adminMiddleware as any, getAllUsersController as any)  // admin: list all users
usersRouter.put('/admin/:id', adminMiddleware as any, adminUpdateUser as any)
usersRouter.delete('/admin/:id', adminMiddleware as any, adminDeleteUser as any)

// Wildcard LAST
usersRouter.get('/:id', getUserProfile as any)
