
import { db } from '../../../src/prisma/db'
import { requireRole } from '../../utils/authorization'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

function getRisk(score: number): RiskLevel {
  if (score < 3) return 'Low'
  if (score < 5) return 'Moderate'
  if (score < 7) return 'Elevated'
  return 'High'
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function relativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`

  return `${Math.floor(hours / 24)} days ago`
}

export default defineEventHandler(async (event) => {
  const authUser = await requireRole(event, ['OFFICER'])

  const officer = await db.orm.public.User
    .where({ id: authUser.userId })
    .first()

  if (!officer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  const assignment = await db.orm.public.UnitAssignment
    .where({ personnelId: authUser.userId })
    .first()

  if (!assignment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No unit assigned',
    })
  }

  const unit = await db.orm.public.Unit
    .where({ id: assignment.unitId })
    .first()

  if (!unit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Assigned unit not found',
    })
  }

  const assignments = await db.orm.public.UnitAssignment
    .where({ unitId: unit.id })
    .include('personnel')
    .all()

  const personnel = assignments.map((item) => item.personnel)
  const personnelIds = personnel.map((item) => item.id)

  const assessments = await db.orm.public.Assessment
    .include('user')
    .orderBy((item) => item.createdAt.desc())
    .all()

  const unitAssessments = assessments.filter(
    (item) => personnelIds.includes(item.userId),
  )

  /* Latest assessment for each personnel */
  const latest = new Map<number, (typeof unitAssessments)[number]>()

  for (const assessment of unitAssessments) {
    if (!latest.has(assessment.userId)) {
      latest.set(assessment.userId, assessment)
    }
  }

  const latestAssessments = [...latest.values()]

  /* Risk distribution */
  const counts: Record<RiskLevel, number> = {
    Low: 0,
    Moderate: 0,
    Elevated: 0,
    High: 0,
  }

  latestAssessments.forEach((assessment) => {
    counts[getRisk(assessment.stressScore)]++
  })

  const totalAssessed = latestAssessments.length

  const pct = (count: number) =>
    totalAssessed
      ? Number(((count / totalAssessed) * 100).toFixed(1))
      : 0

  const riskDistribution = [
    { label: 'Low', count: counts.Low, pct: pct(counts.Low), color: '#34d399' },
    { label: 'Moderate', count: counts.Moderate, pct: pct(counts.Moderate), color: '#60a5fa' },
    { label: 'Elevated', count: counts.Elevated, pct: pct(counts.Elevated), color: '#fbbf24' },
    { label: 'High', count: counts.High, pct: pct(counts.High), color: '#f87171' },
  ]

  /* High-risk personnel */
  const highRiskPersonnel = latestAssessments
    .filter((item) => getRisk(item.stressScore) === 'High')
    .slice(0, 10)
    .map((item) => ({
      id: String(item.userId),
      name: item.user.name ?? item.user.email,
      unit: unit.name,
      score: Number(item.stressScore.toFixed(2)),
      riskLevel: 'High' as const,
      lastAssessment: formatDate(item.createdAt),
    }))

  /* Average stress */
  const averageStress = unitAssessments.length
    ? unitAssessments.reduce(
        (sum, item) => sum + item.stressScore,
        0,
      ) / unitAssessments.length
    : 0

  /* Follow-ups / interventions */
  const followUps = await db.orm.public.FollowUp.all()

  const unitFollowUps = followUps.filter(
    (item) => personnelIds.includes(item.userId),
  )

  const interventionCounts = {
    Scheduled: 0,
    Completed: 0,
    Pending: 0,
    Cancelled: 0,
  }

  unitFollowUps.forEach((item) => {
    const status = item.status.toUpperCase()

    if (status === 'COMPLETED') interventionCounts.Completed++
    else if (status === 'PENDING') interventionCounts.Pending++
    else if (status === 'CANCELLED') interventionCounts.Cancelled++
    else interventionCounts.Scheduled++
  })

  const totalInterventions = unitFollowUps.length

  const interventionPct = (count: number) =>
    totalInterventions
      ? Number(((count / totalInterventions) * 100).toFixed(1))
      : 0

  const interventionStatus = [
    {
      label: 'Scheduled',
      count: interventionCounts.Scheduled,
      pct: interventionPct(interventionCounts.Scheduled),
      color: '#60a5fa',
    },
    {
      label: 'Completed',
      count: interventionCounts.Completed,
      pct: interventionPct(interventionCounts.Completed),
      color: '#34d399',
    },
    {
      label: 'Pending',
      count: interventionCounts.Pending,
      pct: interventionPct(interventionCounts.Pending),
      color: '#fbbf24',
    },
    {
      label: 'Cancelled',
      count: interventionCounts.Cancelled,
      pct: interventionPct(interventionCounts.Cancelled),
      color: '#f87171',
    },
  ]

  /* Recent assessments */
  const recentAssessments = unitAssessments
    .slice(0, 8)
    .map((item) => ({
      dateTime: formatDate(item.createdAt),
      personnelId: String(item.userId),
      score: Number(item.stressScore.toFixed(2)),
      riskLevel: getRisk(item.stressScore),
    }))

  /* Stress trend - last 6 months */
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - index))

    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleString('en-US', { month: 'short' }),
      values: [] as number[],
    }
  })

  unitAssessments.forEach((item) => {
    const date = new Date(item.createdAt)

    const month = months.find(
      (m) =>
        m.year === date.getFullYear() &&
        m.month === date.getMonth(),
    )

    if (month) month.values.push(item.stressScore)
  })

  const stressTrend = {
    labels: months.map((m) => m.label),
    values: months.map((m) =>
      m.values.length
        ? Number(
            (
              m.values.reduce((a, b) => a + b, 0) /
              m.values.length
            ).toFixed(2),
          )
        : 0,
    ),
  }

  /* Recommendations */
  const recommendations = await db.orm.public.Recommendation
    .where({ isActive: true })
    .orderBy((item) => item.createdAt.desc())
    .limit(5)
    .all()

  const welfareRecommendations = recommendations
    .filter((item) => personnelIds.includes(item.userId))
    .map((item) => ({
      title: item.title,
      description: item.description,
      priority: 'Moderate' as RiskLevel,
      icon: item.type.toLowerCase() as
        | 'sleep'
        | 'activity'
        | 'workload'
        | 'social',
    }))

  /* Notifications */
  const notifications = await db.orm.public.Notification
    .where({ userId: authUser.userId })
    .orderBy((item) => item.createdAt.desc())
    .limit(10)
    .all()

  return {
    officer: {
      name: officer.name ?? officer.username ?? officer.email,
      role: officer.rank ?? 'Welfare Officer',
      unitName: unit.name,
      unitCode: unit.code,
      lastLoginLabel: 'Not available',
      avatarUrl: officer.profilePicture ?? null,
    },

    statCards: [
      {
        label: 'Total Personnel',
        value: personnel.length,
        icon: 'users',
        footerValue: String(personnel.length),
        footerText: 'assigned to unit',
        footerTone: 'neutral',
      },
      {
        label: 'Average Stress',
        value: averageStress.toFixed(1),
        icon: 'shield',
        footerValue: 'out of 10',
        footerText: '',
        footerTone: 'neutral',
      },
      {
        label: 'High-Risk Cases',
        value: counts.High,
        icon: 'alertTriangle',
        footerValue: `${pct(counts.High)}%`,
        footerText: 'of assessed personnel',
        footerTone: counts.High ? 'negative' : 'positive',
        urgentText: counts.High
          ? `${counts.High} urgent`
          : undefined,
      },
      {
        label: 'Active Interventions',
        value:
          interventionCounts.Scheduled +
          interventionCounts.Pending,
        icon: 'user',
        footerValue: String(interventionCounts.Pending),
        footerText: 'pending',
        footerTone: interventionCounts.Pending
          ? 'negative'
          : 'positive',
      },
      {
        label: 'Assessments',
        value: unitAssessments.length,
        icon: 'alertCircle',
        footerValue: String(unitAssessments.length),
        footerText: 'recorded',
        footerTone: 'neutral',
      },
    ],

    riskDistribution,
    totalPersonnelForDonut: personnel.length,
    riskDistributionScopeLabel: unit.name,

    stressTrend,
    trendRangeLabel: 'Last 6 months',

    highRiskPersonnel,

    interventionStatus,
    totalInterventions,

    recentAssessments,

    welfareRecommendations,

    recentAlerts: unitAssessments
      .filter((item) => {
        const risk = getRisk(item.stressScore)
        return risk === 'High' || risk === 'Elevated'
      })
      .slice(0, 5)
      .map((item) => ({
        title: `${getRisk(item.stressScore)} stress detected`,
        detail: `${item.user.name ?? item.user.email} scored ${item.stressScore.toFixed(1)}/10.`,
        time: relativeTime(item.createdAt),
        tone: getRisk(item.stressScore) === 'High'
          ? 'red' as const
          : 'amber' as const,
      })),

    notifications: notifications.map((item) => ({
      id: String(item.id),
      title: item.title,
      timeLabel: relativeTime(item.createdAt),
      read: item.isRead,
    })),
  }
})

