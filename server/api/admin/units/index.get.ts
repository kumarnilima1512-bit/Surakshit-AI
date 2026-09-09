import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const [units, assignments] = await Promise.all([
    db.orm.public.Unit.all(),
    db.orm.public.UnitAssignment.all(),
  ])

  const result = units.map((unit) => ({
    ...unit,
    personnelCount: assignments.filter(
      (assignment) => assignment.unitId === unit.id
    ).length,
  }))

  return {
    success: true,
    units: result,
  }
})