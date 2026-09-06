import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const users = await db.orm.public.User.all()
  const units = await db.orm.public.Unit.all()
  const assignments = await db.orm.public.UnitAssignment.all()
  const assessments = await db.orm.public.Assessment.all()
  const posts = await db.orm.public.Post.all()
  const notifications = await db.orm.public.Notification.all()

  return {
    success: true,
    analytics: {
      users: users.length,
      units: units.length,
      assignments: assignments.length,
      assessments: assessments.length,
      posts: posts.length,
      notifications: notifications.length,
    },
  }
})