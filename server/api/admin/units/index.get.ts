import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const units = await db.orm.public.Unit.all()

  return {
    success: true,
    units,
  }
})