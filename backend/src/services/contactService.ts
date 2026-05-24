// Contact service — manages friend/contact requests
// Uses a separate 'contactRequests' collection for clean lifecycle management

import { db } from '../config/firebase'
import { DbContact, ApiUser } from '../types'
import { getUserById, toApiUser } from './userService'
import admin from 'firebase-admin'

const REQUESTS = 'contactRequests'

/** Find a user by email or phone number */
async function findUserByIdentifier(identifier: string): Promise<string | null> {
    // Try email
    const emailSnap = await db.collection('users').where('email', '==', identifier.toLowerCase()).limit(1).get()
    if (!emailSnap.empty) return emailSnap.docs[0].id

    // Try phone
    const phoneSnap = await db.collection('users').where('phone', '==', identifier).limit(1).get()
    if (!phoneSnap.empty) return phoneSnap.docs[0].id

    return null
}

/** Send a contact request by email or phone number */
export async function sendContactRequest(
    fromUid: string,
    identifier: string
): Promise<{ requestId: string; toUserId: string }> {
    const toUid = await findUserByIdentifier(identifier)
    if (!toUid) throw new Error('User not found with that email or phone number')
    if (toUid === fromUid) throw new Error('You cannot add yourself as a contact')

    // Check for existing request
    const existingSnap = await db
        .collection(REQUESTS)
        .where('fromUserId', '==', fromUid)
        .where('toUserId', '==', toUid)
        .where('status', '==', 'pending')
        .limit(1)
        .get()

    if (!existingSnap.empty) throw new Error('Contact request already sent')

    // Check if already contacts
    const acceptedSnap = await db
        .collection(REQUESTS)
        .where('fromUserId', 'in', [fromUid, toUid])
        .where('toUserId', 'in', [fromUid, toUid])
        .where('status', '==', 'accepted')
        .limit(1)
        .get()

    const requestId = db.collection(REQUESTS).doc().id
    const now = admin.firestore.Timestamp.now()
    const request: DbContact = {
        requestId,
        fromUserId: fromUid,
        toUserId: toUid,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
    }

    await db.collection(REQUESTS).doc(requestId).set(request)
    return { requestId, toUserId: toUid }
}

/** Accept or reject a contact request. On accept, creates the 1-1 conversation automatically. */
export async function respondToContactRequest(
    requestId: string,
    responderUid: string,
    accept: boolean
): Promise<{ conversationId?: string }> {
    const ref = db.collection(REQUESTS).doc(requestId)
    const snap = await ref.get()
    if (!snap.exists) throw new Error('Request not found')

    const req = snap.data() as DbContact
    if (req.toUserId !== responderUid) throw new Error('Unauthorized')
    if (req.status !== 'pending') throw new Error('Request already processed')

    await ref.update({
        status: accept ? 'accepted' : 'rejected',
        updatedAt: admin.firestore.Timestamp.now(),
    })

    if (accept) {
        // Auto-create the 1-1 conversation between the two users
        const { getOrCreateConversation } = await import('./conversationService')
        const conv = await getOrCreateConversation(req.fromUserId, req.toUserId)
        return { conversationId: conv.conversationId }
    }

    return {}
}

/** Get all accepted contacts for a user */
export async function getAcceptedContacts(uid: string): Promise<ApiUser[]> {
    // Requests where user is sender (accepted)
    const sentSnap = await db
        .collection(REQUESTS)
        .where('fromUserId', '==', uid)
        .where('status', '==', 'accepted')
        .get()

    // Requests where user is receiver (accepted)
    const receivedSnap = await db
        .collection(REQUESTS)
        .where('toUserId', '==', uid)
        .where('status', '==', 'accepted')
        .get()

    const contactUids = new Set<string>()
    sentSnap.docs.forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => contactUids.add((d.data() as DbContact).toUserId))
    receivedSnap.docs.forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => contactUids.add((d.data() as DbContact).fromUserId))

    const users = await Promise.all(
        [...contactUids].map((contactUid: string) =>
            db.collection('users').doc(contactUid).get().then((s: FirebaseFirestore.DocumentSnapshot) => {
                if (!s.exists) return null
                return toApiUser(s.data() as import('../types').DbUser)
            })
        )
    )

    return users.filter((u: ApiUser | null): u is ApiUser => u !== null)
}

/** Get pending incoming contact requests for a user */
export async function getPendingRequests(uid: string): Promise<
    { requestId: string; fromUser: ApiUser; createdAt: string }[]
> {
    const snap = await db
        .collection(REQUESTS)
        .where('toUserId', '==', uid)
        .where('status', '==', 'pending')
        .get()

    const results = await Promise.all(
        snap.docs.map(async (d) => {
            const req = d.data() as DbContact
            const fromUser = await getUserById(req.fromUserId)
            if (!fromUser) return null
            return {
                requestId: req.requestId,
                fromUser,
                createdAt: req.createdAt.toDate().toISOString(),
                _ts: req.createdAt.toMillis(), // helper for sorting
            }
        })
    )

    return results
        .filter((r): r is any => r !== null)
        .sort((a, b) => b._ts - a._ts)
        .map(({ _ts, ...r }) => r)
}

/** Delete a contact relationship between two users */
export async function deleteContactRelationship(
    uid: string,
    contactUid: string
): Promise<void> {
    // Find the accepted request between the two users (either direction)
    const snap = await db
        .collection(REQUESTS)
        .where('fromUserId', 'in', [uid, contactUid])
        .where('toUserId', 'in', [uid, contactUid])
        .where('status', '==', 'accepted')
        .limit(1)
        .get()

    if (snap.empty) throw new Error('Contact relationship not found')

    await snap.docs[0].ref.delete()
}
