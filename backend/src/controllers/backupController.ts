/**
 * backupController.ts — HTTP handlers for the admin backup API
 *
 * All routes are admin-protected (authMiddleware + adminMiddleware).
 *
 * GET    /api/backups              → list all backups (no file content, metadata only)
 * POST   /api/backups              → create a manual full backup immediately
 * GET    /api/backups/:id          → get metadata + stats for one backup
 * POST   /api/backups/:id/restore  → restore one backup to Firestore
 * DELETE /api/backups/:id          → delete one backup file from disk
 */

import { Response } from 'express'
import { AuthRequest } from '../types'
import {
    createFullBackup,
    listBackups,
    getBackupById,
    restoreFromBackup,
    deleteBackup,
} from '../services/backupService'

/** GET /api/backups — list all available backups */
export async function listBackupsController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const backups = await listBackups()
        res.json({ backups, total: backups.length })
    } catch (err: any) {
        console.error('[Backup] listBackups error:', err)
        res.status(500).json({ error: 'Failed to list backups' })
    }
}

/** POST /api/backups — trigger a manual full backup */
export async function createBackupController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const triggeredBy = `manual-admin-${req.user?.uid || 'unknown'}`
        const metadata = await createFullBackup(triggeredBy)
        res.status(201).json({ backup: metadata, message: 'Backup created successfully' })
    } catch (err: any) {
        console.error('[Backup] createBackup error:', err)
        res.status(500).json({ error: 'Failed to create backup: ' + err.message })
    }
}

/** GET /api/backups/:id — get details of one backup (metadata + stats, no raw data) */
export async function getBackupController(req: AuthRequest, res: Response): Promise<void> {
    try {
        // id param arrives as "YYYY-MM-DD%2FHH-mm-ss-type" — decode it
        const backupId = decodeURIComponent(String(req.params.id))
        const snapshot = await getBackupById(backupId)
        if (!snapshot) {
            res.status(404).json({ error: 'Backup not found' })
            return
        }
        // Return metadata + stats without the heavy collections payload
        const { collections: _c, ...meta } = snapshot
        res.json({ backup: meta })
    } catch (err: any) {
        console.error('[Backup] getBackup error:', err)
        res.status(500).json({ error: 'Failed to retrieve backup' })
    }
}

/** POST /api/backups/:id/restore — restore a backup to Firestore */
export async function restoreBackupController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const backupId = decodeURIComponent(String(req.params.id))
        const result = await restoreFromBackup(backupId)
        res.json({
            message: `Restore complete. ${result.restored} documents written.`,
            ...result,
        })
    } catch (err: any) {
        console.error('[Backup] restoreBackup error:', err)
        if (err.message?.includes('not found')) {
            res.status(404).json({ error: err.message })
        } else {
            res.status(500).json({ error: 'Restore failed: ' + err.message })
        }
    }
}

/** DELETE /api/backups/:id — delete a backup file from disk */
export async function deleteBackupController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const backupId = decodeURIComponent(String(req.params.id))
        await deleteBackup(backupId)
        res.json({ message: 'Backup deleted successfully', id: backupId })
    } catch (err: any) {
        console.error('[Backup] deleteBackup error:', err)
        if (err.code === 'ENOENT') {
            res.status(404).json({ error: 'Backup file not found' })
        } else {
            res.status(500).json({ error: 'Failed to delete backup: ' + err.message })
        }
    }
}
