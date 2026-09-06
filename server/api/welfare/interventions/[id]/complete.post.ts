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
      statusMessage: 'Invalid intervention ID',
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

  const recommendation = await db.orm.public.Recommendation.where({
    id,
  }).first()

  if (!recommendation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Intervention not found',
    })
  }

  const belongsToOfficerUnit = allAssignments.some(
    (assignment) =>
      assignment.personnelId === recommendation.userId &&
      officerUnitIds.includes(assignment.unitId),
  )

  if (!belongsToOfficerUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Intervention not found',
    })
  }

  await db.orm.public.Recommendation.where({
    id,
  }).update({
    isActive: false,
  })

  return {
    ok: true,
  }
})