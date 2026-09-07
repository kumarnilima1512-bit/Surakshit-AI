import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type InterventionType =
  | 'Counseling'
  | 'Medical Referral'
  | 'Leave Recommendation'
  | 'Peer Support'
  | 'Command Notification'

const INTERVENTION_TYPES: InterventionType[] = [
  'Counseling',
  'Medical Referral',
  'Leave Recommendation',
  'Peer Support',
  'Command Notification',
]

function formatDate(value: string | null | undefined): string {
  if (!value) return ''

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  const body = await readBody<{
    personnelId?: string
    type?: InterventionType
    targetDate?: string
  }>(event)

  const personnelIdRaw = body.personnelId?.trim()
  const targetDate = body.targetDate?.trim()
  const type = body.type

  if (!personnelIdRaw || !targetDate || !type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Personnel ID, type, and target date are required',
    })
  }

  if (!INTERVENTION_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid intervention type',
    })
  }

  const personnelId = Number(personnelIdRaw.replace(/\D/g, ''))

  if (!Number.isInteger(personnelId) || personnelId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid personnel ID',
    })
  }

  const parsedTargetDate = new Date(targetDate)

  if (Number.isNaN(parsedTargetDate.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid target date',
    })
  }

  const officer = await db.orm.public.User.where({
    id: authUser.userId,
  }).first()

  if (!officer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  const officerAssignments = await db.orm.public.UnitAssignment.where({
    personnelId: officer.id,
  }).all()

  const officerUnitIds = officerAssignments.map((assignment) => assignment.unitId)

  const allAssignments = await db.orm.public.UnitAssignment.all()

  const belongsToOfficerUnit = allAssignments.some(
    (assignment) =>
      assignment.personnelId === personnelId &&
      officerUnitIds.includes(assignment.unitId),
  )

  if (!belongsToOfficerUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found in your unit',
    })
  }

  const personnel = await db.orm.public.User.where({
    id: personnelId,
  }).first()

  if (!personnel || personnel.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found',
    })
  }

  const created = await db.orm.public.Recommendation.create({
    userId: personnel.id,
    type: 'WORKLOAD',
    title: type,
    description: parsedTargetDate.toISOString(),
    isActive: true,
  })

  return {
    id: String(created.id),
    personnelId: String(personnel.id),
    personnelName: personnel.name ?? '',
    type,
    status: 'In Progress' as const,
    assignedOfficer: officer.name ?? 'Unassigned',
    startedDate: formatDate(created.createdAt),
    targetDate: formatDate(parsedTargetDate.toISOString()),
  }
})