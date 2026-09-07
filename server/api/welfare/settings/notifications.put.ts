import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  const body = await readBody<{
    emailAlerts?: boolean
    assessmentAlerts?: boolean
    followUpReminders?: boolean
    systemUpdates?: boolean
  }>(event)

  const preferences = {
    emailAlerts: body?.emailAlerts === true,
    assessmentAlerts: body?.assessmentAlerts === true,
    followUpReminders: body?.followUpReminders === true,
    systemUpdates: body?.systemUpdates === true,
  }

  await db.orm.public.User.where({
    id: authUser.userId,
  }).update({
    notificationPreferences: preferences,
  })

  return {
    success: true,
    notifications: preferences,
  }
})