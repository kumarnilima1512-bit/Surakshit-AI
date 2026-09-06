import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type InterventionStatus = 'Pending' | 'In Progress' | 'Completed'
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

function parseInterventionType(title: string): InterventionType {
  const match = INTERVENTION_TYPES.find((type) => type === title)
  return match ?? 'Counseling'
}

function parseTargetDate(description: string): string {
  const parsed = new Date(description)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
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

  const personnelAssignments = allAssignments.filter(
    (assignment) =>
      officerUnitIds.includes(assignment.unitId) &&
      assignment.personnelId !== officer.id,
  )

  const personnelIds = [
    ...new Set(personnelAssignments.map((assignment) => assignment.personnelId)),
  ]

  const allUsers = await db.orm.public.User.all()

  const personnelById = new Map(
    allUsers
      .filter((user) => personnelIds.includes(user.id))
      .map((user) => [user.id, user]),
  )

  const allRecommendations = await db.orm.public.Recommendation.all()

  const scopedRecommendations = allRecommendations.filter((rec) =>
    personnelIds.includes(rec.userId),
  )

  const interventions = [...scopedRecommendations]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((rec) => {
      const person = personnelById.get(rec.userId)
      const status: InterventionStatus = rec.isActive ? 'In Progress' : 'Completed'
      const targetDateIso = parseTargetDate(rec.description)

      return {
        id: String(rec.id),
        personnelId: String(rec.userId),
        personnelName: person?.name ?? 'Unknown',
        type: parseInterventionType(rec.title),
        status,
        assignedOfficer: officer.name ?? 'Unassigned',
        startedDate: formatDate(rec.createdAt),
        targetDate: targetDateIso ? formatDate(targetDateIso) : formatDate(rec.createdAt),
      }
    })

  const statusOrder: InterventionStatus[] = ['Pending', 'In Progress', 'Completed']
  const statusColors: Record<InterventionStatus, string> = {
    Pending: '#fbbf24',
    'In Progress': '#60a5fa',
    Completed: '#34d399',
  }

  const totalInterventions = interventions.length

  const statusBreakdown = statusOrder.map((status) => {
    const count = interventions.filter((iv) => iv.status === status).length

    return {
      label: status,
      count,
      pct: totalInterventions ? Math.round((count / totalInterventions) * 1000) / 10 : 0,
      color: statusColors[status],
    }
  })

  return {
    officer: {
      name: officer.name ?? '',
      role: 'Welfare Officer',
      avatarUrl: officer.profilePicture ?? null,
    },
    statusBreakdown,
    totalInterventions,
    interventions,
  }
})