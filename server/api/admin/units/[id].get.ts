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

  return {
    success: true,
    unit,
  }
})