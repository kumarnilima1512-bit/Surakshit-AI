import { requireRole } from '../../utils/authorization'
import { db } from '../../../src/prisma/db'
import { compare, hash } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    email?: string
    username?: string | null
    currentPassword?: string
    newPassword?: string
  }>(event)

  const existingUser = await db.orm.public.User.first({
    id: user.userId,
  })

  if (!existingUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Admin account not found',
    })
  }

  const email =
    body.email !== undefined
      ? body.email.trim().toLowerCase()
      : existingUser.email

  const username =
    body.username !== undefined
      ? body.username?.trim() || null
      : existingUser.username

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required',
    })
  }

  // Check duplicate email
  if (email !== existingUser.email) {
    const duplicateEmail = await db.orm.public.User.first({
      email,
    })

    if (duplicateEmail && duplicateEmail.id !== existingUser.id) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already exists',
      })
    }
  }

  // Check duplicate username
  if (username && username !== existingUser.username) {
    const duplicateUsername = await db.orm.public.User.first({
      username,
    })

    if (
      duplicateUsername &&
      duplicateUsername.id !== existingUser.id
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username already exists',
      })
    }
  }

  let password = existingUser.password

  // Password change requested
  if (body.newPassword) {
    if (!body.currentPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password is required',
      })
    }

    if (body.newPassword.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New password must be at least 8 characters',
      })
    }

    const passwordValid = await compare(
      body.currentPassword,
      existingUser.password,
    )

    if (!passwordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Current password is incorrect',
      })
    }

    password = await hash(body.newPassword, 12)
  }

  const updatedUser = await db.orm.public.User
    .where({ id: user.userId })
    .update({
      email,
      username,
      password,
    })

  if (!updatedUser) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to update account settings',
    })
  }

  return {
    success: true,
    message: 'Account settings updated successfully',
  }
})