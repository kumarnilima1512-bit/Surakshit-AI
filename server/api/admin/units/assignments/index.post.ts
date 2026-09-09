import { requireRole } from '../../../../utils/authorization'
import { db } from '../../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    personnelId?: number
    unitId?: number
  }>(event)

  if (!body.personnelId || !body.unitId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Personnel and unit are required',
    })
  }

  const personnel = await db.orm.public.User.first({
    id: body.personnelId,
  })

  if (!personnel || personnel.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found',
    })
  }

  const unit = await db.orm.public.Unit.first({
    id: body.unitId,
  })

  if (!unit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Unit not found',
    })
  }

  const assignment =
    await db.orm.public.UnitAssignment.create({
      personnelId: personnel.id,
      unitId: unit.id,
    })

  return {
    success: true,
    message: `${personnel.name ?? personnel.email} assigned to ${unit.name}`,
    assignmentId: assignment.id,
  }
})