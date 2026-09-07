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

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
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

  const unitIds = commanderAssignments.map((assignment) => assignment.unitId)

  if (!unitIds.length) {
    return {
      commander: {
        name: commander.name ?? '',
        rank: commander.rank ?? '',
        avatarUrl: commander.profilePicture ?? null,
      },
      personnel: [],
    }
  }

  const assignments = await db.orm.public.UnitAssignment.all()

  const personnelAssignments = assignments.filter(
    (assignment) =>
      unitIds.includes(assignment.unitId) &&
      assignment.personnelId !== commander.id,
  )

  const personnelIds = [
    ...new Set(personnelAssignments.map((assignment) => assignment.personnelId)),
  ]

  if (!personnelIds.length) {
    return {
      commander: {
        name: commander.name ?? '',
        rank: commander.rank ?? '',
        avatarUrl: commander.profilePicture ?? null,
      },
      personnel: [],
    }
  }

  const personnelUsers = await db.orm.public.User.all()

  const personnel = personnelUsers.filter(
    (user) =>
      personnelIds.includes(user.id) &&
      user.role === 'PERSONNEL',
  )

  const units = await db.orm.public.Unit.all()

  const assessments = await db.orm.public.Assessment.all()

  const followUps = await db.orm.public.FollowUp.all()

  const result = personnel.map((person) => {
    const personAssignments = personnelAssignments.filter(
      (assignment) => assignment.personnelId === person.id,
    )

    const assignment = personAssignments[0]

    const unit = units.find(
      (item) => item.id === assignment?.unitId,
    )

    const personAssessments = assessments
      .filter((assessment) => assessment.userId === person.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )

    const latestAssessment = personAssessments[0]

    const personFollowUps = followUps
      .filter((followUp) => followUp.userId === person.id)
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() -
          new Date(a.scheduledAt).getTime(),
      )

    const latestFollowUp = personFollowUps[0]

    let followUpStatus: 'None' | 'Scheduled' | 'Overdue' = 'None'

    if (latestFollowUp) {
      followUpStatus =
        new Date(latestFollowUp.scheduledAt).getTime() < Date.now()
          ? 'Overdue'
          : 'Scheduled'
    }

    return {
      id: String(person.id),
      name: person.name ?? '',
      rank: person.rank ?? '',
      subUnit: unit?.name ?? '',
      riskLevel: normalizeRiskLevel(latestAssessment?.riskLevel),
      score: latestAssessment?.stressScore ?? 0,
      lastAssessment: formatDate(latestAssessment?.createdAt),
      followUpStatus,
    }
  })

  return {
    commander: {
      name: commander.name ?? '',
      rank: commander.rank ?? '',
      avatarUrl: commander.profilePicture ?? null,
    },
    personnel: result,
  }
})