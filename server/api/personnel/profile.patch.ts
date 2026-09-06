import { getAuthUser } from '../../utils/auth-session'
import { db } from '../../../src/prisma/db'

import {
  mkdir,
  writeFile,
  unlink,
} from 'node:fs/promises'

import {
  existsSync,
} from 'node:fs'

import {
  extname,
  join,
} from 'node:path'

import {
  randomUUID,
} from 'node:crypto'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  // Only personnel can update their own profile
  if (authUser.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Personnel access required',
    })
  }

  // Get logged-in personnel
  const user = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel account not found',
    })
  }

  /*
   * PATCH request is multipart/form-data because
   * we are receiving an actual image file.
   */
  const parts = await readMultipartFormData(event)

  if (!parts) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid form data',
    })
  }

  let name = ''
  let username = ''
  let removeProfilePicture = false

  let uploadedFile: {
    data: Buffer
    filename: string
    type: string
  } | null = null

  for (const part of parts) {
    const fieldName = part.name

    if (!fieldName) {
      continue
    }

    // Text fields
    if (fieldName === 'name') {
      name = part.data.toString('utf-8').trim()
    }

    if (fieldName === 'username') {
      username = part.data.toString('utf-8').trim()
    }

    if (fieldName === 'removeProfilePicture') {
      removeProfilePicture =
        part.data.toString('utf-8') === 'true'
    }

    // Image file
    if (
      fieldName === 'profilePicture' &&
      part.filename &&
      part.type
    ) {
      uploadedFile = {
        data: Buffer.from(part.data),
        filename: part.filename,
        type: part.type,
      }
    }
  }

  // Validation
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

  // Check username uniqueness
  const existingUser = await db.orm.public.User.first({
    username,
  })

  if (existingUser && existingUser.id !== user.id) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Username is already in use',
    })
  }

  /*
   * Handle profile picture
   */
  let profilePicture = user.profilePicture

  // Remove existing picture
  if (removeProfilePicture) {
    profilePicture = null
  }

  /*
   * If a new image was uploaded,
   * validate and save it.
   */
  if (uploadedFile) {
    const allowedTypes: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    }

    const extension = allowedTypes[uploadedFile.type]

    if (!extension) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Invalid image format. Please use JPG, PNG, or WebP.',
      })
    }

    // Maximum 5 MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024

    if (uploadedFile.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Profile picture must be smaller than 5 MB.',
      })
    }

    // Ensure upload directory exists
    const uploadDirectory = join(
      process.cwd(),
      'public',
      'uploads',
      'profiles',
    )

    await mkdir(uploadDirectory, {
      recursive: true,
    })

    // Generate safe unique filename
    const fileName =
      `${authUser.userId}-${randomUUID()}${extension}`

    const filePath = join(
      uploadDirectory,
      fileName,
    )

    // Save file
    await writeFile(
      filePath,
      uploadedFile.data,
    )

    // URL accessible from browser
    profilePicture =
      `/uploads/profiles/${fileName}`
  }

  /*
   * Update database
   */
  const updatedUser = await db.orm.public.User
    .where({
      id: user.id,
    })
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

  /*
   * Delete old image only AFTER successful database update.
   *
   * We only delete files belonging to our own
   * /uploads/profiles/ directory.
   */
  if (
    uploadedFile &&
    user.profilePicture &&
    user.profilePicture.startsWith('/uploads/profiles/')
  ) {
    const oldFileName =
      user.profilePicture.replace(
        '/uploads/profiles/',
        '',
      )

    const oldFilePath = join(
      process.cwd(),
      'public',
      'uploads',
      'profiles',
      oldFileName,
    )

    try {
      if (existsSync(oldFilePath)) {
        await unlink(oldFilePath)
      }
    } catch (error) {
      console.warn(
        'Could not delete old profile picture:',
        error,
      )
    }
  }

  /*
   * If user removed the picture without uploading
   * a replacement, delete the old file.
   */
  if (
    removeProfilePicture &&
    !uploadedFile &&
    user.profilePicture &&
    user.profilePicture.startsWith('/uploads/profiles/')
  ) {
    const oldFileName =
      user.profilePicture.replace(
        '/uploads/profiles/',
        '',
      )

    const oldFilePath = join(
      process.cwd(),
      'public',
      'uploads',
      'profiles',
      oldFileName,
    )

    try {
      if (existsSync(oldFilePath)) {
        await unlink(oldFilePath)
      }
    } catch (error) {
      console.warn(
        'Could not delete old profile picture:',
        error,
      )
    }
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