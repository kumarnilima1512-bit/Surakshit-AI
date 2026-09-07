import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'
type CaseStatus = 'New' | 'In Review' | 'Intervention Active' | 'Resolved'

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

  const units = await db.orm.public.Unit.all()
  const allUsers = await db.orm.public.User.all()

  const personnel = allUsers.filter(
    (candidate) =>
      personnelIds.includes(candidate.id) && candidate.role === 'PERSONNEL',
  )

  const allAssessments = await db.orm.public.Assessment.all()
  const allFollowUps = await db.orm.public.FollowUp.all()
  const allRecommendations = await db.orm.public.Recommendation.all()
  const allNotes = await db.orm.public.WelfareNote.all()

  function unitNameFor(personnelId: number): string {
    const assignment = personnelAssignments.find(
      (item) => item.personnelId === personnelId,
    )
    const unit = units.find((item) => item.id === assignment?.unitId)
    return unit?.name ?? ''
  }

  const cases = personnel
    .map((person) => {
      const personAssessments = allAssessments
        .filter((assessment) => assessment.userId === person.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

      const latestAssessment = personAssessments[0]
      const riskLevel = normalizeRiskLevel(latestAssessment?.riskLevel)

      if (riskLevel !== 'Elevated' && riskLevel !== 'High') {
        return null
      }

      const personRecommendations = allRecommendations
        .filter((rec) => rec.userId === person.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

      const activeRecommendation = personRecommendations.find((rec) => rec.isActive)
      const latestRecommendation = personRecommendations[0]

      const personFollowUps = allFollowUps
        .filter((followUp) => followUp.userId === person.id)
        .sort(
          (a, b) =>
            new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
        )

      const latestFollowUp = personFollowUps[0]
      const hasScheduledFollowUp = personFollowUps.some(
        (followUp) => followUp.status === 'SCHEDULED',
      )

      const personNotes = allNotes
        .filter((note) => note.personnelId === person.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

      const latestNote = personNotes[0]

      let caseStatus: CaseStatus = 'New'

      if (activeRecommendation) {
        caseStatus = 'Intervention Active'
      } else if (latestRecommendation && !latestRecommendation.isActive) {
        caseStatus = 'Resolved'
      } else if (hasScheduledFollowUp) {
        caseStatus = 'In Review'
      }

      const activityEvents = [
        latestRecommendation && {
          time: new Date(latestRecommendation.createdAt).getTime(),
          label: activeRecommendation
            ? 'Intervention started'
            : 'Intervention marked resolved',
        },
        latestFollowUp && {
          time: new Date(latestFollowUp.scheduledAt).getTime(),
          label: 'Follow-up scheduled',
        },
        latestNote && {
          time: new Date(latestNote.createdAt).getTime(),
          label: 'Welfare note added',
        },
      ].filter((event): event is { time: number; label: string } => Boolean(event))

      activityEvents.sort((a, b) => b.time - a.time)

      const lastAction = activityEvents[0]?.label ?? 'No action taken yet'

      return {
        id: String(person.id),
        name: person.name ?? '',
        unit: unitNameFor(person.id),
        riskLevel: riskLevel as 'Elevated' | 'High',
        score: latestAssessment?.stressScore ?? 0,
        caseStatus,
        assignedTo: officer.name ?? 'Unassigned',
        flaggedDate: formatDate(latestAssessment?.createdAt),
        lastAction,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.score - a.score)

  const summary = [
    {
      label: 'Total Cases',
      value: cases.length,
      icon: 'total' as const,
    },
    {
      label: 'New',
      value: cases.filter((c) => c.caseStatus === 'New').length,
      icon: 'new' as const,
    },
    {
      label: 'In Review',
      value: cases.filter((c) => c.caseStatus === 'In Review').length,
      icon: 'review' as const,
    },
    {
      label: 'Intervention Active',
      value: cases.filter((c) => c.caseStatus === 'Intervention Active').length,
      icon: 'active' as const,
    },
    {
      label: 'Resolved',
      value: cases.filter((c) => c.caseStatus === 'Resolved').length,
      icon: 'resolved' as const,
    },
  ]

  return {
    officer: {
      name: officer.name ?? '',
      role: 'Welfare Officer',
      avatarUrl: officer.profilePicture ?? null,
    },
    summary,
    cases,
  }
})