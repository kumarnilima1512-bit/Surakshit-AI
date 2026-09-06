import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid unit ID',
    })
  }

  const unit = await db.orm.public.Unit.first({ id })

  if (!unit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Unit not found',
    })
  }

  const assignments = await db.orm.public.UnitAssignment
    .where({ unitId: id })
    .all()

  if (assignments.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Cannot delete a unit with assigned personnel',
    })
  }

  await db.orm.public.Unit
    .where({ id })
    .delete()

  return {
    success: true,
    message: 'Unit deleted successfully',
  }
})