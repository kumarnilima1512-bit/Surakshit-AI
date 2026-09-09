import { db } from '../../src/prisma/db'

interface CreateLoginHistoryInput {
  userId?: number | null
  ipAddress?: string | null
  device: string
  status: 'SUCCESS' | 'FAILED'
}

export async function createLoginHistory(
  input: CreateLoginHistoryInput,
) {
  return db.orm.public.LoginHistory.create({
    userId: input.userId ?? null,
    ipAddress: input.ipAddress ?? null,
    device: input.device,
    status: input.status,
  })
}

export function getClientDevice(event: any): string {
  const userAgent =
    getHeader(event, 'user-agent') || ''

  if (/android/i.test(userAgent)) {
    return 'Android'
  }

  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return 'iOS'
  }

  if (/windows/i.test(userAgent)) {
    return 'Windows'
  }

  if (/macintosh|mac os/i.test(userAgent)) {
    return 'macOS'
  }

  if (/linux/i.test(userAgent)) {
    return 'Linux'
  }

  return 'Unknown Device'
}

export function getClientIP(event: any): string | null {
  const forwardedFor = getHeader(
    event,
    'x-forwarded-for',
  )

  if (forwardedFor) {
    return forwardedFor
      .split(',')[0]
      ?.trim() || null
  }

  const realIP = getHeader(
    event,
    'x-real-ip',
  )

  if (realIP) {
    return realIP.trim()
  }

  return getRequestIP(event) ?? null
}