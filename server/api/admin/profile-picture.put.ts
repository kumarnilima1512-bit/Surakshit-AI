import { requireRole } from '../../utils/authorization'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    profilePicture?: string | null
  }>(event)

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

  const profilePicture =
    body.profilePicture?.trim() || null

  const updatedUser = await db.orm.public.User
    .where({ id: user.userId })
    .update({
      profilePicture,
    })

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Admin profile not found',
    })
  }

  return {
    success: true,
    message: profilePicture
      ? 'Profile picture updated successfully'
      : 'Profile picture removed successfully',
    profilePicture: updatedUser.profilePicture,
  }
})