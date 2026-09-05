import { getAuthUser } from '../../utils/auth-session'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  // Only personnel can update their own profile
  if (authUser.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Personnel access required',
    })
  }

  const body = await readBody<{
    name?: string
    username?: string
    profilePicture?: string | null
  }>(event)

  const name = body?.name?.trim()
  const username = body?.username?.trim()

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required',
    })
  }

  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username is required',
    })
  }

  // Find the logged-in personnel
  const user = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel account not found',
    })
  }

  // Check whether another user already uses this username
  const existingUser = await db.orm.public.User.first({
    username,
  })

  if (existingUser && existingUser.id !== user.id) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Username is already in use',
    })
  }

  // Prisma 8 / Prisma Next syntax:
  // where(...) -> update(...)
  const updatedUser = await db.orm.public.User
    .where({ id: user.id })
    .update({
      name,
      username,
      profilePicture:
        body.profilePicture === undefined
          ? user.profilePicture
          : body.profilePicture,
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
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      username: updatedUser.username,
      profilePicture: updatedUser.profilePicture,
      role: updatedUser.role,
    },
  }
})