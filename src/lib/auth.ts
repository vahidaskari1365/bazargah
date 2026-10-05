import crypto from 'crypto'
import { db } from './db'

const SECRET = process.env.AUTH_SECRET || 'bazargah-secret-key-2026'

export interface SessionPayload {
  userId: string
  phone: string
  iat: number
}

/** Create signed session token (HMAC-based, no deps) */
export function createToken(userId: string, phone: string): string {
  const payload: SessionPayload = { userId, phone, iat: Date.now() }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

/** Verify token and return payload or null */
export function verifyToken(token?: string | null): SessionPayload | null {
  if (!token) return null
  const [data, sig] = token.split('.')
  if (!data || !sig) return null
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  if (sig !== expected) return null
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString())
  } catch {
    return null
  }
}

/** Get current user from Authorization header */
export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  const payload = verifyToken(token)
  if (!payload) return null
  const user = await db.user.findUnique({ where: { id: payload.userId } })
  return user
}

/** Standard 401 response */
export function unauthorized() {
  return Response.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 })
}

export function parseRoles(roles: string): string[] {
  try {
    const r = JSON.parse(roles)
    return Array.isArray(r) ? r : ['BUYER']
  } catch {
    return ['BUYER']
  }
}
