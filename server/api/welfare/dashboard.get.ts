import { db } from '../../../src/prisma/db'
import { getAuthUser } from '../../utils/auth-session'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#34d399',
  Moderate: '#60a5fa',
  Elevated: '#fbbf24',
  High: '#f87171',
}

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

function dayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10)
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

  const units = await db.orm.public.Unit.all()

  const primaryUnit = units.find((unit) => unit.id === officerUnitIds[0])

  const allAssignments = await db.orm.public.UnitAssignment.all()

  const personnelAssignments = allAssignments.filter(
    (assignment) =>
      officerUnitIds.includes(assignment.unitId) &&
      assignment.personnelId !== officer.id,
  )

  const personnelIds = [
    ...new Set(personnelAssignments.map((assignment) => assignment.personnelId)),
  ]

  const allUsers = await db.orm.public.User.all()

  const personnel = allUsers.filter(
    (candidate) =>
      personnelIds.includes(candidate.id) && candidate.role === 'PERSONNEL',
  )

  const allAssessments = await db.orm.public.Assessment.all()
  const allFollowUps = await db.orm.public.FollowUp.all()
  const allRecommendations = await db.orm.public.Recommendation.all()
  const officerNotifications = await db.orm.public.Notification.where({
    userId: officer.id,
  }).all()

  function unitNameFor(personnelId: number): string {
    const assignment = personnelAssignments.find(
      (item) => item.personnelId === personnelId,
    )
    const unit = units.find((item) => item.id === assignment?.unitId)
    return unit?.name ?? ''
  }

  const personSummaries = personnel.map((person) => {
    const personAssessments = allAssessments
      .filter((assessment) => assessment.userId === person.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

    const latestAssessment = personAssessments[0]

    const personFollowUps = allFollowUps
      .filter((followUp) => followUp.userId === person.id)
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      )

    const latestFollowUp = personFollowUps[0]

    return {
      person,
      unitName: unitNameFor(person.id),
      latestAssessment,
      latestFollowUp,
      riskLevel: normalizeRiskLevel(latestAssessment?.riskLevel),
    }
  })

  /* ---------------- Stat cards ---------------- */
  const highRiskCount = personSummaries.filter((s) => s.riskLevel === 'High').length
  const elevatedCount = personSummaries.filter((s) => s.riskLevel === 'Elevated').length

  const activeInterventions = allRecommendations.filter(
    (rec) => rec.isActive && personnelIds.includes(rec.userId),
  )
  const completedInterventions = allRecommendations.filter(
    (rec) => !rec.isActive && personnelIds.includes(rec.userId),
  )

  const now = Date.now()
  const pendingFollowUps = allFollowUps.filter(
    (followUp) =>
      personnelIds.includes(followUp.userId) &&
      followUp.status === 'SCHEDULED',
  )
  const overdueFollowUps = pendingFollowUps.filter(
    (followUp) => new Date(followUp.scheduledAt).getTime() < now,
  )

  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const scopedAssessments = allAssessments.filter((assessment) =>
    personnelIds.includes(assessment.userId),
  )
  const assessmentsThisWeek = scopedAssessments.filter(
    (assessment) => new Date(assessment.createdAt).getTime() >= weekAgo,
  )

  const statCards = [
    {
      label: 'Total Personnel',
      value: personnel.length,
      icon: 'users' as const,
      footerValue: `${officerUnitIds.length}`,
      footerText: officerUnitIds.length === 1 ? 'unit under supervision' : 'units under supervision',
      footerTone: 'neutral' as const,
    },
    {
      label: 'High Risk Cases',
      value: highRiskCount,
      icon: 'alertTriangle' as const,
      footerValue: `${elevatedCount}`,
      footerText: 'also elevated',
      footerTone: highRiskCount > 0 ? ('negative' as const) : ('positive' as const),
      urgentText: highRiskCount > 0 ? `${highRiskCount} urgent` : undefined,
    },
    {
      label: 'Active Interventions',
      value: activeInterventions.length,
      icon: 'shield' as const,
      footerValue: `${completedInterventions.length}`,
      footerText: 'completed',
      footerTone: 'neutral' as const,
    },
    {
      label: 'Pending Follow-ups',
      value: pendingFollowUps.length,
      icon: 'user' as const,
      footerValue: `${overdueFollowUps.length}`,
      footerText: 'overdue',
      footerTone: overdueFollowUps.length > 0 ? ('negative' as const) : ('positive' as const),
    },
    {
      label: 'Assessments This Week',
      value: assessmentsThisWeek.length,
      icon: 'alertCircle' as const,
      footerValue: `${scopedAssessments.length}`,
      footerText: 'all time',
      footerTone: 'neutral' as const,
    },
  ]

  /* ---------------- Risk distribution ---------------- */
  const riskLevels: RiskLevel[] = ['Low', 'Moderate', 'Elevated', 'High']
  const riskCounts = riskLevels.map((level) => ({
    level,
    count: personSummaries.filter((s) => s.riskLevel === level).length,
  }))
  const totalPersonnelForDonut = personnel.length

  const riskDistribution = riskCounts.map(({ level, count }) => ({
    label: level,
    count,
    pct: totalPersonnelForDonut
      ? Math.round((count / totalPersonnelForDonut) * 1000) / 10
      : 0,
    color: RISK_COLORS[level],
  }))

  /* ---------------- Stress trend (last 7 days, unit-wide average) ---------------- */
  const assessmentsByDay = new Map<string, number[]>()

  for (const assessment of scopedAssessments) {
    const key = dayKey(assessment.createdAt)
    const scores = assessmentsByDay.get(key) ?? []
    scores.push(assessment.stressScore)
    assessmentsByDay.set(key, scores)
  }

  const sortedDayKeys = [...assessmentsByDay.keys()].sort()
  const last7DayKeys = sortedDayKeys.slice(-7)

  const stressTrend = {
    labels: last7DayKeys.map((key) => formatDate(key)),
    values: last7DayKeys.map((key) => {
      const scores = assessmentsByDay.get(key) ?? []
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
      return Math.round(average * 10) / 10
    }),
  }

  /* ---------------- High-risk personnel table ---------------- */
  const highRiskPersonnel = personSummaries
    .filter((s) => s.riskLevel === 'High' || s.riskLevel === 'Elevated')
    .sort(
      (a, b) => (b.latestAssessment?.stressScore ?? 0) - (a.latestAssessment?.stressScore ?? 0),
    )
    .slice(0, 10)
    .map((s) => ({
      id: String(s.person.id),
      name: s.person.name ?? '',
      unit: s.unitName,
      score: s.latestAssessment?.stressScore ?? 0,
      riskLevel: s.riskLevel,
      lastAssessment: formatDate(s.latestAssessment?.createdAt),
    }))

  /* ---------------- Intervention status donut ---------------- */
  const totalInterventions = activeInterventions.length + completedInterventions.length

  const interventionStatus = [
    {
      label: 'Active',
      count: activeInterventions.length,
      pct: totalInterventions
        ? Math.round((activeInterventions.length / totalInterventions) * 1000) / 10
        : 0,
      color: '#60a5fa',
    },
    {
      label: 'Completed',
      count: completedInterventions.length,
      pct: totalInterventions
        ? Math.round((completedInterventions.length / totalInterventions) * 1000) / 10
        : 0,
      color: '#34d399',
    },
  ]

  /* ---------------- Recent assessments (unit-wide) ---------------- */
  const recentAssessments = [...scopedAssessments]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10)
    .map((assessment) => ({
      dateTime: `${formatDate(assessment.createdAt)} ${formatTime(assessment.createdAt)}`,
      personnelId: String(assessment.userId),
      score: assessment.stressScore,
      riskLevel: normalizeRiskLevel(assessment.riskLevel),
    }))

  /* ---------------- Welfare recommendations (top 5 active) ---------------- */
  const recommendationIconMap = {
    SLEEP: 'sleep' as const,
    ACTIVITY: 'activity' as const,
    WORKLOAD: 'workload' as const,
    SOCIAL: 'social' as const,
  }

  const welfareRecommendations = allRecommendations
    .filter((rec) => rec.isActive && personnelIds.includes(rec.userId))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .map((rec) => {
      const owner = personSummaries.find((s) => s.person.id === rec.userId)

      return {
        title: rec.title,
        description: rec.description,
        priority: owner?.riskLevel ?? 'Low',
        icon: recommendationIconMap[rec.type],
      }
    })

  /* ---------------- Recent alerts ---------------- */
  const highRiskAlerts = personSummaries
    .filter((s) => s.riskLevel === 'High' && s.latestAssessment)
    .map((s) => ({
      title: `${s.person.name ?? 'Personnel'} flagged High Risk`,
      detail: `Latest stress score ${s.latestAssessment?.stressScore} in ${s.unitName || 'unit'}`,
      time: formatDate(s.latestAssessment?.createdAt),
      timestamp: new Date(s.latestAssessment?.createdAt ?? 0).getTime(),
      tone: 'red' as const,
    }))

  const overdueAlerts = overdueFollowUps.map((followUp) => {
    const owner = personSummaries.find((s) => s.person.id === followUp.userId)

    return {
      title: `Follow-up overdue for ${owner?.person.name ?? 'personnel'}`,
      detail: `Was scheduled for ${formatDate(followUp.scheduledAt)}`,
      time: formatDate(followUp.scheduledAt),
      timestamp: new Date(followUp.scheduledAt).getTime(),
      tone: 'amber' as const,
    }
  })

  const recentAlerts = [...highRiskAlerts, ...overdueAlerts]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(({ title, detail, time, tone }) => ({ title, detail, time, tone }))

  /* ---------------- Notifications ---------------- */
  const notifications = [...officerNotifications]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8)
    .map((notification) => ({
      id: String(notification.id),
      title: notification.title,
      timeLabel: formatDate(notification.createdAt),
      read: notification.isRead,
    }))

  return {
    officer: {
      name: officer.name ?? '',
      role: 'Welfare Officer',
      unitName: primaryUnit?.name ?? '',
      unitCode: primaryUnit?.code ?? '',
      lastLoginLabel: formatDate(officer.updatedAt),
      avatarUrl: officer.profilePicture ?? null,
    },
    statCards,
    riskDistribution,
    totalPersonnelForDonut,
    riskDistributionScopeLabel: 'This Month',
    stressTrend,
    trendRangeLabel: 'Last 7 Days',
    highRiskPersonnel,
    interventionStatus,
    totalInterventions,
    recentAssessments,
    welfareRecommendations,
    recentAlerts,
    notifications,
  }
})