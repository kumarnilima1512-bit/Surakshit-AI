import { jwtVerify } from 'jose'

export type AuthUser = {
  userId: number
  role: 'ADMIN' | 'COMMANDER' | 'OFFICER' | 'PERSONNEL'
  email: string
}

export async function getAuthUser(event: any): Promise<AuthUser> {
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const secret = process.env.AUTH_SECRET

  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'AUTH_SECRET is not configured',
    })
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    )

    if (
      typeof payload.userId !== 'number' ||
      typeof payload.role !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      throw new Error('Invalid token payload')
    }

    return {
      userId: payload.userId,
      role: payload.role as AuthUser['role'],
      email: payload.email,
    }
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired authentication',
    })
  }
}