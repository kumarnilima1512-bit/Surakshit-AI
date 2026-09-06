import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)

  if (user.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
    })
  }

  const commander = await db.orm.public.User.first({
    id: user.userId,
  })

  if (!commander) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander account not found',
    })
  }

  return {
    commander: {
      name: commander.name ?? commander.email,
      rank: 'Commander',
      avatarUrl: null,
    },

    // These will be connected to real security models/fields later.
    twoFactorEnabled: false,

    loginHistory: [],

    activeSessions: [],
  }
})