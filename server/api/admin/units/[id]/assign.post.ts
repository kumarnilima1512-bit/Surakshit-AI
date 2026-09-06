import { requireRole } from '../../../../utils/authorization'
import { db } from '../../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    unitId?: number
    personnelId?: number
  }>(event)

  const unitId = Number(body.unitId)
  const personnelId = Number(body.personnelId)

  if (
    !Number.isInteger(unitId) ||
    !Number.isInteger(personnelId) ||
    unitId <= 0 ||
    personnelId <= 0
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid unitId and personnelId are required',
    })
  }

  const unit = await db.orm.public.Unit.first({ id: unitId })
  const personnel = await db.orm.public.User.first({ id: personnelId })

  if (!unit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Unit not found',
    })
  }

  if (!personnel) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found',
    })
  }

  const existing = await db.orm.public.UnitAssignment.first({
    unitId,
    personnelId,
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Personnel is already assigned to this unit',
    })
  }

  const assignment = await db.orm.public.UnitAssignment.create({
    unitId,
    personnelId,
  })

  return {
    success: true,
    message: 'Personnel assigned successfully',
    assignment,
  }
})