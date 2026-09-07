import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'
import { hashPassword, verifyPassword } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  const body = await readBody<{
    currentPassword?: string
    newPassword?: string
  }>(event)

  const currentPassword = body?.currentPassword
  const newPassword = body?.newPassword

  if (!currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password and new password are required',
    })
  }

  if (newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be at least 8 characters long',
    })
  }

  if (currentPassword === newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'New password must be different from the current password',
    })
  }

  const user = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  const validPassword = await verifyPassword(
    currentPassword,
    user.password,
  )

  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Current password is incorrect',
    })
  }

  const newPasswordHash = await hashPassword(newPassword)

  await db.orm.public.User.where({
    id: user.id,
  }).update({
    password: newPasswordHash,
  })

  return {
    success: true,
    message: 'Password changed successfully',
  }
})