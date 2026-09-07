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

  const user = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  if (user.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  /*
   * Notification preferences are represented using
   * the existing Notification records.
   *
   * If no preference record exists yet, defaults are used.
   */
  const notifications =
    await db.orm.public.Notification.where({
      userId: user.id,
    }).all()

  const preferenceTypes = new Set(
    notifications.map(
      (notification) => notification.type,
    ),
  )

  return {
    officer: {
      name: user.name ?? '',
      role: 'Welfare Officer',
      avatarUrl: user.profilePicture ?? null,
    },

    twoFactorEnabled:
      user.twoFactorEnabled ?? false,

    notifications: {
      highRiskAlerts:
        preferenceTypes.has('high-risk-alerts'),

      followUpReminders:
        preferenceTypes.has('followup-reminders'),

      weeklySummary:
        preferenceTypes.has('weekly-summary'),

      interventionUpdates:
        preferenceTypes.has('intervention-updates'),
    },

    /*
     * Session information requires a persistent session model.
     * Your current User model does not contain one.
     *
     * We therefore return the current authenticated session
     * as the only known session for now.
     */
    activeSessions: [
      {
        id: 'current',
        device: 'Current Browser',
        location: 'Current Session',
        lastActiveLabel: 'Active now',
        current: true,
      },
    ],
  }
})