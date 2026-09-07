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
      statusMessage: 'Invalid follow-up ID',
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

  const followUp = await db.orm.public.FollowUp.where({
    id,
  }).first()

  if (!followUp) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Follow-up not found',
    })
  }

  const personnelAssignments =
    await db.orm.public.UnitAssignment.all()

  const belongsToCommanderUnit = personnelAssignments.some(
    (assignment) =>
      assignment.personnelId === followUp.userId &&
      commanderUnitIds.includes(assignment.unitId),
  )

  if (!belongsToCommanderUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Follow-up not found in your unit',
    })
  }

  if (followUp.status?.toUpperCase() === 'COMPLETED') {
    return {
      ok: true,
      message: 'Follow-up is already completed',
    }
  }

  await db.orm.public.FollowUp
    .where({ id })
    .update({
      status: 'COMPLETED',
    })

  return {
    ok: true,
    message: 'Follow-up completed successfully',
  }
})