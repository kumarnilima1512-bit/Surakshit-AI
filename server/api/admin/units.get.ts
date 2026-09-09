import { requireRole } from '../../utils/authorization'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const [units, assignments] = await Promise.all([
    db.orm.public.Unit.all(),
    db.orm.public.UnitAssignment.all(),
  ])

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
      personnelCount: assignments.filter(
        (assignment) => assignment.unitId === unit.id
      ).length,
    })),
  }
})