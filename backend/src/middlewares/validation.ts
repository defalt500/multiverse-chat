// Input validation & sanitization utilities
// Pure TypeScript — no extra dependencies

/** Strip HTML tags and dangerous characters */
export function sanitizeString(s: unknown): string {
    if (typeof s !== 'string') return ''
    return s
        .replace(/<[^>]*>/g, '')         // remove HTML tags
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove control chars
        .trim()
}

/** Validate username: 3-30 chars, letters/numbers/underscores/hyphens only */
export function validateUsername(s: unknown): { valid: boolean; error?: string } {
    const str = sanitizeString(s)
    if (!str) return { valid: false, error: 'Username is required' }
    if (str.length < 3) return { valid: false, error: 'Username must be at least 3 characters' }
    if (str.length > 30) return { valid: false, error: 'Username must be 30 characters or fewer' }
    if (!/^[a-zA-Z0-9_-]+$/.test(str)) {
        return { valid: false, error: 'Username may only contain letters, numbers, underscores, and hyphens' }
    }
    return { valid: true }
}

/** Validate email address (RFC-5321 compatible) */
export function validateEmail(s: unknown): { valid: boolean; error?: string } {
    if (typeof s !== 'string' || !s.trim()) return { valid: false, error: 'Email is required' }
    const email = s.trim().toLowerCase()
    if (email.length > 254) return { valid: false, error: 'Email is too long' }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/
    if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email address' }
    return { valid: true }
}

/** Validate chat message content */
export function validateMessageContent(s: unknown): { valid: boolean; error?: string; sanitized?: string } {
    if (typeof s !== 'string') return { valid: false, error: 'Message content is required' }
    const trimmed = sanitizeString(s)
    if (!trimmed) return { valid: false, error: 'Message cannot be empty' }
    if (trimmed.length > 4000) return { valid: false, error: 'Message exceeds maximum length of 4000 characters' }
    return { valid: true, sanitized: trimmed }
}

/** Validate a Firestore document ID (safe characters, reasonable length) */
export function validateFirestoreId(s: unknown): { valid: boolean; error?: string } {
    if (typeof s !== 'string' || !s.trim()) return { valid: false, error: 'ID is required' }
    if (s.length > 128) return { valid: false, error: 'ID is too long' }
    if (!/^[a-zA-Z0-9_\-.]+$/.test(s)) return { valid: false, error: 'Invalid ID format' }
    return { valid: true }
}

/** Validate a URL must use https:// */
export function validateHttpsUrl(s: unknown): { valid: boolean; error?: string } {
    if (typeof s !== 'string' || !s.trim()) return { valid: false, error: 'URL is required' }
    if (!s.startsWith('https://')) return { valid: false, error: 'URL must use HTTPS' }
    try {
        new URL(s)
        return { valid: true }
    } catch {
        return { valid: false, error: 'Invalid URL format' }
    }
}

/** Validate and sanitize a bio/description field */
export function validateBio(s: unknown): { valid: boolean; error?: string; sanitized?: string } {
    if (s === undefined || s === null || s === '') return { valid: true, sanitized: '' }
    const str = sanitizeString(s)
    if (str.length > 300) return { valid: false, error: 'Bio must be 300 characters or fewer' }
    return { valid: true, sanitized: str }
}

/** Validate a display name */
export function validateDisplayName(s: unknown): { valid: boolean; error?: string; sanitized?: string } {
    if (typeof s !== 'string' || !s.trim()) return { valid: false, error: 'Name is required' }
    const str = sanitizeString(s)
    if (str.length < 2) return { valid: false, error: 'Name must be at least 2 characters' }
    if (str.length > 50) return { valid: false, error: 'Name must be 50 characters or fewer' }
    return { valid: true, sanitized: str }
}

/** Validate pagination params safely */
export function validatePagination(page: unknown, limit: unknown): { page: number; limit: number } {
    const p = Math.max(1, parseInt(String(page)) || 1)
    const l = Math.min(100, Math.max(1, parseInt(String(limit)) || 10))
    return { page: p, limit: l }
}
