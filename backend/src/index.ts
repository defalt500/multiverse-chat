// Main entry point for Multiverse Chat backend
// Initializes Firebase, Express, Socket.io, mounts all routes

import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

import { authRouter } from './routes/auth'
import { usersRouter } from './routes/users'
import { contactsRouter } from './routes/contacts'
import { conversationsRouter } from './routes/conversations'
import { messagesRouter } from './routes/messages'
import { aiRouter } from './routes/ai'
import { backupRouter } from './routes/backup'
import { errorHandler } from './middlewares/errorHandler'
import { generalLimiter, authLimiter, messageLimiter, adminLimiter } from './middlewares/rateLimiter'
import { registerSocketHandlers } from './sockets/chatSocket'
import { seedDefaultCharacters } from './services/aiCharacterService'
import { seedDefaultUsers } from './services/seederService'
import { startBackupScheduler } from './services/backupScheduler'

const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const isProd = process.env.NODE_ENV === 'production'

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express()
const httpServer = http.createServer(app)

// ─── Security Headers (Helmet) ────────────────────────────────────────────────

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https:', 'wss:'],
            fontSrc: ["'self'", 'https:'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: isProd ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false, // Allow Firebase SDKs to load
}))

// Disable X-Powered-By (helmet already does this, but be explicit)
app.disable('x-powered-by')

// ─── CORS ─────────────────────────────────────────────────────────────────────

// In production: only allow the configured CLIENT_URL and Firebase Hosting origins
// In development: also allow localhost and private LAN IPs for mobile testing
const isAllowedOrigin = (origin: string | undefined): boolean => {
    if (!origin) return !isProd  // curl/Postman only allowed in dev
    if (origin === CLIENT_URL) return true
    // Firebase Hosting: *.web.app and *.firebaseapp.com
    if (/^https:\/\/[\w-]+\.web\.app$/.test(origin)) return true
    if (/^https:\/\/[\w-]+\.firebaseapp\.com$/.test(origin)) return true
    if (!isProd) {
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true
        if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true
        // Private subnets for local mobile testing
        if (/^https?:\/\/(192\.168|10\.\d+|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+(:\d+)?$/.test(origin)) return true
    }
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

app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ─── Root Route ──────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
    res.json({
        message: 'Backend working ✅',
        app: 'Multiverse Chat API',
        version: '1.0.0',
    })
})

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        app: 'Multiverse Chat API',
        timestamp: new Date().toISOString(),
    })
})


// ─── API Routes (with granular rate limits) ───────────────────────────────────

app.use('/api/auth', authLimiter, authRouter)
app.use('/api/messages', messageLimiter, messagesRouter)
app.use('/api/backups', adminLimiter, backupRouter)

// General limiter covers the remaining API routes
app.use('/api', generalLimiter)
app.use('/api/users', usersRouter)
app.use('/api/contacts', contactsRouter)
app.use('/api/conversations', conversationsRouter)
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
    maxHttpBufferSize: 64 * 1024, // 64KB max payload per socket message
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

    // Start automatic backup scheduler (every 6 hours)
    startBackupScheduler()
})

export { io }
