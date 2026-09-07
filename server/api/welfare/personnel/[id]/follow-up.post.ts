import { db } from '../../../../../src/prisma/db'
import { getAuthUser } from '../../../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid personnel ID',
    })
  }

  const body = await readBody<{ date?: string }>(event)
  const date = body?.date?.trim()

  if (!date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Follow-up date is required',
    })
  }

  /*
   * <input type="date"> sends YYYY-MM-DD.
   * Convert it explicitly using India time so the selected
   * calendar date does not shift because of timezone conversion.
   */
  const scheduledAt = new Date(`${date}T00:00:00+05:30`)

  if (Number.isNaN(scheduledAt.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid follow-up date',
    })
  }

  const officer = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!officer || officer.role !== 'OFFICER') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  /*
   * Welfare Officers can schedule follow-ups for any personnel.
   * No unit restriction is applied.
   */
  const personnel = await db.orm.public.User.first({
    id,
  })

  if (!personnel || personnel.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found',
    })
  }

  const followUp = await db.orm.public.FollowUp.create({
    userId: personnel.id,
    scheduledAt: scheduledAt.toISOString(),
    status: 'SCHEDULED',
  })

  await db.orm.public.Notification.create({
  userId: personnel.id,
  title: 'Follow-up Scheduled',
  message: `You have been scheduled for a welfare follow-up on ${date}.`,
  type: 'followup',
  isRead: false,
})

  return {
    ok: true,
    message: 'Follow-up scheduled successfully',
    followUp: {
      id: followUp.id,
      userId: followUp.userId,
      scheduledAt: followUp.scheduledAt,
      status: followUp.status,
    },
  }
})