import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { chatRouter } from './routes/chat'

dotenv.config()

const PORT = process.env.PORT || 4000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

const app = express()
const httpServer = http.createServer(app)

const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
    },
})

// Middleware
app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

// Routes
app.use('/api/chat', chatRouter)

// Socket.io events
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    socket.on('message', (data: { text: string }) => {
        console.log('Message received:', data)
        // Echo back as placeholder
        socket.emit('message', { text: `Echo: ${data.text}`, sender: 'bot' })
    })

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`)
    })
})

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export { io }
