// AI service — generates replies using Gemini with conversation context

import { generateAIReply, ChatMessage } from '../config/ai'
import { db } from '../config/firebase'
import { DbMessage } from '../types'

const CONVS = 'conversations'

/**
 * Generate an AI reply for a conversation.
 * Fetches the last 20 messages for context (avoids token overflow).
 */
export async function generateReplyForConversation(
    convId: string,
    systemPrompt: string,
    userMessage: string,
    aiUserId: string
): Promise<string> {
    // Fetch recent history for context
    const historySnap = await db
        .collection(CONVS)
        .doc(convId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get()

    // Reverse to chronological order, exclude the just-sent user message (last one)
    const historyDocs = historySnap.docs.reverse()

    const history: ChatMessage[] = historyDocs
        .slice(0, -1)
        .map((d: FirebaseFirestore.QueryDocumentSnapshot) => {
            const msg = d.data() as DbMessage
            return {
                role: msg.senderId === aiUserId ? 'assistant' : 'user',
                content: msg.isDeleted ? '[deleted]' : msg.content,
            } as ChatMessage
        })

    return generateAIReply(systemPrompt, history, userMessage)
}
