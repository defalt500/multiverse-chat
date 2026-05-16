// Seed service — creates admin and test users in Firestore on startup
// Uses Firebase Admin SDK to create/verify Auth accounts and Firestore docs

import { auth as adminAuth, db } from '../config/firebase'
import { DbUser } from '../types'
import admin from 'firebase-admin'

interface SeedUser {
    email: string
    password: string
    username: string
    role: 'user' | 'admin'
}

const SEED_USERS: SeedUser[] = [
    { email: 'admin1@test.com', password: 'Admin1234!', username: 'admin1', role: 'admin' },
    { email: 'test1@test.com', password: 'Test1234!', username: 'test1', role: 'user' },
    { email: 'test2@test.com', password: 'Test1234!', username: 'test2', role: 'user' },
]

/**
 * Upsert a Firebase Auth account + Firestore user doc.
 * Skips silently if the account already exists.
 */
async function upsertUser(seed: SeedUser): Promise<void> {
    let uid: string

    try {
        // Try to get existing auth account
        const existing = await adminAuth.getUserByEmail(seed.email)
        uid = existing.uid
    } catch {
        // Create new auth account
        const created = await adminAuth.createUser({
            email: seed.email,
            password: seed.password,
            displayName: seed.username,
        })
        uid = created.uid
    }

    // Upsert Firestore document (merge so we don't overwrite lastActive/isOnline)
    const ref = db.collection('users').doc(uid)
    const snap = await ref.get()

    if (!snap.exists) {
        const now = admin.firestore.Timestamp.now()
        const userDoc: DbUser = {
            userId: uid,
            username: seed.username,
            email: seed.email,
            profilePhotoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(seed.username)}&background=random`,
            role: seed.role,
            createdAt: now,
            lastActive: now,
            isOnline: false,
        }
        await ref.set(userDoc)
        console.log(`✅ Seeded user: ${seed.email} (${seed.role})`)
    } else {
        // Update role in case it changed
        await ref.update({ role: seed.role })
    }
}

/** Seed all default users (admin1, test1, test2) */
export async function seedDefaultUsers(): Promise<void> {
    for (const user of SEED_USERS) {
        try {
            await upsertUser(user)
        } catch (err) {
            console.warn(`⚠️  Could not seed user ${user.email}:`, err instanceof Error ? err.message : err)
        }
    }
}
