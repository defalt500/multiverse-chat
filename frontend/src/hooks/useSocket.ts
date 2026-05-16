import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        socketRef.current = io(SOCKET_URL)

        socketRef.current.on('connect', () => {
            console.log('Socket connected:', socketRef.current?.id)
        })

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected')
        })

        return () => {
            socketRef.current?.disconnect()
        }
    }, [])

    return socketRef.current
}
