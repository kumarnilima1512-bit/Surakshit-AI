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
      statusMessage: 'Invalid follow-up ID',
    })
  }

  const officer = await db.orm.public.User.where({
    id: authUser.userId,
  }).first()

  if (!officer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  const officerAssignments = await db.orm.public.UnitAssignment.where({
    personnelId: officer.id,
  }).all()

  const officerUnitIds = officerAssignments.map((assignment) => assignment.unitId)

  const allAssignments = await db.orm.public.UnitAssignment.all()

  const followUp = await db.orm.public.FollowUp.where({
    id,
  }).first()

  if (!followUp) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Follow-up not found',
    })
  }

  const belongsToOfficerUnit = allAssignments.some(
    (assignment) =>
      assignment.personnelId === followUp.userId &&
      officerUnitIds.includes(assignment.unitId),
  )

  if (!belongsToOfficerUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Follow-up not found',
    })
  }

  await db.orm.public.FollowUp.where({
    id,
  }).update({
    status: 'COMPLETED',
  })

  return {
    ok: true,
  }
})