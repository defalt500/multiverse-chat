// User service — Firestore CRUD for the 'users' collection

import { db } from '../config/firebase'
import { DbUser, ApiUser } from '../types'
import admin from 'firebase-admin'
import { createCollectionBackup } from './backupService'

const USERS = 'users'

/** Convert Firestore doc to API response shape */
export function toApiUser(doc: DbUser): ApiUser {
    return {
        id: doc.userId,
        name: doc.username,
        email: doc.email,
        avatar: doc.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.username)}&background=random`,
        status: doc.isOnline ? 'online' : 'offline',
        bio: doc.bio,
        phone: doc.phone,
        role: doc.role || 'user',
    }
}

/**
 * Get or create a user in Firestore.
 * Called after Firebase Auth token verification.
 */
export async function getOrCreateUser(
    uid: string,
    data: { username?: string; email: string; profilePhotoUrl?: string }
): Promise<ApiUser> {
    const ref = db.collection(USERS).doc(uid)
    const snap = await ref.get()

    const adminEmail = process.env.ADMIN_EMAIL || ''
    const isAdmin = data.email.toLowerCase() === adminEmail.toLowerCase()
    const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user'

    if (!snap.exists) {
        // New user — create document
        const newUser: DbUser = {
            userId: uid,
            username: data.username || data.email.split('@')[0],
            email: data.email,
            profilePhotoUrl: data.profilePhotoUrl || '',
            role,
            createdAt: admin.firestore.Timestamp.now(),
            lastActive: admin.firestore.Timestamp.now(),
            isOnline: true,
        }
        await ref.set(newUser)
        return toApiUser(newUser)
    }

    // Existing user — update lastActive and sync role in case admin email changed
    await ref.update({
        lastActive: admin.firestore.Timestamp.now(),
        isOnline: true,
        role,
    })

    const updated = await ref.get()
    return toApiUser(updated.data() as DbUser)
}

/** Get a single user by uid */
export async function getUserById(uid: string): Promise<ApiUser | null> {
    const snap = await db.collection(USERS).doc(uid).get()
    if (!snap.exists) return null
    return toApiUser(snap.data() as DbUser)
}

/** Update profile fields (username, profilePhotoUrl, bio) */
export async function updateUser(
    uid: string,
    updates: { username?: string; profilePhotoUrl?: string; bio?: string; phone?: string }
): Promise<ApiUser> {
    const ref = db.collection(USERS).doc(uid)
    const filtered: Partial<DbUser> = {}
    if (updates.username) filtered.username = updates.username
    if (updates.profilePhotoUrl !== undefined) filtered.profilePhotoUrl = updates.profilePhotoUrl
    if (updates.bio !== undefined) filtered.bio = updates.bio
    if (updates.phone !== undefined) filtered.phone = updates.phone

    await ref.update(filtered)
    const snap = await ref.get()
    return toApiUser(snap.data() as DbUser)
}

/**
 * Search users by email or username (case-insensitive prefix match).
 * Firestore doesn't support case-insensitive search natively,
 * so we do a startAt/endAt trick for starts-with matching.
 */
export async function searchUsers(query: string, excludeUid: string): Promise<ApiUser[]> {
    const q = query.toLowerCase().trim()
    if (!q) return []

    // Search by email prefix
    const emailSnap = await db
        .collection(USERS)
        .where('email', '>=', q)
        .where('email', '<=', q + '\uf8ff')
        .limit(10)
        .get()

    // Search by username prefix
    const usernameSnap = await db
        .collection(USERS)
        .where('username', '>=', q)
        .where('username', '<=', q + '\uf8ff')
        .limit(10)
        .get()

    const seen = new Set<string>()
    const results: ApiUser[] = []

    for (const snap of [...emailSnap.docs, ...usernameSnap.docs]) {
        const user = snap.data() as DbUser
        if (user.userId === excludeUid || seen.has(user.userId)) continue
        seen.add(user.userId)
        results.push(toApiUser(user))
    }

    return results
}

/** Set a user's online/offline status and update lastActive */
export async function setOnlineStatus(uid: string, isOnline: boolean): Promise<void> {
    await db.collection(USERS).doc(uid).update({
        isOnline,
        lastActive: admin.firestore.Timestamp.now(),
    })
}

/** Get all users paginated (admin only) */
export async function getAllUsers(page: number = 1, limitCount: number = 10): Promise<{ users: ApiUser[], total: number }> {
    const coll = db.collection(USERS)
    const countSnap = await coll.count().get()
    const total = countSnap.data().count

    const offset = (page - 1) * limitCount
    const snap = await coll.orderBy('createdAt', 'desc').limit(limitCount).offset(offset).get()

    const users = snap.docs.map((d) => toApiUser(d.data() as DbUser))
    return { users, total }
}

/** Delete a user and their conversations (admin only) */
export async function deleteUserById(uid: string): Promise<void> {
    // ♥ Event-driven backup: snapshot users before permanent deletion.
    //   Fire-and-forget: backup failure must never block or break the delete.
    createCollectionBackup('users', `pre-delete-user-${uid}`).catch((err) =>
        console.warn(`⚠️  [Backup] Pre-delete backup failed for user ${uid}:`, err)
    )

    // Delete Firestore user document
    await db.collection(USERS).doc(uid).delete()
    // Delete conversations where this user is the ONLY participant (AI chats)
    const aiConvs = await db.collection('conversations').where('participants', '==', [uid]).get()
    for (const doc of aiConvs.docs) {
        // Delete subcollection messages first
        const msgs = await doc.ref.collection('messages').get()
        for (const msg of msgs.docs) await msg.ref.delete()
        await doc.ref.delete()
    }
}

/**
 * Upload a profile photo from base64 data to Firebase Storage (Admin SDK).
 * Bypasses client-side CORS issues.
 */
export async function uploadProfilePhoto(uid: string, base64Data: string): Promise<string> {
    // 1. Parse base64 string (e.g. "data:image/jpeg;base64,...")
    const match = base64Data.match(/^data:(image\/[a-z]+);base64,(.+)$/)
    if (!match) throw new Error('Formato de imagen inválido. Debe ser un data URL base64.')

    const contentType = match[1]
    const base64Content = match[2]
    const buffer = Buffer.from(base64Content, 'base64')

    // 2. Prepare storage file
    const bucket = admin.storage().bucket()
    const extension = contentType.split('/')[1] || 'png'
    const fileName = `avatars/${uid}_${Date.now()}.${extension}`
    const file = bucket.file(fileName)

    // 3. Save to storage
    await file.save(buffer, {
        metadata: { contentType },
        public: true, // Make it publicly accessible
    })

    // 4. Return the public URL
    // Format: https://storage.googleapis.com/[bucket]/[fileName]
    const bucketName = bucket.name
    return `https://storage.googleapis.com/${bucketName}/${fileName}`
}
