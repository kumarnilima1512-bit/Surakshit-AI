import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID',
    })
  }

  const body = await readBody<{
    email?: string
    username?: string
    name?: string
    password?: string
    role?: 'ADMIN' | 'COMMANDER' | 'OFFICER' | 'PERSONNEL'
  }>(event)

  const existingUser = await db.orm.public.User.first({ id })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  const email = body.email?.trim().toLowerCase() || existingUser.email

  if (email !== existingUser.email) {
    const duplicate = await db.orm.public.User.first({ email })

    if (duplicate && duplicate.id !== id) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A user with this email already exists',
      })
    }
  }

  const updatedUser = await db.orm.public.User
    .where({ id })
    .update({
      email,
      username:
        body.username !== undefined
          ? body.username.trim() || null
          : existingUser.username,
      name:
        body.name !== undefined
          ? body.name.trim() || null
          : existingUser.name,
      password:
        body.password !== undefined && body.password.trim()
          ? body.password.trim()
          : existingUser.password,
      role: body.role || existingUser.role,
    })

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  return {
    success: true,
    message: 'User updated successfully',
    user: updatedUser,
  }
})