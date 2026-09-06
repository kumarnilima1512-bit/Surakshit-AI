import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

function normalizeRiskLevel(riskLevel: string | null | undefined): RiskLevel {
  const value = riskLevel?.toLowerCase()

  if (value === 'high') return 'High'
  if (value === 'elevated') return 'Elevated'
  if (value === 'moderate') return 'Moderate'
  return 'Low'
}

function formatDate(value: string | null | undefined): string {
  if (!value) return ''

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value: string | null | undefined): string {
  if (!value) return ''

  return new Date(value).toLocaleTimeString('en-GB', {
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

  const commander = await db.orm.public.User.where({
    id: authUser.userId,
  }).first()

  if (!commander) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  const commanderAssignments = await db.orm.public.UnitAssignment.where({
    personnelId: commander.id,
  }).all()

  const commanderUnitIds = commanderAssignments.map(
    (assignment) => assignment.unitId,
  )

  const personnelAssignments = await db.orm.public.UnitAssignment.all()

  const belongsToCommanderUnit = personnelAssignments.some(
    (assignment) =>
      assignment.personnelId === id &&
      commanderUnitIds.includes(assignment.unitId),
  )

  if (!belongsToCommanderUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found in your unit',
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

  const assignment = personnelAssignments.find(
    (item) =>
      item.personnelId === personnel.id &&
      commanderUnitIds.includes(item.unitId),
  )

  const units = await db.orm.public.Unit.all()

  const unit = units.find(
    (item) => item.id === assignment?.unitId,
  )

  const assessments = await db.orm.public.Assessment.all()

  const personAssessments = assessments
    .filter((assessment) => assessment.userId === personnel.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )

  const latestAssessment = personAssessments[0]

  const followUps = await db.orm.public.FollowUp.all()

  const personFollowUps = followUps
    .filter((followUp) => followUp.userId === personnel.id)
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() -
        new Date(a.scheduledAt).getTime(),
    )

  const latestFollowUp = personFollowUps[0]

  const stressTrend = [...personAssessments]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    )
    .map((assessment) => ({
      dateLabel: formatDate(assessment.createdAt),
      score: assessment.stressScore,
    }))

  const recentAssessments = personAssessments
    .slice(0, 10)
    .map((assessment) => ({
      dateTime: `${formatDate(assessment.createdAt)} ${formatTime(assessment.createdAt)}`,
      score: assessment.stressScore,
      riskLevel: normalizeRiskLevel(assessment.riskLevel),
    }))

  const riskLevel = normalizeRiskLevel(latestAssessment?.riskLevel)

  let riskLevelNote = 'No recent assessment available.'

  if (latestAssessment) {
    if (riskLevel === 'High') {
      riskLevelNote = 'Current stress level requires close attention.'
    } else if (riskLevel === 'Elevated') {
      riskLevelNote = 'Stress level is elevated and should be monitored.'
    } else if (riskLevel === 'Moderate') {
      riskLevelNote = 'Stress level is moderate.'
    } else {
      riskLevelNote = 'Stress level is currently low.'
    }
  }

  return {
    id: String(personnel.id),
    name: personnel.name ?? '',
    rank: personnel.rank ?? '',
    subUnit: unit?.name ?? '',
    status:
      personnel.personnelStatus === 'ACTIVE'
        ? 'Active'
        : personnel.personnelStatus === 'ON_LEAVE'
          ? 'On Leave'
          : 'Inactive',
    joinedDate: formatDate(
      personnel.createdAt,
    ),
    avatarUrl: personnel.profilePicture ?? null,
    currentStressScore: latestAssessment?.stressScore ?? 0,
    maxStressScore: 10,
    riskLevel,
    riskLevelNote,
    lastAssessmentDate: formatDate(latestAssessment?.createdAt),
    lastAssessmentTime: formatTime(latestAssessment?.createdAt),
    nextFollowUpDate: latestFollowUp
      ? formatDate(latestFollowUp.scheduledAt)
      : null,
    stressTrend,
    recentAssessments,
  }
})