// Shared TypeScript types for the backend

export interface Message {
    id: string
    content: string
    sender: 'user' | 'bot'
    timestamp: Date
}

export interface SocketMessage {
    text: string
    sender?: string
}
