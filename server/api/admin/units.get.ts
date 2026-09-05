import { requireRole } from '../../utils/authorization'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const units = await db.orm.public.Unit.all()

  return {
    success: true,
    units: units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      code: unit.code,
      location: unit.location,
      description: unit.description,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    })),
  }
})