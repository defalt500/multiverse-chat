// Google Gemini AI client initialization
// Exports: generateAIReply(systemPrompt, history, userMessage) => Promise<string>

import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
})

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

/**
 * Model fallback chain — tries each model in order.
 * Falls through to the next on quota/rate-limit errors (429).
 */
const MODEL_CHAIN = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
]

function isQuotaError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false
    const msg = (err as any)?.message ?? ''
    return (
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota') ||
        (err as any)?.status === 429
    )
}

/**
 * Generate an AI reply using Gemini.
 * Tries MODEL_CHAIN in order, falling back on quota errors.
 */
export async function generateAIReply(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
): Promise<string> {
    const contents = [
        ...history.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
    ]

    let lastError: unknown
    for (const model of MODEL_CHAIN) {
        try {
            console.log(`[AI] Trying model: ${model}`)
            const response = await ai.models.generateContent({
                model,
                contents,
                config: {
                    systemInstruction: systemPrompt,
                    maxOutputTokens: 8192,
                    temperature: 0.85,
                }
            })
            console.log(`[AI] Success with model: ${model}`)
            return response.text || ''
        } catch (err) {
            if (isQuotaError(err)) {
                console.warn(`[AI] Quota exceeded for ${model}, trying next model...`)
                lastError = err
                continue
            }
            // Non-quota error — rethrow immediately
            throw err
        }
    }

    // All models exhausted
    console.error('[AI] All models quota-exceeded:', lastError)
    throw new Error('All Gemini models have reached their quota. Please try again tomorrow or upgrade your API plan.')
}

export default ai
