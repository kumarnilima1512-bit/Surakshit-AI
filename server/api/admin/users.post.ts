import { requireRole } from '../../utils/authorization'
import { hashPassword } from '../../utils/auth'
import { db } from '../../../src/prisma/db'

const allowedRoles = ['COMMANDER', 'OFFICER', 'PERSONNEL'] as const

export default defineEventHandler(async (event) => {
  // Only ADMIN can create users
  await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    email?: string
    username?: string
    name?: string
    password?: string
    role?: string
  }>(event)

  if (!body.email || !body.password || !body.role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email, password and role are required',
    })
  }

  if (!allowedRoles.includes(body.role as typeof allowedRoles[number])) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid role',
    })
  }

  const email = body.email.trim().toLowerCase()

  if (body.password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters',
    })
  }

  const existingUser = await db.orm.public.User.first({
    
      email,
    
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A user with this email already exists',
    })
  }

  const passwordHash = await hashPassword(body.password)

  const user = await db.orm.public.User.create({
    
      email,
      username: body.username?.trim() || null,
      name: body.name?.trim() || null,
      password: passwordHash,
      role: body.role as typeof allowedRoles[number],
    
  })

  return {
    success: true,
    message: `${user.role} account created successfully`,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  }
})