import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'
import { hashPassword, verifyPassword } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)

  if (user.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
    })
  }

  const body = await readBody<{
    currentPassword?: string
    newPassword?: string
  }>(event)

  if (!body.currentPassword || !body.newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password and new password are required',
    })
  }

  if (body.newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be at least 8 characters',
    })
  }

  if (body.currentPassword === body.newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'New password must be different from current password',
    })
  }

  const commander = await db.orm.public.User.where({
    id: user.userId,
  }).first()

  if (!commander) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander account not found',
    })
  }

  const passwordValid = await verifyPassword(
    body.currentPassword,
    commander.password,
  )

  if (!passwordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Current password is incorrect',
    })
  }

  const newPasswordHash = await hashPassword(body.newPassword)

  await db.orm.public.User.where({
    id: user.userId,
  }).update({
    password: newPasswordHash,
  })

  return {
    ok: true,
    message: 'Password changed successfully',
  }
})