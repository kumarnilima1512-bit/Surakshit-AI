import { SignJWT } from 'jose'
import { db } from '../../../src/prisma/db'
import { verifyPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    userId?: string
    password?: string
    twoFactorCode?: string
  }>(event)

  const userId = body?.userId?.trim()
  const password = body?.password
  const twoFactorCode = body?.twoFactorCode?.trim()

  // --------------------------------------------------
  // BASIC VALIDATION
  // --------------------------------------------------

  if (!userId || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID and password are required',
    })
  }

  // --------------------------------------------------
  // FIND USER
  // Supports both email and username
  // --------------------------------------------------

  let user = await db.orm.public.User.first({
    email: userId.toLowerCase(),
  })

  if (!user) {
    user = await db.orm.public.User.first({
      username: userId,
    })
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  // --------------------------------------------------
  // VERIFY PASSWORD
  // --------------------------------------------------

  const validPassword = await verifyPassword(
    password,
    user.password,
  )

  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  // --------------------------------------------------
  // TWO-FACTOR AUTHENTICATION
  // --------------------------------------------------

  if (user.twoFactorEnabled) {

    // PIN not supplied yet
    if (!twoFactorCode) {
      return {
        success: true,
        requiresTwoFactor: true,
        message: '6-digit security PIN required',
      }
    }

    // PIN must contain exactly 6 digits
    if (!/^\d{6}$/.test(twoFactorCode)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'A valid 6-digit security PIN is required',
      })
    }

    // PIN hash missing
    if (!user.twoFactorPinHash) {
      throw createError({
        statusCode: 500,
        statusMessage:
          'Two-factor authentication is enabled but the security PIN is not configured',
      })
    }

    // Verify PIN against stored hash
    const validPin = await verifyPassword(
      twoFactorCode,
      user.twoFactorPinHash,
    )

    if (!validPin) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid security PIN',
      })
    }
  }

  // --------------------------------------------------
  // AUTH SECRET
  // --------------------------------------------------

  const authSecret = process.env.AUTH_SECRET

  if (!authSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'AUTH_SECRET is not configured',
    })
  }

  // --------------------------------------------------
  // CREATE SESSION
  // --------------------------------------------------

  const secret = new TextEncoder().encode(authSecret)

  const token = await new SignJWT({
    userId: user.id,
    role: user.role,
    email: user.email,
  })
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secret)

  // --------------------------------------------------
  // AUTH COOKIE
  // --------------------------------------------------

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  // --------------------------------------------------
  // SUCCESS
  // --------------------------------------------------

  return {
    success: true,
    requiresTwoFactor: false,
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  }
})

