import { getAuthUser } from '../../../utils/auth-session'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Personnel access required',
    })
  }

  const notifications = await db.orm.public.Notification
    .where({
      userId: authUser.userId,
    })
    .all()

  notifications.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  )

  return {
    success: true,
    notifications,
  }
})