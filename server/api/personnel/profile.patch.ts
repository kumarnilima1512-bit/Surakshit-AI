import { db } from '../../../src/prisma/db'
import { getAuthUser } from '../../utils/auth-session'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024

function validateProfilePicture(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null || value === '') {
    return null
  }

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid profile picture',
    })
  }

  if (!value.startsWith('data:image/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Profile picture must be a valid image',
    })
  }

  const match = value.match(
    /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i,
  )

  if (!match) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only JPEG, PNG and WebP images are allowed',
    })
  }

  const base64Data = match[2]

  if (!base64Data) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Invalid image data',
  })
}

  const padding = (base64Data.match(/=*$/)?.[0].length ?? 0)
  const decodedSize = Math.floor((base64Data.length * 3) / 4) - padding

  if (decodedSize > MAX_IMAGE_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Profile picture must be 2MB or smaller',
    })
  }

  return value
}

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

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
    removeProfilePicture?: boolean
  }>(event)

  const name =
    body.name !== undefined
      ? body.name.trim()
      : undefined

  const username =
    body.username !== undefined
      ? body.username.trim()
      : undefined

  if (name !== undefined && !name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required',
    })
  }

  if (username !== undefined && !username) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username is required',
    })
  }

  if (
    username !== undefined &&
    username.length < 3
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username must be at least 3 characters',
    })
  }

  const currentUser = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!currentUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel profile not found',
    })
  }

  if (username !== undefined) {
    const existingUser = await db.orm.public.User
      .where({
        username,
      })
      .first()

    if (
      existingUser &&
      existingUser.id !== authUser.userId
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username is already taken',
      })
    }
  }

  let profilePicture: string | null | undefined

  if (body.removeProfilePicture === true) {
    profilePicture = null
  } else {
    profilePicture = validateProfilePicture(
      body.profilePicture,
    )
  }

  const updatedUser = await db.orm.public.User
    .where({
      id: authUser.userId,
    })
    .update({
      ...(name !== undefined
        ? { name }
        : {}),

      ...(username !== undefined
        ? { username }
        : {}),

      ...(profilePicture !== undefined
        ? { profilePicture }
        : {}),
    })

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel profile not found',
    })
  }

  return {
    success: true,
    message:
      profilePicture !== undefined
        ? profilePicture
          ? 'Profile picture updated successfully'
          : 'Profile picture removed successfully'
        : 'Profile updated successfully',

    profile: {
      id: updatedUser.id,
      name: updatedUser.name ?? '',
      username: updatedUser.username ?? '',
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture ?? null,
    },
  }
})

