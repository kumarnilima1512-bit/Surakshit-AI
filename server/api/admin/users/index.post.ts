import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    email?: string
    username?: string
    name?: string
    password?: string
    role?: 'ADMIN' | 'COMMANDER' | 'OFFICER' | 'PERSONNEL'
  }>(event)

  const email = body.email?.trim().toLowerCase()
  const password = body.password?.trim()

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  const existingUser = await db.orm.public.User.first({ email })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A user with this email already exists',
    })
  }

  const user = await db.orm.public.User.create({
    email,
    username: body.username?.trim() || null,
    name: body.name?.trim() || null,
    password,
    role: body.role || 'PERSONNEL',
  })

  return {
    success: true,
    message: 'User created successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  }
})