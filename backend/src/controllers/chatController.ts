import { Request, Response } from 'express'

// Placeholder: return empty messages list
export const getMessages = (_req: Request, res: Response): void => {
    res.json({ messages: [] })
}
