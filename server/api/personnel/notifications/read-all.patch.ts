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

  for (const notification of notifications) {
    if (!notification.isRead) {
      await db.orm.public.Notification
        .where({
          id: notification.id,
          userId: authUser.userId,
        })
        .update({
          isRead: true,
        })
    }
  }

  return {
    success: true,
    message: 'All notifications marked as read',
  }
})