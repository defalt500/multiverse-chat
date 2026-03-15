import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '../store/useAppStore'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null)
    const setConnected = useAppStore((state) => state.setConnected)

    useEffect(() => {
        socketRef.current = io(SOCKET_URL)

        socketRef.current.on('connect', () => {
            setConnected(true)
            console.log('Socket connected:', socketRef.current?.id)
        })

        socketRef.current.on('disconnect', () => {
            setConnected(false)
            console.log('Socket disconnected')
        })

        return () => {
            socketRef.current?.disconnect()
        }
    }, [setConnected])

    return socketRef.current
}
