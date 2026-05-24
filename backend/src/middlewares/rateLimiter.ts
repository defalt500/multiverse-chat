// Rate limiting middleware using express-rate-limit

import rateLimit from 'express-rate-limit'

/** General API rate limiter: 100 requests per 15 minutes */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
})

/** Strict limiter for AI endpoints: 20 requests per minute */
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI rate limit reached, please wait before sending more messages.' },
})

/** Auth limiter: 10 requests per 15 minutes (prevent brute force) */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' },
    skipSuccessfulRequests: false,
})

/** Message limiter: 30 requests per minute */
export const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Message rate limit reached, please slow down.' },
})

/** Admin limiter: 50 requests per 15 minutes */
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Admin API rate limit reached, please try again later.' },
})
