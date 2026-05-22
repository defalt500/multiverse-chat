/**
 * backupService.ts — Core backup & restore engine for Multiverse Chat
 *
 * Strategy:
 *   • Full backup: snapshots all 5 Firestore collections into a single JSON file.
 *   • Collection backup: snapshots a single named collection (used for event-driven hooks).
 *   • Files are saved to:  backups/<YYYY-MM-DD>/<HH-mm-ss>-<type>.json
 *   • Timestamps are ISO 8601 (UTC).
 *   • Restore: reads a snapshot file and writes all documents back to Firestore
 *     via batched writes (max 500 ops per batch — Firestore limit).
 *
 * Performance:
 *   • All disk I/O is async (fs.promises).
 *   • Firestore reads use parallel Promise.all where safe.
 *   • Does NOT block Socket.io or Express — called with fire-and-forget or await.
 *
 * Security:
 *   • Files are stored server-side only; never exposed to the public.
 *   • Only admins can trigger or access backups via the API.
 */

import fs from 'fs'
import path from 'path'
import { db } from '../config/firebase'
import { BackupMetadata, BackupSnapshot } from '../types'

// ─── Backup Directory ─────────────────────────────────────────────────────────

/**
 * Root directory for all backup files.
 * Stored relative to the project root (one level above /src).
 */
const BACKUP_ROOT = path.resolve(__dirname, '..', '..', 'backups')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns { dateStr: 'YYYY-MM-DD', timeStr: 'HH-mm-ss' } from a Date object */
function formatDateTime(date: Date): { dateStr: string; timeStr: string } {
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    const timeStr = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
    return { dateStr, timeStr }
}

/** Converts a Firestore Timestamp to a plain ISO string (safe for JSON serialization) */
function serializeValue(val: any): any {
    if (val && typeof val === 'object' && typeof val.toDate === 'function') {
        return val.toDate().toISOString()
    }
    if (Array.isArray(val)) return val.map(serializeValue)
    if (val && typeof val === 'object') {
        const out: Record<string, any> = {}
        for (const k of Object.keys(val)) out[k] = serializeValue(val[k])
        return out
    }
    return val
}

/** Reads all documents in a top-level Firestore collection, returns serialized array */
async function dumpCollection(collectionName: string): Promise<any[]> {
    const snap = await db.collection(collectionName).get()
    return snap.docs.map((d) => ({ _docId: d.id, ...serializeValue(d.data()) }))
}

/**
 * Reads all conversations and their messages subcollection.
 * Returns { conversations: [...], messages: { [convId]: [...] } }
 */
async function dumpConversationsWithMessages(): Promise<{
    conversations: any[]
    messages: Record<string, any[]>
}> {
    const snap = await db.collection('conversations').get()
    const conversations: any[] = []
    const messages: Record<string, any[]> = {}

    await Promise.all(
        snap.docs.map(async (doc) => {
            conversations.push({ _docId: doc.id, ...serializeValue(doc.data()) })
            const msgSnap = await doc.ref.collection('messages').get()
            messages[doc.id] = msgSnap.docs.map((m) => ({ _docId: m.id, ...serializeValue(m.data()) }))
        })
    )

    return { conversations, messages }
}

/** Ensures a directory exists (creates it recursively if needed) */
async function ensureDir(dir: string): Promise<void> {
    await fs.promises.mkdir(dir, { recursive: true })
}

