import { getAuthUser } from '../../utils/auth-session'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Personnel access required',
    })
  }

  // ------------------------------------------------------------
  // USER
  // ------------------------------------------------------------
  const user = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel profile not found',
    })
  }

  // ------------------------------------------------------------
  // UNIT ASSIGNMENT
  // ------------------------------------------------------------
  const assignment = await db.orm.public.UnitAssignment.first({
    personnelId: authUser.userId,
  })

  let unit = null

  if (assignment) {
    unit = await db.orm.public.Unit.first({
      id: assignment.unitId,
    })
  }

  // ------------------------------------------------------------
  // ASSESSMENTS
  // Prisma 8 / Prisma Next uses:
  // where() -> orderBy() -> all()
  // ------------------------------------------------------------
  const assessments = await db.orm.public.Assessment
    .where({
      userId: authUser.userId,
    })
    .orderBy((assessment) => assessment.createdAt.desc())
    .all()

  // ------------------------------------------------------------
  // NOTIFICATIONS
  // ------------------------------------------------------------
  const notifications = await db.orm.public.Notification
    .where({
      userId: authUser.userId,
    })
    .orderBy((notification) => notification.createdAt.desc())
    .all()

  // ------------------------------------------------------------
  // LATEST ASSESSMENT
  // ------------------------------------------------------------
  const latestAssessment = assessments[0] ?? null

  // ------------------------------------------------------------
  // DATE / TIME HELPERS
  // ------------------------------------------------------------
  const formatDate = (value: unknown): string => {
    if (!value) return '—'

    return new Date(String(value)).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (value: unknown): string => {
    if (!value) return '—'

    return new Date(String(value)).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ------------------------------------------------------------
  // RISK LEVEL
  // ------------------------------------------------------------
  type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

  const normalizeRiskLevel = (value: string): RiskLevel => {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'low') return 'Low'
    if (normalized === 'moderate') return 'Moderate'
    if (normalized === 'elevated') return 'Elevated'
    if (normalized === 'high') return 'High'

    return 'Low'
  }

  const currentStressScore = latestAssessment
    ? Number(latestAssessment.stressScore)
    : 0

  const riskLevel = latestAssessment
    ? normalizeRiskLevel(latestAssessment.riskLevel)
    : 'Low'

  // ------------------------------------------------------------
  // RISK NOTE
  // ------------------------------------------------------------
  const riskLevelNotes: Record<RiskLevel, string> = {
    Low: 'Your current stress level is within a lower-risk range.',
    Moderate: 'Your stress level is moderate. Consider preventive care.',
    Elevated:
      'Your stress level is elevated. Monitor your wellbeing and seek support when needed.',
    High:
      'Your stress level is high. Consider reaching out for appropriate support.',
  }

  // ------------------------------------------------------------
  // STRESS TREND
  // Oldest -> newest for chart
  // ------------------------------------------------------------
  const stressTrend = [...assessments]
    .reverse()
    .map((assessment) => ({
      dateLabel: formatDate(assessment.createdAt),
      score: Number(assessment.stressScore),
    }))

  // ------------------------------------------------------------
  // RECENT ASSESSMENTS
  // Newest -> oldest
  // ------------------------------------------------------------
  const recentAssessments = assessments.slice(0, 5).map((assessment) => ({
    dateTime: `${formatDate(assessment.createdAt)} ${formatTime(
      assessment.createdAt
    )}`,
    score: Number(assessment.stressScore),
    riskLevel: normalizeRiskLevel(assessment.riskLevel),
  }))

  // ------------------------------------------------------------
  // RESPONSE
  // Only information available in the database is returned.
  // No fake stress/risk/notification data is created.
  // ------------------------------------------------------------
  return {
    profile: {
      serviceId: user.username ?? String(user.id),
      name: user.name ?? '—',

      // These fields do not exist in the current database yet.
      rank: '—',
      status: '—',

      unit: unit?.name ?? 'Not Assigned',

      joinedDate: formatDate(user.createdAt),
      avatarUrl: user.profilePicture ?? null,
    },

    currentStressScore,
    maxStressScore: 10,

    riskLevel,
    riskLevelNote: riskLevelNotes[riskLevel],

    lastAssessmentDate: latestAssessment
      ? formatDate(latestAssessment.createdAt)
      : '—',

    lastAssessmentTime: latestAssessment
      ? formatTime(latestAssessment.createdAt)
      : '—',

    // Follow-up table does not exist in current database.
    nextFollowUpDate: '—',
    nextFollowUpRelative: '—',

    stressTrend,

    trendRangeLabel:
      assessments.length > 0
        ? `Last ${assessments.length} assessments`
        : 'No assessments',

    // Recommendation table does not exist yet.
    recommendations: [],

    recentAssessments,

    notifications: notifications.map((notification) => ({
      id: String(notification.id),
      title: notification.title,
      timeLabel: formatDate(notification.createdAt),
      read: notification.isRead,
    })),
  }
})