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

  const body = await readBody<{ text?: string }>(event)

  const text = body.text?.trim()

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Note text is required',
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

  const belongsToOfficerUnit = allAssignments.some(
    (assignment) =>
      assignment.personnelId === id &&
      officerUnitIds.includes(assignment.unitId),
  )

  if (!belongsToOfficerUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found in your unit',
    })
  }

  const personnel = await db.orm.public.User.where({
    id,
  }).first()

  if (!personnel || personnel.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found',
    })
  }

  await db.orm.public.WelfareNote.create({
    personnelId: personnel.id,
    authorId: officer.id,
    text,
  })

  return {
    ok: true,
  }
})