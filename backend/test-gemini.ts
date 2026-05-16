import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function simulateFullFlow() {
    console.log('=== API KEY CHECK ===');
    console.log('API KEY (first 5):', process.env.GEMINI_API_KEY?.slice(0, 5));

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Simulate empty history (first message)
    const userMessage = 'What is calculus?';
    const systemPrompt = 'You are a math assistant. Only answer math questions. If not math, say Solo puedo ayudarte con temas de matemáticas.';

    const contents = [{ role: 'user', parts: [{ text: userMessage }] }];

    console.log('=== CALLING GEMINI ===');
    console.log('Model: gemini-2.5-flash');
    console.log('Contents count:', contents.length);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction: systemPrompt, maxOutputTokens: 1024 }
    });

    console.log('=== RESPONSE ===');
    console.log('response.text:', response.text);
    console.log('Is string:', typeof response.text === 'string');

    // Now test with 2 prior messages (history slice issue)
    console.log('\n=== TEST WITH HISTORY (1 prior exchange) ===');
    const prior = [
        { role: 'user', parts: [{ text: 'Hello' }] },
        { role: 'model', parts: [{ text: 'Hi, how can I help with math?' }] },
    ];
    const contents2 = [...prior, { role: 'user', parts: [{ text: '2+2?' }] }];
    const r2 = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents2,
        config: { systemInstruction: systemPrompt, maxOutputTokens: 100 }
    });
    console.log('With history result:', r2.text);
}

simulateFullFlow().catch(e => {
    console.error('FULL ERROR:', e);
    process.exit(1);
});
