import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'
type CaseStatus =
  | 'New'
  | 'In Review'
  | 'Intervention Active'
  | 'Resolved'

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
  value: string | Date | null | undefined,
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

function formatLastAction(
  value: string | Date | null | undefined,
  label: string,
): string {
  if (!value) return label

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return label
  }

  return `${label} • ${formatDate(date)}`
}

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  // ------------------------------------------------------------
  // CURRENT WELFARE OFFICER
  // ------------------------------------------------------------

  const officer = await db.orm.public.User.where({
    id: authUser.userId,
  }).first()

  if (!officer || officer.role !== 'OFFICER') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  // ------------------------------------------------------------
  // LOAD DATABASE DATA
  // ------------------------------------------------------------

  const [
    allUsers,
    allUnits,
    allAssignments,
    allAssessments,
    allRecommendations,
    allFollowUps,
    allNotes,
  ] = await Promise.all([
    db.orm.public.User.all(),
    db.orm.public.Unit.all(),
    db.orm.public.UnitAssignment.all(),
    db.orm.public.Assessment.all(),
    db.orm.public.Recommendation.all(),
    db.orm.public.FollowUp.all(),
    db.orm.public.WelfareNote.all(),
  ])

  // ------------------------------------------------------------
  // ALL PERSONNEL
  //
  // IMPORTANT:
  // Do not restrict this page to the officer's assigned unit.
  // The Welfare Officer dashboard already operates on all
  // personnel, so High-Risk Cases follows the same scope.
  // ------------------------------------------------------------

  const personnel = allUsers.filter(
    (user) => user.role === 'PERSONNEL',
  )

  // ------------------------------------------------------------
  // BUILD UNIT LOOKUP
  // ------------------------------------------------------------

  const unitById = new Map(
    allUnits.map((unit) => [
      unit.id,
      unit,
    ]),
  )

  // ------------------------------------------------------------
  // BUILD PERSONNEL -> UNIT LOOKUP
  // ------------------------------------------------------------

  const assignmentByPersonnel = new Map<
    number,
    (typeof allAssignments)[number]
  >()

  for (const assignment of allAssignments) {
    if (!assignmentByPersonnel.has(assignment.personnelId)) {
      assignmentByPersonnel.set(
        assignment.personnelId,
        assignment,
      )
    }
  }

  // ------------------------------------------------------------
  // BUILD LATEST ASSESSMENT PER PERSONNEL
  // ------------------------------------------------------------

  const latestAssessmentByPersonnel = new Map<
    number,
    (typeof allAssessments)[number]
  >()

  for (const assessment of allAssessments) {
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
  // BUILD RECOMMENDATION LOOKUP
  // ------------------------------------------------------------

  const recommendationsByPersonnel = new Map<
    number,
    (typeof allRecommendations)[number][]
  >()

  for (const recommendation of allRecommendations) {
    const existing =
      recommendationsByPersonnel.get(
        recommendation.userId,
      ) ?? []

    existing.push(recommendation)

    recommendationsByPersonnel.set(
      recommendation.userId,
      existing,
    )
  }

  for (const recommendations of recommendationsByPersonnel.values()) {
    recommendations.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
  }

  // ------------------------------------------------------------
  // BUILD FOLLOW-UP LOOKUP
  // ------------------------------------------------------------

  const followUpsByPersonnel = new Map<
    number,
    (typeof allFollowUps)[number][]
  >()

  for (const followUp of allFollowUps) {
    const existing =
      followUpsByPersonnel.get(
        followUp.userId,
      ) ?? []

    existing.push(followUp)

    followUpsByPersonnel.set(
      followUp.userId,
      existing,
    )
  }

  for (const followUps of followUpsByPersonnel.values()) {
    followUps.sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() -
        new Date(a.scheduledAt).getTime(),
    )
  }

  // ------------------------------------------------------------
  // BUILD WELFARE NOTE LOOKUP
  // ------------------------------------------------------------

  const notesByPersonnel = new Map<
    number,
    (typeof allNotes)[number][]
  >()

  for (const note of allNotes) {
    const existing =
      notesByPersonnel.get(
        note.personnelId,
      ) ?? []

    existing.push(note)

    notesByPersonnel.set(
      note.personnelId,
      existing,
    )
  }

  for (const notes of notesByPersonnel.values()) {
    notes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
  }

  // ------------------------------------------------------------
  // BUILD HIGH-RISK CASES
  // ------------------------------------------------------------

  const cases = personnel
    .map((person) => {
      const latestAssessment =
        latestAssessmentByPersonnel.get(
          person.id,
        )

      if (!latestAssessment) {
        return null
      }

      const riskLevel =
        normalizeRiskLevel(
          latestAssessment.riskLevel,
        )

      // High-Risk Cases page only contains Elevated + High.
      if (
        riskLevel !== 'Elevated' &&
        riskLevel !== 'High'
      ) {
        return null
      }

      const recommendations =
        recommendationsByPersonnel.get(
          person.id,
        ) ?? []

      const activeRecommendation =
        recommendations.find(
          (recommendation) =>
            recommendation.isActive === true,
        )

      const previousRecommendation =
        recommendations.find(
          (recommendation) =>
            recommendation.isActive === false,
        )

      const followUps =
        followUpsByPersonnel.get(
          person.id,
        ) ?? []

      const scheduledFollowUp =
        followUps.find(
          (followUp) =>
            followUp.status === 'SCHEDULED',
        )

      const notes =
        notesByPersonnel.get(
          person.id,
        ) ?? []

      const latestRecommendation =
        recommendations[0]

      const latestFollowUp =
        followUps[0]

      const latestNote =
        notes[0]

      // ----------------------------------------------------------
      // CASE STATUS
      // ----------------------------------------------------------

      let caseStatus: CaseStatus = 'New'

      if (activeRecommendation) {
        caseStatus = 'Intervention Active'
      } else if (
        previousRecommendation
      ) {
        caseStatus = 'Resolved'
      } else if (
        scheduledFollowUp
      ) {
        caseStatus = 'In Review'
      }

      // ----------------------------------------------------------
      // LAST ACTION
      // ----------------------------------------------------------

      const actions: Array<{
        time: number
        label: string
        date: string | Date
      }> = []

      if (latestRecommendation) {
        actions.push({
          time: new Date(
            latestRecommendation.createdAt,
          ).getTime(),
          label:
            latestRecommendation.isActive
              ? 'Intervention started'
              : 'Intervention resolved',
          date:
            latestRecommendation.createdAt,
        })
      }

      if (latestFollowUp) {
        actions.push({
          time: new Date(
            latestFollowUp.scheduledAt,
          ).getTime(),
          label: 'Follow-up scheduled',
          date:
            latestFollowUp.scheduledAt,
        })
      }

      if (latestNote) {
        actions.push({
          time: new Date(
            latestNote.createdAt,
          ).getTime(),
          label: 'Welfare note added',
          date:
            latestNote.createdAt,
        })
      }

      actions.sort(
        (a, b) => b.time - a.time,
      )

      const latestAction = actions[0]

      const lastAction = latestAction
      ? formatLastAction(
      latestAction.date,
      latestAction.label,
      )
      : 'No action taken yet'
      // ----------------------------------------------------------
      // UNIT
      // ----------------------------------------------------------
      const assignment =
        assignmentByPersonnel.get(
          person.id,
        )

      const unit = assignment
        ? unitById.get(
            assignment.unitId,
          )
        : null

      return {
        id: String(person.id),

        name:
          person.name ??
          'Unknown Personnel',

        unit:
          unit?.name ??
          'Unassigned',

        riskLevel,

        score: Number(
          latestAssessment.stressScore.toFixed(
            2,
          ),
        ),

        caseStatus,

        assignedTo:
          officer.name ??
          'Welfare Officer',

        flaggedDate:
          formatDate(
            latestAssessment.createdAt,
          ),

        lastAction,
      }
    })
    .filter(
      (
        item,
      ): item is NonNullable<typeof item> =>
        item !== null,
    )
    .sort(
      (a, b) =>
        b.score - a.score,
    )

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------

  const summary = [
    {
      label: 'Total Cases',
      value: cases.length,
      icon: 'total' as const,
    },

    {
      label: 'New',
      value: cases.filter(
        (item) =>
          item.caseStatus === 'New',
      ).length,
      icon: 'new' as const,
    },

    {
      label: 'In Review',
      value: cases.filter(
        (item) =>
          item.caseStatus === 'In Review',
      ).length,
      icon: 'review' as const,
    },

    {
      label: 'Intervention Active',
      value: cases.filter(
        (item) =>
          item.caseStatus ===
          'Intervention Active',
      ).length,
      icon: 'active' as const,
    },

    {
      label: 'Resolved',
      value: cases.filter(
        (item) =>
          item.caseStatus ===
          'Resolved',
      ).length,
      icon: 'resolved' as const,
    },
  ]

  // ------------------------------------------------------------
  // RESPONSE
  // ------------------------------------------------------------

  return {
    officer: {
      name:
        officer.name ??
        'Welfare Officer',

      role: 'Welfare Officer',

      avatarUrl:
        officer.profilePicture ??
        null,
    },

    summary,

    cases,
  }
})