import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type Severity = 'Critical' | 'Warning' | 'Info'

function getSeverity(
  riskLevel: string | null | undefined,
): Severity {
  const value = riskLevel?.trim().toLowerCase()

  if (value === 'high') return 'Critical'
  if (value === 'elevated') return 'Warning'

  return 'Info'
}

function formatTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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

  // ------------------------------------------------------------
  // CURRENT COMMANDER
  // ------------------------------------------------------------

  const commander = await db.orm.public.User.where({
    id: authUser.userId,
  }).first()

  if (!commander) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  // ------------------------------------------------------------
  // COMMANDER'S UNITS
  // ------------------------------------------------------------

  const commanderAssignments =
    await db.orm.public.UnitAssignment.where({
      personnelId: commander.id,
    }).all()

  const commanderUnitIds = commanderAssignments.map(
    (assignment) => assignment.unitId,
  )

  // ------------------------------------------------------------
  // PERSONNEL IN COMMANDER'S UNITS
  // ------------------------------------------------------------

  const allAssignments =
    await db.orm.public.UnitAssignment.all()

  const personnelAssignments =
    allAssignments.filter(
      (assignment) =>
        commanderUnitIds.includes(assignment.unitId) &&
        assignment.personnelId !== commander.id,
    )

  const personnelIds = [
    ...new Set(
      personnelAssignments.map(
        (assignment) => assignment.personnelId,
      ),
    ),
  ]

  // ------------------------------------------------------------
  // LOAD DATA
  // ------------------------------------------------------------

  const [
    allUsers,
    allUnits,
    allAssessments,
  ] = await Promise.all([
    db.orm.public.User.all(),
    db.orm.public.Unit.all(),
    db.orm.public.Assessment.all(),
  ])

  const personnel = allUsers.filter(
    (user) =>
      user.role === 'PERSONNEL' &&
      personnelIds.includes(user.id),
  )

  // ------------------------------------------------------------
  // LATEST ASSESSMENT PER PERSONNEL
  // ------------------------------------------------------------

  const latestAssessmentByPersonnel = new Map<
    number,
    (typeof allAssessments)[number]
  >()

  for (const assessment of allAssessments) {
    if (!personnelIds.includes(assessment.userId)) {
      continue
    }

    const existing =
      latestAssessmentByPersonnel.get(
        assessment.userId,
      )

    if (
      !existing ||
      new Date(assessment.createdAt).getTime() >
        new Date(existing.createdAt).getTime()
    ) {
      latestAssessmentByPersonnel.set(
        assessment.userId,
        assessment,
      )
    }
  }

  // ------------------------------------------------------------
  // BUILD RISK ALERTS
  // ------------------------------------------------------------

  const alerts = personnel
    .map((person) => {
      const assessment =
        latestAssessmentByPersonnel.get(person.id)

      if (!assessment) {
        return null
      }

      const riskLevel =
        assessment.riskLevel?.trim().toLowerCase()

      // Only Elevated and High are Risk Alerts.
      if (
        riskLevel !== 'high' &&
        riskLevel !== 'elevated'
      ) {
        return null
      }

      const assignment =
        personnelAssignments.find(
          (item) =>
            item.personnelId === person.id,
        )

      const unit = allUnits.find(
        (item) =>
          item.id === assignment?.unitId,
      )

      const score = Number(
        assessment.stressScore.toFixed(2),
      )

      const severity =
        getSeverity(assessment.riskLevel)

      const title =
        riskLevel === 'high'
          ? 'High Risk Personnel Detected'
          : 'Elevated Risk Personnel Detected'

      const detail =
        `${person.name ?? 'Personnel'} has a ${assessment.riskLevel} stress risk level with a stress score of ${score}/10.`

      return {
        id: String(assessment.id),
        title,
        detail,
        severity,
        personnelId: String(person.id),
        subUnit: unit?.name ?? 'Unassigned',
        time: formatTime(assessment.createdAt),
        acknowledged:
          assessment.seenbyCommander,
      }
    })
    .filter(
      (
        alert,
      ): alert is NonNullable<typeof alert> =>
        alert !== null,
    )
    .sort(
      (a, b) => {
        const aAssessment =
          latestAssessmentByPersonnel.get(
            Number(a.personnelId),
          )

        const bAssessment =
          latestAssessmentByPersonnel.get(
            Number(b.personnelId),
          )

        return (
          new Date(
            bAssessment?.createdAt ?? '',
          ).getTime() -
          new Date(
            aAssessment?.createdAt ?? '',
          ).getTime()
        )
      },
    )

  return {
    commander: {
      name: commander.name ?? '',
      rank: commander.rank ?? 'Commander',
      avatarUrl: commander.profilePicture ?? null,
    },

    alerts,
  }
})