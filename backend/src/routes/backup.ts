/**
 * routes/backup.ts — Admin-only backup routes
 *
 * All routes require:
 *   1. authMiddleware  — valid Firebase ID token
 *   2. adminMiddleware — user.role === 'admin' in Firestore
 *
 * Mounted at: /api/backups  (in index.ts)
 */

import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth'
import { adminMiddleware } from '../middlewares/adminMiddleware'
import {
    listBackupsController,
    createBackupController,
    getBackupController,
    restoreBackupController,
    deleteBackupController,
} from '../controllers/backupController'

export const backupRouter = Router()

// All backup routes require authentication + admin role
backupRouter.use(authMiddleware as any)
backupRouter.use(adminMiddleware as any)

// List all backups
backupRouter.get('/', listBackupsController as any)

// Create a manual full backup
backupRouter.post('/', createBackupController as any)

// Get details of a specific backup  (id is URL-encoded: "YYYY-MM-DD%2FHH-mm-ss-type")
backupRouter.get('/:id', getBackupController as any)

// Restore a specific backup to Firestore
backupRouter.post('/:id/restore', restoreBackupController as any)

// Delete a specific backup file
backupRouter.delete('/:id', deleteBackupController as any)
