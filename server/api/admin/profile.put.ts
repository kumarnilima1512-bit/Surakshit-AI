import { requireRole } from '../../utils/authorization'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    name?: string
    username?: string
    profilePicture?: string | null
  }>(event)

  const existingUser = await db.orm.public.User
    .where({ id: user.userId })
    .first()

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

  const profilePicture =
    body.profilePicture !== undefined
      ? body.profilePicture?.trim() || null
      : existingUser.profilePicture

  if (username && username !== existingUser.username) {
    const duplicate = await db.orm.public.User
      .where({ username })
      .first()

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
      profilePicture,
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
      profilePicture: updatedUser.profilePicture,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    },
  }
})