// User controller — profile management, search, and admin CRUD

import { Response } from 'express'
import { AuthRequest } from '../types'
import { getUserById, updateUser, searchUsers, getAllUsers, deleteUserById } from '../services/userService'

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
        const uid = req.user!.uid
        const user = await getUserById(uid)
        if (!user) {
            res.status(404).json({ error: 'User not found' })
            return
        }
        res.json({ user })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get user'
        res.status(500).json({ error: message })
    }
}

export async function updateMe(req: AuthRequest, res: Response): Promise<void> {
    try {
        const uid = req.user!.uid
        const { username, bio, phone, profilePhotoUrl } = req.body
        const user = await updateUser(uid, { username, bio, phone, profilePhotoUrl })
        res.json({ user })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update user'
        res.status(500).json({ error: message })
    }
}

export async function searchUsersController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = (req.query.q as string) || ''
        const users = await searchUsers(query, req.user!.uid)
        res.json({ users })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed'
        res.status(500).json({ error: message })
    }
}

export async function getUserProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const user = await getUserById(id)
        if (!user) {
            res.status(404).json({ error: 'User not found' })
            return
        }
        res.json({ user })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get user'
        res.status(500).json({ error: message })
    }
}

export async function getAllUsersController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const result = await getAllUsers(page, limit)
        res.json({
            users: result.users,
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit)
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get users'
        res.status(500).json({ error: message })
    }
}

/** ADMIN: Update any user by id */
export async function adminUpdateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const { username, bio, profilePhotoUrl } = req.body
        const user = await updateUser(id, { username, bio, profilePhotoUrl })
        res.json({ user })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update user'
        res.status(500).json({ error: message })
    }
}

/** ADMIN: Delete any user */
export async function adminDeleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        await deleteUserById(id)
        res.json({ success: true })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete user'
        res.status(500).json({ error: message })
    }
}
