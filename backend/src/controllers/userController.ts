// User controller — profile management, search, and admin CRUD

import { Response } from 'express'
import { AuthRequest } from '../types'
import { getUserById, updateUser, searchUsers, getAllUsers, deleteUserById } from '../services/userService'
import {
    validateUsername,
    validateBio,
    validateDisplayName,
    validateHttpsUrl,
    validateFirestoreId,
    validatePagination,
    sanitizeString,
} from '../middlewares/validation'

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
        res.status(500).json({ error: 'Failed to get user' })
    }
}

export async function updateMe(req: AuthRequest, res: Response): Promise<void> {
    try {
        const uid = req.user!.uid
        const { username, bio, phone, profilePhotoUrl } = req.body

        // Validate username if provided
        if (username !== undefined) {
            const v = validateUsername(username)
            if (!v.valid) { res.status(400).json({ error: v.error }); return }
        }

        // Validate bio if provided
        const bioResult = validateBio(bio)
        if (!bioResult.valid) { res.status(400).json({ error: bioResult.error }); return }

        // Validate profilePhotoUrl if provided (must be https or empty)
        if (profilePhotoUrl && profilePhotoUrl !== '') {
            const urlResult = validateHttpsUrl(profilePhotoUrl)
            if (!urlResult.valid) { res.status(400).json({ error: urlResult.error }); return }
        }

        // Sanitize phone
        const sanitizedPhone = phone ? sanitizeString(phone).slice(0, 20) : undefined

        const user = await updateUser(uid, {
            username: username ? sanitizeString(username) : undefined,
            bio: bioResult.sanitized,
            phone: sanitizedPhone,
            profilePhotoUrl: profilePhotoUrl || undefined,
        })
        res.json({ user })
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' })
    }
}

export async function searchUsersController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const query = sanitizeString(req.query.q)
        if (!query) {
            res.status(400).json({ error: 'Search query is required' })
            return
        }
        if (query.length > 50) {
            res.status(400).json({ error: 'Search query is too long (max 50 characters)' })
            return
        }
        const users = await searchUsers(query, req.user!.uid)
        res.json({ users })
    } catch (err) {
        res.status(500).json({ error: 'Search failed' })
    }
}

export async function getUserProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const idResult = validateFirestoreId(id)
        if (!idResult.valid) { res.status(400).json({ error: idResult.error }); return }

        const user = await getUserById(id)
        if (!user) {
            res.status(404).json({ error: 'User not found' })
            return
        }
        res.json({ user })
    } catch (err) {
        res.status(500).json({ error: 'Failed to get user' })
    }
}

export async function getAllUsersController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { page, limit } = validatePagination(req.query.page, req.query.limit)
        const result = await getAllUsers(page, limit)
        res.json({
            users: result.users,
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit)
        })
    } catch (err) {
        res.status(500).json({ error: 'Failed to get users' })
    }
}

/** ADMIN: Update any user by id */
export async function adminUpdateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const idResult = validateFirestoreId(id)
        if (!idResult.valid) { res.status(400).json({ error: idResult.error }); return }

        const { username, bio, profilePhotoUrl } = req.body

        if (username !== undefined) {
            const v = validateUsername(username)
            if (!v.valid) { res.status(400).json({ error: v.error }); return }
        }
        const bioResult = validateBio(bio)
        if (!bioResult.valid) { res.status(400).json({ error: bioResult.error }); return }

        if (profilePhotoUrl && profilePhotoUrl !== '') {
            const urlResult = validateHttpsUrl(profilePhotoUrl)
            if (!urlResult.valid) { res.status(400).json({ error: urlResult.error }); return }
        }

        // Prevent privilege escalation: admin cannot set role via this endpoint
        const user = await updateUser(id, {
            username: username ? sanitizeString(username) : undefined,
            bio: bioResult.sanitized,
            profilePhotoUrl: profilePhotoUrl || undefined,
        })
        res.json({ user })
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' })
    }
}

/** ADMIN: Delete any user */
export async function adminDeleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const idResult = validateFirestoreId(id)
        if (!idResult.valid) { res.status(400).json({ error: idResult.error }); return }

        await deleteUserById(id)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' })
    }
}
