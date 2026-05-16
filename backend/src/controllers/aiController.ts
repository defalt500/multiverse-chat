// AI controller — list, create, update, delete AI characters

import { Response } from 'express'
import { AuthRequest } from '../types'
import {
    getAllCharacters, createCharacter, updateCharacter, deleteCharacter
} from '../services/aiCharacterService'

/** GET /api/ai/characters */
export async function listCharacters(req: AuthRequest, res: Response): Promise<void> {
    try {
        const characters = await getAllCharacters()
        res.json({ characters })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get AI characters'
        res.status(500).json({ error: message })
    }
}

/** POST /api/ai/characters — admin */
export async function createCharacterController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { name, personality, systemPrompt, avatarUrl } = req.body
        if (!name || !systemPrompt) {
            res.status(400).json({ error: 'name and systemPrompt are required' })
            return
        }
        const char = await createCharacter({
            name,
            personality: personality || '',
            systemPrompt,
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
        })
        res.status(201).json({ character: char })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create AI character'
        res.status(500).json({ error: message })
    }
}

/** PUT /api/ai/characters/:id — admin */
export async function updateCharacterController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        const { name, personality, systemPrompt, avatarUrl } = req.body
        const char = await updateCharacter(id, { name, personality, systemPrompt, avatarUrl })
        if (!char) {
            res.status(404).json({ error: 'Character not found' })
            return
        }
        res.json({ character: char })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update AI character'
        res.status(500).json({ error: message })
    }
}

/** DELETE /api/ai/characters/:id — admin */
export async function deleteCharacterController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const id = req.params['id'] as string
        await deleteCharacter(id)
        res.json({ success: true })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete AI character'
        res.status(500).json({ error: message })
    }
}
