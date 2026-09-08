import { db } from '../../../../../src/prisma/db'
import { getAuthUser } from '../../../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
    })
  }

  const assessmentId = Number(
    getRouterParam(event, 'id'),
  )

  if (!Number.isInteger(assessmentId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid assessment ID',
    })
  }

  const assessment =
    await db.orm.public.Assessment.first({
      id: assessmentId,
    })

  if (!assessment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Assessment not found',
    })
  }

  const commanderAssignments =
    await db.orm.public.UnitAssignment.where({
      personnelId: authUser.userId,
    }).all()

  const commanderUnitIds =
    commanderAssignments.map(
      (assignment) => assignment.unitId,
    )

  const personnelAssignments =
    await db.orm.public.UnitAssignment.where({
      personnelId: assessment.userId,
    }).all()

  const belongsToCommanderUnit =
    personnelAssignments.some(
      (assignment) =>
        commanderUnitIds.includes(
          assignment.unitId,
        ),
    )

  if (!belongsToCommanderUnit) {
    throw createError({
      statusCode: 403,
      statusMessage:
        'You cannot acknowledge this alert',
    })
  }

  const updatedAssessment =
    await db.orm.public.Assessment
      .where({ id: assessmentId })
      .update({
        seenbyCommander: true,
      })

  return {
    success: true,
    acknowledged: updatedAssessment?.seenbyCommander ?? true,
  }
})