import { SignJWT } from 'jose'
import { db } from '../../../src/prisma/db'
import { verifyPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    email?: string
    password?: string
  }>(event)

  if (!body?.email || !body?.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  const email = body.email.trim().toLowerCase()

  const user = await db.orm.public.User.first({
    email,
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  const validPassword = await verifyPassword(
    body.password,
    user.password
  )

  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid email or password',
    })
  }

  const secret = new TextEncoder().encode(process.env.AUTH_SECRET)

  const token = await new SignJWT({
    userId: user.id,
    role: user.role,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secret)

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return {
    success: true,
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