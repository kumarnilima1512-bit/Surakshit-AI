import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

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

  if (authUser.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
    })
  }

  const body = await readBody<{
    personnelId?: string
    type?: string
    dueDate?: string
  }>(event)

  const personnelIdRaw = body.personnelId?.trim()
  const dueDate = body.dueDate?.trim()
  const type = body.type?.trim() || 'Welfare Check-in'

  if (!personnelIdRaw || !dueDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Personnel ID and due date are required',
    })
  }

  const personnelId = Number(
    personnelIdRaw.replace(/\D/g, ''),
  )

  if (!Number.isInteger(personnelId) || personnelId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid personnel ID',
    })
  }

  const scheduledAt = new Date(
    `${dueDate}T00:00:00+05:30`,
  )

  if (Number.isNaN(scheduledAt.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid due date',
    })
  }

  const commander = await db.orm.public.User.where({
    id: authUser.userId,
  }).first()

  if (!commander) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  const personnel = await db.orm.public.User.where({
    id: personnelId,
  }).first()

  if (!personnel || personnel.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found',
    })
  }

  const allAssignments =
    await db.orm.public.UnitAssignment.all()

  const units = await db.orm.public.Unit.all()

  const assignment = allAssignments.find(
    (item) => item.personnelId === personnel.id,
  )

  const unit = units.find(
    (item) => item.id === assignment?.unitId,
  )

  const created = await db.orm.public.FollowUp.create({
    userId: personnel.id,
    scheduledAt: scheduledAt.toISOString(),
    status: 'SCHEDULED',
    notes: type,
  })

  await db.orm.public.Notification.create({
    userId: personnel.id,
    title: 'Follow-up Scheduled',
    message: `You have been scheduled for a welfare follow-up on ${dueDate}.`,
    type: 'followup',
    isRead: false,
  })

  return {
    id: String(created.id),
    personnelId: String(personnel.id),
    personnelName: personnel.name ?? '',
    subUnit: unit?.name ?? '',
    type,
    dueDate: formatDate(created.scheduledAt),
    status: 'Upcoming' as const,
  }
})