/** Writes a BackupSnapshot to disk and returns its BackupMetadata */
async function writeSnapshot(
    snapshot: BackupSnapshot,
    dateStr: string,
    timeStr: string,
    type: BackupMetadata['type']
): Promise<BackupMetadata> {
    const dir = path.join(BACKUP_ROOT, dateStr)
    await ensureDir(dir)

    const fileName = `${timeStr}-${type}.json`
    const filePath = path.join(dir, fileName)

    // Compute stats (document counts)
    const stats: Record<string, number> = {}
    for (const [col, data] of Object.entries(snapshot.collections)) {
        if (col === 'messages') {
            // messages is Record<convId, msg[]>
            stats.messages = Object.values(data as Record<string, any[]>).reduce(
                (sum, arr) => sum + arr.length,
                0
            )
        } else if (Array.isArray(data)) {
            stats[col] = data.length
        }
    }

    const metadata: BackupMetadata = {
        id: `${dateStr}/${timeStr}-${type}`,
        type,
        triggeredBy: snapshot.triggeredBy,
        timestamp: snapshot.timestamp,
        filePath,
        stats,
    }

    const fullSnapshot: BackupSnapshot = { ...metadata, collections: snapshot.collections }
    await fs.promises.writeFile(filePath, JSON.stringify(fullSnapshot, null, 2), 'utf-8')

    console.log(`✅ [Backup] Saved: ${filePath} (${JSON.stringify(stats)})`)
    return metadata
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a FULL backup of all Firestore collections.
 * Includes: users, conversations, messages (subcollection), contactRequests, aiCharacters.
 */
export async function createFullBackup(triggeredBy: string): Promise<BackupMetadata> {
    const now = new Date()
    const { dateStr, timeStr } = formatDateTime(now)

    console.log(`🗂️  [Backup] Starting full backup (triggered by: ${triggeredBy})…`)

    // Fetch all collections in parallel
    const [users, { conversations, messages }, contactRequests, aiCharacters] = await Promise.all([
        dumpCollection('users'),
        dumpConversationsWithMessages(),
        dumpCollection('contactRequests'),
        dumpCollection('aiCharacters'),
    ])

    const snapshot: BackupSnapshot = {
        id: `${dateStr}/${timeStr}-full`,
        type: 'full',
        triggeredBy,
        timestamp: now.toISOString(),
        filePath: '',      // filled by writeSnapshot
        stats: {},         // filled by writeSnapshot
        collections: { users, conversations, messages, contactRequests, aiCharacters },
    }

    return writeSnapshot(snapshot, dateStr, timeStr, 'full')
}

/**
 * Creates a backup of a SINGLE named collection.
 * For event-driven hooks (e.g. before deleting a user).
 * Supported: 'users' | 'conversations' | 'contactRequests' | 'aiCharacters'
 */
export async function createCollectionBackup(
    collection: BackupMetadata['type'],
    triggeredBy: string
): Promise<BackupMetadata> {
    const now = new Date()
    const { dateStr, timeStr } = formatDateTime(now)

    console.log(`🗂️  [Backup] Collection backup '${collection}' (triggered by: ${triggeredBy})…`)

    let collectionsData: Record<string, any>

    if (collection === 'conversations') {
        const { conversations, messages } = await dumpConversationsWithMessages()
        collectionsData = { conversations, messages }
    } else {
        const data = await dumpCollection(String(collection))
        collectionsData = { [String(collection)]: data }
    }

    const snapshot: BackupSnapshot = {
        id: `${dateStr}/${timeStr}-${collection}`,
        type: collection,
        triggeredBy,
        timestamp: now.toISOString(),
        filePath: '',
        stats: {},
        collections: collectionsData,
    }

    return writeSnapshot(snapshot, dateStr, timeStr, collection)
}

/**
 * Lists all backup metadata sorted by most recent first.
 * Scans the backup directory tree for JSON files.
 */
export async function listBackups(): Promise<BackupMetadata[]> {
    await ensureDir(BACKUP_ROOT)
    const results: BackupMetadata[] = []

    let dateDirs: string[]
    try {
        dateDirs = await fs.promises.readdir(BACKUP_ROOT)
    } catch {
        return []
    }

    for (const dateDir of dateDirs) {
        const dirPath = path.join(BACKUP_ROOT, dateDir)
        const stat = await fs.promises.stat(dirPath)
        if (!stat.isDirectory()) continue

        const files = await fs.promises.readdir(dirPath)
        for (const file of files) {
            if (!file.endsWith('.json')) continue
            const filePath = path.join(dirPath, file)
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8')
                const snap: BackupSnapshot = JSON.parse(content)
                // Return only metadata (strip heavy collections field)
                const { collections: _c, ...meta } = snap
                results.push(meta as BackupMetadata)
            } catch (err) {
                console.warn(`⚠️  [Backup] Could not parse backup file: ${filePath}`, err)
            }
        }
    }

    // Sort newest first
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return results
}

