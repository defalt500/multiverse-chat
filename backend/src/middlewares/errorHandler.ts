// Global error handler middleware
// Catches thrown errors from controllers and returns consistent JSON
// In production: hides sensitive details from client responses

import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
    status?: number
    expose?: boolean  // if true, the message is safe to send to the client
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const status = err.status || 500
    const isDev = process.env.NODE_ENV !== 'production'

    // Always log full error server-side
    console.error(`[ERROR] ${status}: ${err.message}`)
    if (isDev) console.error(err.stack)

    // In production: only expose intentional error messages
    // 4xx errors are always safe to return; 5xx are sanitized
    const clientMessage =
        isDev || status < 500 || err.expose === true
            ? err.message
            : 'Internal server error'

    res.status(status).json({ error: clientMessage })
}

/** Helper to create errors with a specific status code.
 *  Set expose=true to safely pass the message to the client even in production. */
export function createError(message: string, status: number, expose = true): AppError {
    const err: AppError = new Error(message)
    err.status = status
    err.expose = expose
    return err
}
