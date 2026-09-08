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

  const [allUsers, allAssessments, allFollowUps] =
    await Promise.all([
      db.orm.public.User.all(),
      db.orm.public.Assessment.all(),
      db.orm.public.FollowUp.all(),
    ])

  const personnel = allUsers.filter(
    (user) =>
      user.role === 'PERSONNEL' &&
      user.id !== commander.id,
  )

  const result = personnel.map((person) => {
    const personAssessments = allAssessments
      .filter(
        (assessment) =>
          assessment.userId === person.id,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )

    const latestAssessment =
      personAssessments[0]

    const personFollowUps = allFollowUps
      .filter(
        (followUp) =>
          followUp.userId === person.id,
      )
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() -
          new Date(a.scheduledAt).getTime(),
      )

    const latestFollowUp =
      personFollowUps[0]

    let followUpStatus:
      | 'None'
      | 'Scheduled'
      | 'Overdue' = 'None'

    if (latestFollowUp) {
      followUpStatus =
        new Date(latestFollowUp.scheduledAt).getTime() <
        Date.now()
          ? 'Overdue'
          : 'Scheduled'
    }

    return {
      id: String(person.id),
      name: person.name ?? '',
      rank: person.rank ?? '',
      subUnit: 'Unassigned',

      riskLevel: normalizeRiskLevel(
        latestAssessment?.riskLevel,
      ),

      score:
        latestAssessment?.stressScore ?? 0,

      lastAssessment:
        formatDate(
          latestAssessment?.createdAt,
        ),

      followUpStatus,
    }
  })

  return {
    commander: {
      name: commander.name ?? '',
      rank: commander.rank ?? '',
      avatarUrl:
        commander.profilePicture ?? null,
    },

    personnel: result,
  }
})