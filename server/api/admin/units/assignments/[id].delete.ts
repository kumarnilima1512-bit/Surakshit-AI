import { requireRole } from '../../../../utils/authorization'
import { db } from '../../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid assignment ID',
    })
  }

  const assignment = await db.orm.public.UnitAssignment.first({ id })

  if (!assignment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Assignment not found',
    })
  }

  await db.orm.public.UnitAssignment
    .where({ id })
    .delete()

  return {
    success: true,
    message: 'Assignment removed successfully',
  }
})