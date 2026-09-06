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
      statusMessage: 'Commander profile not found',
    })
  }

  return {
    name: commander.name ?? '',
    rank: 'Commander',
    serviceId: String(commander.id),
    unitName: 'Unit Not Assigned',
    unitCode: 'N/A',
    email: commander.email,
    phone: '',
    joinedDate: commander.createdAt,
    avatarUrl: null,
  }
})