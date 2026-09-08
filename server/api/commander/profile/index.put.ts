import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)

  if (user.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
    })
  }

  const body = await readBody<{
    name?: string
    phone?: string
    email?: string
    profilePicture?: string | null
  }>(event)

  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()

  // Validate profile picture when provided
  if (
    body.profilePicture !== null &&
    body.profilePicture !== undefined &&
    typeof body.profilePicture !== 'string'
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid profile picture',
    })
  }

  // Profile picture is optional.
  // Empty string is treated as removal.
  const profilePicture =
    body.profilePicture !== undefined
      ? body.profilePicture?.trim() || null
      : undefined

  // Profile information update
  if (name !== undefined || email !== undefined || body.phone !== undefined) {
    if (!name || !email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name and email are required',
      })
    }

    const existingUser = await db.orm.public.User.where({
      email,
    }).first()

    if (existingUser && existingUser.id !== user.userId) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A user with this email already exists',
      })
    }
  }

  const commander = await db.orm.public.User.first({
    id: user.userId,
  })

  if (!commander) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  const updatedUser = await db.orm.public.User.where({
    id: user.userId,
  }).update({
    ...(name !== undefined ? { name } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(body.phone !== undefined
      ? { phone: body.phone.trim() || null }
      : {}),
    ...(profilePicture !== undefined
      ? { profilePicture }
      : {}),
  })

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  return {
    success: true,
    message: profilePicture !== undefined
      ? profilePicture
        ? 'Profile picture updated successfully'
        : 'Profile picture removed successfully'
      : 'Profile updated successfully',

    name: updatedUser.name ?? '',
    rank: updatedUser.rank ?? 'Commander',
    serviceId: String(updatedUser.id),
    unitName: 'Unit Not Assigned',
    unitCode: 'N/A',
    email: updatedUser.email,
    phone: updatedUser.phone ?? '',
    joinedDate: updatedUser.createdAt,
    avatarUrl: updatedUser.profilePicture ?? null,
  }
})