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
 * Generate an AI reply using Gemini.
 * @param systemPrompt - The character's personality/system prompt
 * @param history - Recent conversation history for context (user/assistant turns)
 * @param userMessage - The latest user message
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

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 1024,
        }
    })

    return response.text || ''
}

export default ai
