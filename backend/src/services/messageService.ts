// Message service — Firestore CRUD for the messages subcollection

import { db } from '../config/firebase'
import { DbMessage, ApiMessage } from '../types'
import admin from 'firebase-admin'

const CONVS = 'conversations'

function msgPath(convId: string) {
    return db.collection(CONVS).doc(convId).collection('messages')
}

/** Convert Firestore message to API shape */
export function toApiMessage(doc: DbMessage, convId: string): ApiMessage {
    return {
        id: doc.messageId,
        conversationId: convId,
        senderId: doc.senderId,
        senderName: doc.senderName,
        content: doc.isDeleted ? '' : doc.content,
        type: 'text',
        timestamp: doc.timestamp.toDate().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }),
        status: doc.status,
        isDeleted: doc.isDeleted,
    }
}

/** Get paginated messages for a conversation */
export async function getMessages(
    convId: string,
    limit = 50,
    before?: admin.firestore.Timestamp
): Promise<ApiMessage[]> {
    let query = msgPath(convId).orderBy('timestamp', 'asc').limit(limit)

    if (before) {
        query = msgPath(convId)
            .orderBy('timestamp', 'asc')
            .endBefore(before)
            .limitToLast(limit)
    }

    const snap = await query.get()
    return snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => toApiMessage(d.data() as DbMessage, convId))
}

/** Save a new message to Firestore */
export async function saveMessage(
    convId: string,
    senderId: string,
    senderName: string,
    content: string
): Promise<ApiMessage> {
    const messageId = msgPath(convId).doc().id
    const now = admin.firestore.Timestamp.now()

    const msg: DbMessage = {
        messageId,
        senderId,
        senderName,
        content,
        timestamp: now,
        isDeleted: false,
        status: 'sent',
    }

    await msgPath(convId).doc(messageId).set(msg)
    return toApiMessage(msg, convId)
}

/** Soft delete a message (only the owner can delete) */
export async function softDeleteMessage(
    convId: string,
    messageId: string,
    uid: string
): Promise<void> {
    const ref = msgPath(convId).doc(messageId)
    const snap = await ref.get()
    if (!snap.exists) throw new Error('Message not found')

    const msg = snap.data() as DbMessage
    if (msg.senderId !== uid) throw new Error('Unauthorized')

    await ref.update({ isDeleted: true })
}

/** Update message delivery status */
export async function updateMessageStatus(
    convId: string,
    messageId: string,
    status: 'delivered' | 'read'
): Promise<void> {
    await msgPath(convId).doc(messageId).update({ status })
}
