import { requireRole } from '../../utils/authorization'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    name?: string
    username?: string
  }>(event)

  const existingUser = await db.orm.public.User.first({
    id: user.userId,
  })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Admin profile not found',
    })
  }

  const name =
    body.name !== undefined
      ? body.name.trim() || null
      : existingUser.name

  const username =
    body.username !== undefined
      ? body.username.trim() || null
      : existingUser.username

  if (username && username !== existingUser.username) {
    const duplicate = await db.orm.public.User.first({
      username,
    })

    if (duplicate && duplicate.id !== existingUser.id) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already exists',
      })
    }
  }

  const updatedUser = await db.orm.public.User
    .where({ id: user.userId })
    .update({
      name,
      username,
    })

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Unable to update profile',
    })
  }

  return {
    success: true,
    message: 'Profile updated successfully',
    profile: {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      name: updatedUser.name,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    },
  }
})