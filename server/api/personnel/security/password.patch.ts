import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'
import { hashPassword, verifyPassword } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  const body = await readBody<{
    currentPassword?: string
    newPassword?: string
  }>(event)

  if (!body?.currentPassword || !body?.newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password and new password are required',
    })
  }

  if (body.newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must contain at least 8 characters',
    })
  }

  if (body.currentPassword === body.newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be different from current password',
    })
  }

  const user = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User account not found',
    })
  }

  const validPassword = await verifyPassword(
    body.currentPassword,
    user.password,
  )

  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Current password is incorrect',
    })
  }

  const hashedPassword = await hashPassword(body.newPassword)

  await db.orm.public.User
    .where({
      id: authUser.userId,
    })
    .update({
      password: hashedPassword,
    })

  return {
    success: true,
    message: 'Password updated successfully',
  }
})

