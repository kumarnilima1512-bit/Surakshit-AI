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

  const commander =
    await db.orm.public.User.where({
      id: authUser.userId,
    }).first()

  if (!commander || commander.role !== 'COMMANDER') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  // ------------------------------------------------------------
  // LOAD DATA
  // ------------------------------------------------------------

  const [
    allUsers,
    allUnits,
    allAssignments,
    allAssessments,
  ] = await Promise.all([
    db.orm.public.User.all(),
    db.orm.public.Unit.all(),
    db.orm.public.UnitAssignment.all(),
    db.orm.public.Assessment.all(),
  ])

  // ------------------------------------------------------------
  // ALL PERSONNEL
  //
  // Same scope as Welfare High-Risk Cases.
  // ------------------------------------------------------------

  const personnel = allUsers.filter(
    (user) => user.role === 'PERSONNEL',
  )

  // ------------------------------------------------------------
  // PERSONNEL IDs
  // ------------------------------------------------------------

  const personnelIds = new Set(
    personnel.map((person) => person.id),
  )

  // ------------------------------------------------------------
  // UNIT LOOKUP
  // ------------------------------------------------------------

  const unitById = new Map(
    allUnits.map((unit) => [
      unit.id,
      unit,
    ]),
  )

  // ------------------------------------------------------------
  // PERSONNEL -> UNIT
  // ------------------------------------------------------------

  const assignmentByPersonnel = new Map<
    number,
    (typeof allAssignments)[number]
  >()

  for (const assignment of allAssignments) {
    if (
      personnelIds.has(
        assignment.personnelId,
      ) &&
      !assignmentByPersonnel.has(
        assignment.personnelId,
      )
    ) {
      assignmentByPersonnel.set(
        assignment.personnelId,
        assignment,
      )
    }
  }

  // ------------------------------------------------------------
  // LATEST ASSESSMENT PER PERSONNEL
  //
  // IMPORTANT:
  // We only consider the latest assessment of each
  // personnel, exactly like Welfare High-Risk Cases.
  // ------------------------------------------------------------

  const latestAssessmentByPersonnel = new Map<
    number,
    (typeof allAssessments)[number]
  >()

  for (const assessment of allAssessments) {
    if (
      !personnelIds.has(
        assessment.userId,
      )
    ) {
      continue
    }

    const existing =
      latestAssessmentByPersonnel.get(
        assessment.userId,
      )

    if (
      !existing ||
      new Date(
        assessment.createdAt,
      ).getTime() >
        new Date(
          existing.createdAt,
        ).getTime()
    ) {
      latestAssessmentByPersonnel.set(
        assessment.userId,
        assessment,
      )
    }
  }

  // ------------------------------------------------------------
  // BUILD ALERTS
  //
  // High + Elevated only.
  // ------------------------------------------------------------

  const alerts = personnel
    .map((person) => {
      const assessment =
        latestAssessmentByPersonnel.get(
          person.id,
        )

      if (!assessment) {
        return null
      }

      const normalizedRisk =
        assessment.riskLevel
          ?.trim()
          .toLowerCase()

      if (
        normalizedRisk !== 'high' &&
        normalizedRisk !== 'elevated'
      ) {
        return null
      }

      const assignment =
        assignmentByPersonnel.get(
          person.id,
        )

      const unit = assignment
        ? unitById.get(
            assignment.unitId,
          )
        : null

      const score = Number(
        assessment.stressScore.toFixed(2),
      )

      const severity =
        getSeverity(
          assessment.riskLevel,
        )

      const title =
        normalizedRisk === 'high'
          ? 'High Risk Personnel Detected'
          : 'Elevated Risk Personnel Detected'

      const detail =
        `${person.name ?? 'Personnel'} has a ` +
        `${assessment.riskLevel} stress risk level ` +
        `with a stress score of ${score}/10.`

      return {
        id: String(assessment.id),

        title,

        detail,

        severity,

        personnelId: String(
          person.id,
        ),

        subUnit:
          unit?.name ??
          'Unassigned',

        time: formatTime(
          assessment.createdAt,
        ),

        acknowledged:
          assessment.seenbyCommander,
      }
    })
    .filter(
      (
        alert,
      ): alert is NonNullable<
        typeof alert
      > => alert !== null,
    )
    .sort(
      (a, b) => {
        // High first
        if (
          a.severity === 'Critical' &&
          b.severity !== 'Critical'
        ) {
          return -1
        }

        if (
          a.severity !== 'Critical' &&
          b.severity === 'Critical'
        ) {
          return 1
        }

        // Then highest stress score first.
        const aAssessment =
          latestAssessmentByPersonnel.get(
            Number(a.personnelId),
          )

        const bAssessment =
          latestAssessmentByPersonnel.get(
            Number(b.personnelId),
          )

        return (
          (bAssessment?.stressScore ?? 0) -
          (aAssessment?.stressScore ?? 0)
        )
      },
    )

  // ------------------------------------------------------------
  // RESPONSE
  // ------------------------------------------------------------

  return {
    commander: {
      name:
        commander.name ??
        '',

      rank:
        commander.rank ??
        'Commander',

      avatarUrl:
        commander.profilePicture ??
        null,
    },

    alerts,
  }
})