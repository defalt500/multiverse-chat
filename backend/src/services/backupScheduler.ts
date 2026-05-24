/**
 * backupScheduler.ts — Automatic backup scheduler for Multiverse Chat
 *
 * Schedule: every 6 hours (cron: "0 *\/6 * * *")
 *   → 00:00, 06:00, 12:00, 18:00 (server local time)
 *
 * The backup runs asynchronously in a detached promise — it does NOT block:
 *   • Express request handlers
 *   • Socket.io events
 *   • Main process
 *
 * If a backup fails, the error is logged but the server keeps running.
 * Call startBackupScheduler() once from index.ts after the server starts.
 */

import cron from 'node-cron'
import { createFullBackup } from './backupService'

export function startBackupScheduler(): void {
    const SCHEDULE = '0 */6 * * *'

    console.log(' [Scheduler] Backup scheduler started — runs every 6 hours.')

    cron.schedule(SCHEDULE, () => {
        ; (async () => {
            try {
                console.log('\n  [Scheduler] Starting automatic full backup…')
                const meta = await createFullBackup('scheduler-auto')
                console.log(` [Scheduler] Backup complete — ID: ${meta.id}, docs: ${JSON.stringify(meta.stats)}\n`)
            } catch (err) {
                console.error(' [Scheduler] Automatic backup failed:', err)
            }
        })()
    })
}