/**
 * Loads a single backup snapshot by its ID.
 * ID format: "YYYY-MM-DD/HH-mm-ss-type" (matches BackupMetadata.id)
 */
export async function getBackupById(backupId: string): Promise<BackupSnapshot | null> {
    // Reconstruct path: backupId = "2026-05-21/22-41-07-full"
    const filePath = path.join(BACKUP_ROOT, `${backupId}.json`)
    try {
        const content = await fs.promises.readFile(filePath, 'utf-8')
        return JSON.parse(content) as BackupSnapshot
    } catch {
        return null
    }
}

/**
 * Deletes a backup file from disk.
 */
export async function deleteBackup(backupId: string): Promise<void> {
    const filePath = path.join(BACKUP_ROOT, `${backupId}.json`)
    await fs.promises.unlink(filePath)
    console.log(`🗑️  [Backup] Deleted: ${filePath}`)
}

/**
 * Restores a backup snapshot into Firestore.
 *
 * Strategy per collection:
 *   - Does NOT delete existing documents first (non-destructive restore).
 *   - Uses merge: true so existing docs are updated with backup values.
 *   - Messages subcollection is restored under their parent conversation docs.
 *
 * Returns the total number of documents written.
 */
export async function restoreFromBackup(
    backupId: string
): Promise<{ restored: number; backupId: string }> {
    const snapshot = await getBackupById(backupId)
    if (!snapshot) throw new Error(`Backup not found: ${backupId}`)

    console.log(`🔄 [Backup] Restoring backup: ${backupId}…`)

    let totalRestored = 0
    const BATCH_LIMIT = 450 // safe margin below Firestore's 500-op limit

    /**
     * Helper: writes docs to a Firestore collection in batches.
     * Each doc must have a `_docId` field that was stored during backup.
     */
    async function writeBatch(
        collectionRef: FirebaseFirestore.CollectionReference,
        docs: any[]
    ): Promise<number> {
        let count = 0
        let batch = db.batch()
        let opsInBatch = 0

        for (const doc of docs) {
            const { _docId, ...data } = doc
            if (!_docId) continue
            batch.set(collectionRef.doc(_docId), data, { merge: true })
            opsInBatch++
            count++

            if (opsInBatch >= BATCH_LIMIT) {
                await batch.commit()
                batch = db.batch()
                opsInBatch = 0
            }
        }

        if (opsInBatch > 0) await batch.commit()
        return count
    }

    const cols = snapshot.collections

    // Restore top-level collections (except messages, which is a subcollection)
    for (const colName of ['users', 'conversations', 'contactRequests', 'aiCharacters']) {
        const docs = cols[colName]
        if (!Array.isArray(docs) || docs.length === 0) continue
        const written = await writeBatch(db.collection(colName), docs)
        totalRestored += written
        console.log(`   ↺  Restored ${written} docs → ${colName}`)
    }

    // Restore messages subcollection
    if (cols.messages && typeof cols.messages === 'object') {
        for (const [convId, msgs] of Object.entries(cols.messages as Record<string, any[]>)) {
            if (!Array.isArray(msgs) || msgs.length === 0) continue
            const msgRef = db.collection('conversations').doc(convId).collection('messages')
            const written = await writeBatch(msgRef, msgs)
            totalRestored += written
        }
        const totalMsgs = Object.values(cols.messages as Record<string, any[]>).reduce(
            (sum, arr) => sum + arr.length,
            0
        )
        console.log(`   ↺  Restored ${totalMsgs} docs → conversations/*/messages`)
    }

    console.log(`✅ [Backup] Restore complete. Total docs written: ${totalRestored}`)
    return { restored: totalRestored, backupId }
}
