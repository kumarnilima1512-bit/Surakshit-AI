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

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid notification ID',
    })
  }

  const body = await readBody<{ isRead?: boolean }>(event)

  if (typeof body?.isRead !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'isRead must be a boolean',
    })
  }

  const notification = await db.orm.public.Notification.first({
    id,
    userId: authUser.userId,
  })

  if (!notification) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Notification not found',
    })
  }

  const updatedNotification =
    await db.orm.public.Notification
      .where({
        id,
        userId: authUser.userId,
      })
      .update({
        isRead: body.isRead,
      })

  return {
    success: true,
    notification: updatedNotification,
  }
})