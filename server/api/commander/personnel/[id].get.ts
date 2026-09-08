import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

function normalizeRiskLevel(
  riskLevel: string | null | undefined,
): RiskLevel {
  const value = riskLevel?.trim().toLowerCase()

  if (value === 'high') return 'High'
  if (value === 'elevated') return 'Elevated'
  if (value === 'moderate') return 'Moderate'

  return 'Low'
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(
  value: string | null | undefined,
): string {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
    })
  }

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid personnel ID',
    })
  }

  const personnel = await db.orm.public.User.where({
    id,
  }).first()

  if (!personnel || personnel.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found',
    })
  }

  const [
    assessments,
    followUps,
    units,
    assignments,
  ] = await Promise.all([
    db.orm.public.Assessment.all(),
    db.orm.public.FollowUp.all(),
    db.orm.public.Unit.all(),
    db.orm.public.UnitAssignment.all(),
  ])

  const personAssessments = assessments
    .filter(
      (assessment) =>
        assessment.userId === personnel.id,
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )

  const latestAssessment =
    personAssessments[0]

  const personFollowUps = followUps
    .filter(
      (followUp) =>
        followUp.userId === personnel.id,
    )
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() -
        new Date(a.scheduledAt).getTime(),
    )

  const latestFollowUp =
    personFollowUps[0]

  const assignment = assignments.find(
    (item) =>
      item.personnelId === personnel.id,
  )

  const unit = units.find(
    (item) =>
      item.id === assignment?.unitId,
  )

  const stressTrend = [...personAssessments]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    )
    .map((assessment) => ({
      dateLabel: formatDate(
        assessment.createdAt,
      ),
      score: assessment.stressScore,
    }))

  const recentAssessments =
    personAssessments
      .slice(0, 10)
      .map((assessment) => ({
        dateTime:
          `${formatDate(assessment.createdAt)} ${formatTime(assessment.createdAt)}`,
        score: assessment.stressScore,
        riskLevel: normalizeRiskLevel(
          assessment.riskLevel,
        ),
      }))

  const riskLevel = normalizeRiskLevel(
    latestAssessment?.riskLevel,
  )

  let riskLevelNote =
    'No recent assessment available.'

  if (latestAssessment) {
    if (riskLevel === 'High') {
      riskLevelNote =
        'Current stress level requires close attention.'
    } else if (riskLevel === 'Elevated') {
      riskLevelNote =
        'Stress level is elevated and should be monitored.'
    } else if (riskLevel === 'Moderate') {
      riskLevelNote =
        'Stress level is moderate.'
    } else {
      riskLevelNote =
        'Stress level is currently low.'
    }
  }

  return {
    id: String(personnel.id),
    name: personnel.name ?? '',
    rank: personnel.rank ?? '',
    subUnit: unit?.name ?? 'Unassigned',

    status:
      personnel.personnelStatus === 'ACTIVE'
        ? 'Active'
        : personnel.personnelStatus === 'ON_LEAVE'
          ? 'On Leave'
          : 'Inactive',

    joinedDate:
      formatDate(personnel.createdAt),

    avatarUrl:
      personnel.profilePicture ?? null,

    currentStressScore:
      latestAssessment?.stressScore ?? 0,

    maxStressScore: 10,

    riskLevel,

    riskLevelNote,

    lastAssessmentDate:
      formatDate(
        latestAssessment?.createdAt,
      ),

    lastAssessmentTime:
      formatTime(
        latestAssessment?.createdAt,
      ),

    nextFollowUpDate:
      latestFollowUp
        ? formatDate(
            latestFollowUp.scheduledAt,
          )
        : null,

    stressTrend,

    recentAssessments,
  }
})