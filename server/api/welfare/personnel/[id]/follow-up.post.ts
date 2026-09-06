import { db } from '../../../../../src/prisma/db'
import { requireRole } from '../../../../utils/authorization'

export default defineEventHandler(async (event) => {
  // Only Welfare Officers can schedule follow-ups
  const authUser = await requireRole(event, ['OFFICER'])

  const personnelId = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(personnelId) || personnelId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid personnel ID',
    })
  }

  const body = await readBody<{ date?: string }>(event)

  if (!body?.date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Follow-up date is required',
    })
  }

  // Validate date
  const scheduledAt = new Date(`${body.date}T00:00:00`)

  if (Number.isNaN(scheduledAt.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid follow-up date',
    })
  }

  // Find the welfare officer's assigned unit
  const officerAssignment = await db.orm.public.UnitAssignment
    .where({ personnelId: authUser.userId })
    .first()

  if (!officerAssignment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No unit assigned to welfare officer',
    })
  }

  // Make sure the personnel belongs to the officer's unit
  const personnelAssignment = await db.orm.public.UnitAssignment
    .where({
      unitId: officerAssignment.unitId,
      personnelId,
    })
    .first()

  if (!personnelAssignment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found in your assigned unit',
    })
  }

  // Create follow-up
  const followUp = await db.orm.public.FollowUp.create({
    
      userId: personnelId,
      scheduledAt,
      status: 'SCHEDULED',
    
  })

  return {
    ok: true,
    followUp: {
      id: String(followUp.id),
      date: scheduledAt.toISOString(),
      status: followUp.status,
    },
  }
})

