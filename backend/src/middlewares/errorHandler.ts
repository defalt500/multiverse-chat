// Global error handler middleware
// Catches thrown errors from controllers and returns consistent JSON

import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
    status?: number
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const status = err.status || 500
    const message = err.message || 'Internal server error'

    console.error(`[ERROR] ${status}: ${message}`)
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack)
    }

    res.status(status).json({ error: message })
}

/** Helper to create errors with a specific status code */
export function createError(message: string, status: number): AppError {
    const err: AppError = new Error(message)
    err.status = status
    return err
}
