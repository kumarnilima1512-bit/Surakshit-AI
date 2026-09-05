import { requireRole } from '../../utils/authorization'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  const profile = await db.orm.public.User.first({
    id: user.userId,
  })

  if (!profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Admin profile not found',
    })
  }

  return {
    success: true,
    profile: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      name: profile.name,
      role: profile.role,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    },
  }
})