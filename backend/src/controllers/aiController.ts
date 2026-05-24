// AI controller — list, create, update, delete AI characters

import { Response } from 'express'
import { AuthRequest } from '../types'
import {
    getAllCharacters, createCharacter, updateCharacter, deleteCharacter
} from '../services/aiCharacterService'
import {
    validateDisplayName,
    validateFirestoreId,
    validateHttpsUrl,
    sanitizeString,
} from '../middlewares/validation'

/** GET /api/ai/characters */
export async function listCharacters(req: AuthRequest, res: Response): Promise<void> {
    try {
        const characters = await getAllCharacters()
        res.json({ characters })
    } catch (err) {
        res.status(500).json({ error: 'Failed to get AI characters' })
    }
}

/** POST /api/ai/characters — admin */
export async function createCharacterController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { name, personality, systemPrompt, avatarUrl } = req.body

        // Validate name
        const nameResult = validateDisplayName(name)
        if (!nameResult.valid) { res.status(400).json({ error: nameResult.error }); return }

        // Validate systemPrompt
        const prompt = sanitizeString(systemPrompt)
        if (!prompt || prompt.length < 10) {
            res.status(400).json({ error: 'systemPrompt must be at least 10 characters' })
            return
        }
        if (prompt.length > 4000) {
            res.status(400).json({ error: 'systemPrompt must be 4000 characters or fewer' })
            return
        }

        // Validate avatarUrl if provided
        if (avatarUrl && avatarUrl !== '') {
            const urlResult = validateHttpsUrl(avatarUrl)
            if (!urlResult.valid) { res.status(400).json({ error: urlResult.error }); return }
        }

        const sanitizedName = nameResult.sanitized!
        const char = await createCharacter({
            name: sanitizedName,
            personality: sanitizeString(personality).slice(0, 500),
            systemPrompt: prompt,
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sanitizedName)}&backgroundColor=b6e3f4`,
        })
        res.status(201).json({ character: char })
    } catch (err) {
        res.status(500).json({ error: 'Failed to create AI character' })
    }
}

/** PUT /api/ai/characters/:id — admin */
export async function updateCharacterController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const idResult = validateFirestoreId(id)
        if (!idResult.valid) { res.status(400).json({ error: idResult.error }); return }

        const { name, personality, systemPrompt, avatarUrl } = req.body

        // Validate optional fields
        if (name !== undefined) {
            const nameResult = validateDisplayName(name)
            if (!nameResult.valid) { res.status(400).json({ error: nameResult.error }); return }
        }
        if (systemPrompt !== undefined) {
            const prompt = sanitizeString(systemPrompt)
            if (prompt.length < 10) {
                res.status(400).json({ error: 'systemPrompt must be at least 10 characters' }); return
            }
            if (prompt.length > 4000) {
                res.status(400).json({ error: 'systemPrompt must be 4000 characters or fewer' }); return
            }
        }
        if (avatarUrl && avatarUrl !== '') {
            const urlResult = validateHttpsUrl(avatarUrl)
            if (!urlResult.valid) { res.status(400).json({ error: urlResult.error }); return }
        }

        const char = await updateCharacter(id, {
            name: name ? sanitizeString(name) : undefined,
            personality: personality ? sanitizeString(personality).slice(0, 500) : undefined,
            systemPrompt: systemPrompt ? sanitizeString(systemPrompt) : undefined,
            avatarUrl: avatarUrl || undefined,
        })
        if (!char) {
            res.status(404).json({ error: 'Character not found' })
            return
        }
        res.json({ character: char })
    } catch (err) {
        res.status(500).json({ error: 'Failed to update AI character' })
    }
}

/** DELETE /api/ai/characters/:id — admin */
export async function deleteCharacterController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const idResult = validateFirestoreId(id)
        if (!idResult.valid) { res.status(400).json({ error: idResult.error }); return }

        await deleteCharacter(id)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete AI character' })
    }
}
