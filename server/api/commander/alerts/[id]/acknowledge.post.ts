import { db } from '../../../../../src/prisma/db'
import { getAuthUser } from '../../../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
    })
  }

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid alert ID',
    })
  }

  const notification = await db.orm.public.Notification.where({
    id,
  }).first()

  if (!notification) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Alert not found',
    })
  }

  const assignments = await db.orm.public.UnitAssignment.where({
    personnelId: authUser.userId,
  }).all()

  const commanderUnitIds = assignments.map(
    (assignment) => assignment.unitId,
  )

  const personnelAssignments =
    await db.orm.public.UnitAssignment.where({
      personnelId: notification.userId,
    }).all()

  const belongsToCommanderUnit = personnelAssignments.some(
    (assignment) => commanderUnitIds.includes(assignment.unitId),
  )

  if (!belongsToCommanderUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Alert not found in your unit',
    })
  }

  await db.orm.public.Notification
    .where({ id })
    .update({
      isRead: true,
    })

  return {
    ok: true,
  }
})

