// Main entry point for Multiverse Chat backend
// Initializes Firebase, Express, Socket.io, mounts all routes

import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import { authRouter } from './routes/auth'
import { usersRouter } from './routes/users'
import { contactsRouter } from './routes/contacts'
import { conversationsRouter } from './routes/conversations'
import { messagesRouter } from './routes/messages'
import { aiRouter } from './routes/ai'
import { errorHandler } from './middlewares/errorHandler'
import { generalLimiter } from './middlewares/rateLimiter'
import { registerSocketHandlers } from './sockets/chatSocket'
import { seedDefaultCharacters } from './services/aiCharacterService'
import { seedDefaultUsers } from './services/seederService'

const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express()
const httpServer = http.createServer(app)

// ─── CORS ─────────────────────────────────────────────────────────────────────

// Accept localhost AND any private-network IP (for mobile access on LAN)
const isAllowedOrigin = (origin: string | undefined): boolean => {
    if (!origin) return true                                          // curl / Postman
    if (origin === CLIENT_URL) return true                            // Deployed frontend
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true    // localhost:*
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true // loopback
    // Private subnets: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
    if (/^https?:\/\/(192\.168|10\.\d+|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+(:\d+)?$/.test(origin)) return true
    return false
}

app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true)
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}))


// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Rate Limiting ────────────────────────────────────────────────────────────

app.use('/api', generalLimiter)

// ─── Root Route ──────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
    res.json({
        message: 'Backend working ✅',
        app: 'Multiverse Chat API',
        version: '1.0.0',
        docs: '/health',
        api: '/api/*',
    })
})

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        app: 'Multiverse Chat API',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    })
})


// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/contacts', contactsRouter)
app.use('/api/conversations', conversationsRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/ai', aiRouter)

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Socket.io ────────────────────────────────────────────────────────────────

const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) callback(null, true)
            else callback(new Error(`CORS: origin ${origin} not allowed`))
        },
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
})

registerSocketHandlers(io)

// ─── Start Server ─────────────────────────────────────────────────────────────

httpServer.listen(PORT, async () => {
    console.log(`\n🚀 Multiverse Chat API running on http://localhost:${PORT}`)
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
    console.log(`   CORS origin : ${CLIENT_URL}`)
    console.log(`   Health check: http://localhost:${PORT}/health\n`)

    // Seed AI characters and default users (admin1, test1, test2)
    await seedDefaultCharacters()
    await seedDefaultUsers()
})

export { io }
