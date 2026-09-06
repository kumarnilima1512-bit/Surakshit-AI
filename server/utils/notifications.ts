import { db } from '../../src/prisma/db'

type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'DANGER'
  | 'SYSTEM'

interface CreateNotificationInput {
  userId: number
  title: string
  message: string
  type?: NotificationType
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
}: CreateNotificationInput) {
  return await db.orm.public.Notification.create({
    userId,
    title,
    message,
    type,
  })
}