// AI Character service — manages AI character definitions in Firestore

import { db } from '../config/firebase'
import { DbAiCharacter, ApiAiCharacter } from '../types'
import admin from 'firebase-admin'

const CHARS = 'aiCharacters'

/** Default AI characters seeded on startup */
const DEFAULT_CHARACTERS: Omit<DbAiCharacter, 'createdAt'>[] = [
    {
        characterId: 'math',
        name: 'Math Assistant',
        personality: 'Math tutor',
        systemPrompt:
            'You are a math assistant. Only answer math questions. If the user asks something unrelated, respond: Solo puedo ayudarte con temas de matemáticas.',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Math&backgroundColor=b6e3f4',
    },
    {
        characterId: 'psychology',
        name: 'Psychology Assistant',
        personality: 'Personal help / psychology',
        systemPrompt:
            'You are a psychology assistant. Only provide emotional/personal advice. If the user asks about unrelated topics, politely redirect them to focus on their emotional well-being and refuse to answer the unrelated topic.',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Psych&backgroundColor=ffd5dc',
    },
    {
        characterId: 'finance',
        name: 'Finance Assistant',
        personality: 'Finance / money expert',
        systemPrompt:
            'You are a finance assistant. Only answer finance and money-related topics. Ignore unrelated topics entirely or politely refuse to discuss them.',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Finance&backgroundColor=c0aede',
    },
]

/** Seed default characters into Firestore if they don't exist */
export async function seedDefaultCharacters(): Promise<void> {
    try {
        for (const char of DEFAULT_CHARACTERS) {
            const ref = db.collection(CHARS).doc(char.characterId)
            const snap = await ref.get()
            if (!snap.exists) {
                const fullChar: DbAiCharacter = {
                    ...char,
                    createdAt: admin.firestore.Timestamp.now(),
                }
                await ref.set(fullChar)
                console.log(`✅ Seeded AI character: ${char.name}`)
            }
        }
    } catch (err) {
        console.warn('⚠️  Could not seed AI characters (Firebase not configured):', err)
    }
}

/** Get all available AI characters */
export async function getAllCharacters(): Promise<ApiAiCharacter[]> {
    const snap = await db.collection(CHARS).get()
    return snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = d.data() as DbAiCharacter
        return {
            id: data.characterId,
            name: data.name,
            personality: data.personality,
            avatarUrl: data.avatarUrl,
            systemPrompt: data.systemPrompt,
        }
    })
}

/** Get a single character by ID (for system prompt) */
export async function getCharacterById(
    characterId: string
): Promise<DbAiCharacter | null> {
    const snap = await db.collection(CHARS).doc(characterId).get()
    if (!snap.exists) return null
    return snap.data() as DbAiCharacter
}

/** Create a new AI character (admin) */
export async function createCharacter(
    data: Omit<DbAiCharacter, 'createdAt' | 'characterId'>
): Promise<DbAiCharacter> {
    const ref = db.collection(CHARS).doc()
    const char: DbAiCharacter = {
        characterId: ref.id,
        ...data,
        createdAt: admin.firestore.Timestamp.now(),
    }
    await ref.set(char)
    return char
}

/** Update an AI character (admin) */
export async function updateCharacter(
    characterId: string,
    updates: Partial<Pick<DbAiCharacter, 'name' | 'personality' | 'systemPrompt' | 'avatarUrl'>>
): Promise<DbAiCharacter | null> {
    const ref = db.collection(CHARS).doc(characterId)
    await ref.update(updates)
    const snap = await ref.get()
    if (!snap.exists) return null
    return snap.data() as DbAiCharacter
}

/** Delete an AI character (admin) */
export async function deleteCharacter(characterId: string): Promise<void> {
    await db.collection(CHARS).doc(characterId).delete()
}
