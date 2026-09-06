import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

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

  const personnelId = Number(body.personnelId)
  const type = body.type?.trim()
  const dueDate = body.dueDate?.trim()

  if (!Number.isInteger(personnelId) || personnelId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid personnel ID',
    })
  }

  if (!type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Follow-up type is required',
    })
  }

  if (!dueDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Due date is required',
    })
  }

  const scheduledAt = new Date(dueDate)

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

  const commanderAssignments =
    await db.orm.public.UnitAssignment.where({
      personnelId: commander.id,
    }).all()

  const commanderUnitIds = commanderAssignments.map(
    (assignment) => assignment.unitId,
  )

  const personnelAssignments =
    await db.orm.public.UnitAssignment.all()

  const belongsToCommanderUnit = personnelAssignments.some(
    (assignment) =>
      assignment.personnelId === personnelId &&
      commanderUnitIds.includes(assignment.unitId),
  )

  if (!belongsToCommanderUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found in your unit',
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

  const followUp = await db.orm.public.FollowUp.create({
    userId: personnelId,
    scheduledAt: scheduledAt.toISOString(),
    status: 'SCHEDULED',
    notes: type,
  })

  const assignment = personnelAssignments.find(
    (item) =>
      item.personnelId === personnelId &&
      commanderUnitIds.includes(item.unitId),
  )

  const units = await db.orm.public.Unit.all()

  const unit = units.find(
    (item) => item.id === assignment?.unitId,
  )

  return {
    id: String(followUp.id),
    personnelId: String(personnel.id),
    personnelName: personnel.name ?? '',
    subUnit: unit?.name ?? '',
    type: followUp.notes ?? type,
    dueDate: new Date(followUp.scheduledAt).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ),
    status: 'Upcoming',
  }
})