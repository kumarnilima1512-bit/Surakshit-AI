import { db } from '../../../../../src/prisma/db'
import { getAuthUser } from '../../../../utils/auth-session'

function formatDate(value: string | null | undefined): string {
  if (!value) return ''

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

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
      statusMessage: 'Invalid follow-up ID',
    })
  }

  const body = await readBody<{
    type?: string
    dueDate?: string
  }>(event)

  const type = body.type?.trim()
  const dueDate = body.dueDate?.trim()

  if (!type || !dueDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Type and due date are required',
    })
  }

  const scheduledAt = new Date(`${dueDate}T00:00:00+05:30`)

  if (Number.isNaN(scheduledAt.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid due date',
    })
  }

  const followUp = await db.orm.public.FollowUp.where({
    id,
  }).first()

  if (!followUp) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Follow-up not found',
    })
  }

  const personnel = await db.orm.public.User.where({
    id: followUp.userId,
  }).first()

  if (!personnel || personnel.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found',
    })
  }

  const updated = await db.orm.public.FollowUp
    .where({
      id,
    })
    .update({
      scheduledAt: scheduledAt.toISOString(),
      notes: type,
    })

  if (!updated) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Follow-up could not be updated',
    })
  }

  let status: 'Upcoming' | 'Overdue' | 'Completed' = 'Upcoming'

  if (updated.status === 'COMPLETED') {
    status = 'Completed'
  } else if (
    new Date(updated.scheduledAt).getTime() < Date.now()
  ) {
    status = 'Overdue'
  }

  return {
    id: String(updated.id),
    personnelId: String(updated.userId),
    personnelName: personnel.name ?? '',
    type: updated.notes || type,
    dueDate: formatDate(updated.scheduledAt),
    status,
  }
})