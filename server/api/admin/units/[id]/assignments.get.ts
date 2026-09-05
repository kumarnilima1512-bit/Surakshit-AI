import { requireRole } from '../../../../utils/authorization'
import { db } from '../../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const unitId = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(unitId) || unitId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid unit ID',
    })
  }

  const unit = await db.orm.public.Unit.first({
    id: unitId,
  })

  if (!unit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Unit not found',
    })
  }

  const assignments = await db.orm.public.UnitAssignment
    .where({ unitId })
    .all()

  return {
    success: true,
    unit: {
      id: unit.id,
      name: unit.name,
      code: unit.code,
    },
    assignments,
  }
})