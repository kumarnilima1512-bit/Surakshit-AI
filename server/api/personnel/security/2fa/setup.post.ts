import { hashPassword } from '../../../../utils/auth'
import { getAuthUser } from '../../../../utils/auth-session'
import { db } from '../../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  const body = await readBody<{
    pin?: string
  }>(event)

  const pin = body?.pin?.trim()

  if (!pin || !/^\d{6}$/.test(pin)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid 6-digit security PIN is required',
    })
  }

  const user = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    })
  }

  if (user.twoFactorEnabled) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Two-factor authentication is already enabled',
    })
  }

  const pinHash = await hashPassword(pin)

  await db.orm.public.User
    .where({
      id: authUser.userId,
    })
    .update({
      twoFactorPinHash: pinHash,
      twoFactorEnabled: true,
    })

  return {
    success: true,
    message: 'Two-factor authentication enabled successfully',
  }
})

