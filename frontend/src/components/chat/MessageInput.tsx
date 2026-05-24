import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { getSocket } from '../../socket'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

interface Props {
    conversationId: string
}

const TYPING_THROTTLE_MS = 500   // re-emit typing every 500ms max

const MessageInput = ({ conversationId }: Props) => {
    const [text, setText] = useState('')
    const [emojiOpen, setEmojiOpen] = useState(false)
    const sendMessage = useAppStore((s) => s.sendMessage)
    const darkMode = useAppStore((s) => s.darkMode)
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastTypingEmit = useRef<number>(0)
    const pickerRef = useRef<HTMLDivElement>(null)

    // Send stop_typing when switching conversations or unmounting
    useEffect(() => {
        return () => {
            if (typingTimer.current) clearTimeout(typingTimer.current)
            const socket = getSocket()
            if (socket?.connected) socket.emit('stop_typing', { conversationId })
        }
    }, [conversationId])

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setEmojiOpen(false)
            }
        }
        if (emojiOpen) document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [emojiOpen])

    // Emit typing start (throttled)
    const emitTyping = () => {
        const socket = getSocket()
        if (!socket?.connected) return
        const now = Date.now()
        if (now - lastTypingEmit.current < TYPING_THROTTLE_MS) return
        lastTypingEmit.current = now
        socket.emit('typing', { conversationId })
    }

    // Emit stop_typing after user stops for 2 s
    // (2s gives AI time to acknowledge typing before response arrives)
    const scheduleStopTyping = () => {
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => {
            const socket = getSocket()
            if (socket?.connected) socket.emit('stop_typing', { conversationId })
        }, 2000)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value)
        emitTyping()
        scheduleStopTyping()
    }

    const handleEmojiSelect = (emoji: any) => {
        setText(prev => prev + (emoji.native || emoji.skins?.[0]?.native || ''))
        setEmojiOpen(false)
    }

    const handleSend = () => {
        const trimmed = text.trim()
        if (!trimmed) return

        // Stop typing immediately on send
        if (typingTimer.current) clearTimeout(typingTimer.current)
        const socket = getSocket()
        if (socket?.connected) socket.emit('stop_typing', { conversationId })

        sendMessage(conversationId, trimmed)
        setText('')
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
        if (e.key === 'Escape') setEmojiOpen(false)
    }

    return (
        <div className="relative px-3 md:px-4 py-3 bg-white dark:bg-dark-sidebar border-t border-gray-100 dark:border-gray-800 flex-shrink-0 pb-safe">
            {/* Emoji Picker */}
            {emojiOpen && (
                <div
                    ref={pickerRef}
                    className="absolute bottom-full right-2 md:right-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden animate-scale-in"
                    style={{ maxWidth: 'min(352px, calc(100vw - 2rem))' }}
                >
                    <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme={darkMode ? 'dark' : 'light'}
                        previewPosition="none"
                        skinTonePosition="none"
                        perLine={8}
                    />
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center bg-gray-bg dark:bg-dark-card rounded-2xl px-4 py-2.5 gap-3">
                    <input
                        type="text"
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none min-w-0"
                    />
                    <button
                        onClick={() => setEmojiOpen(v => !v)}
                        className={`text-gray-400 hover:text-primary transition-colors flex-shrink-0 ${emojiOpen ? 'text-primary' : ''}`}
                        title="Emoji"
                        type="button"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
                <button
                    onClick={handleSend}
                    className="w-11 h-11 bg-primary hover:bg-primary-dark rounded-2xl flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-md shadow-primary/30 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default MessageInput
