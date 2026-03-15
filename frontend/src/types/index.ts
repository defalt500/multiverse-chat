// Shared TypeScript types for the frontend

export interface Message {
    id: string
    content: string
    sender: 'user' | 'bot'
    timestamp: Date
}

export interface User {
    id: string
    name: string
}
