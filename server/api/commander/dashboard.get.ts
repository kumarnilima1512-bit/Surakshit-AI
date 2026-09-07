import { db } from '../../../src/prisma/db'
import { getAuthUser } from '../../utils/auth-session'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#34d399',
  Moderate: '#fbbf24',
  Elevated: '#fb923c',
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

function dayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10)
}

function monthKey(value: string): string {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function timeAgo(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
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

  const commanderUnitIds = commanderAssignments.map((assignment) => assignment.unitId)

  const units = await db.orm.public.Unit.all()
  const primaryUnit = units.find((unit) => unit.id === commanderUnitIds[0])

  const allAssignments = await db.orm.public.UnitAssignment.all()

  const personnelAssignments = allAssignments.filter(
    (assignment) =>
      commanderUnitIds.includes(assignment.unitId) &&
      assignment.personnelId !== commander.id,
  )

  const personnelIds = [
    ...new Set(personnelAssignments.map((assignment) => assignment.personnelId)),
  ]

  const allUsers = await db.orm.public.User.all()

  const personnel = allUsers.filter(
    (candidate) =>
      personnelIds.includes(candidate.id) && candidate.role === 'PERSONNEL',
  )

  function unitNameFor(personnelId: number): string {
    const assignment = personnelAssignments.find(
      (item) => item.personnelId === personnelId,
    )
    const unit = units.find((item) => item.id === assignment?.unitId)
    return unit?.name ?? 'Unassigned'
  }

  const allAssessments = await db.orm.public.Assessment.all()
  const allFollowUps = await db.orm.public.FollowUp.all()
  const allNotes = await db.orm.public.WelfareNote.all()
  const allRecommendations = await db.orm.public.Recommendation.all()
  const commanderNotifications = await db.orm.public.Notification.where({
    userId: commander.id,
  }).all()

  const scopedAssessments = allAssessments.filter((assessment) =>
    personnelIds.includes(assessment.userId),
  )
  const scopedFollowUps = allFollowUps.filter((followUp) =>
    personnelIds.includes(followUp.userId),
  )

  const personSummaries = personnel.map((person) => {
    const personAssessments = scopedAssessments
      .filter((assessment) => assessment.userId === person.id)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

    const latestAssessment = personAssessments[0]

    return {
      person,
      unitName: unitNameFor(person.id),
      latestAssessment,
      riskLevel: normalizeRiskLevel(latestAssessment?.riskLevel),
    }
  })

  /* ---------------- Stat cards ---------------- */
  const now = Date.now()
  const thisMonthKey = monthKey(new Date().toISOString())
  const lastMonthDate = new Date()
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
  const lastMonthKey = monthKey(lastMonthDate.toISOString())

  const highRiskThisMonth = scopedAssessments.filter(
    (a) => normalizeRiskLevel(a.riskLevel) === 'High' && monthKey(a.createdAt) === thisMonthKey,
  ).length
  const highRiskLastMonth = scopedAssessments.filter(
    (a) => normalizeRiskLevel(a.riskLevel) === 'High' && monthKey(a.createdAt) === lastMonthKey,
  ).length

  const pendingFollowUps = scopedFollowUps.filter((f) => f.status !== 'COMPLETED')
  const pendingThisMonth = pendingFollowUps.filter(
    (f) => monthKey(f.scheduledAt) === thisMonthKey,
  ).length
  const pendingLastMonth = pendingFollowUps.filter(
    (f) => monthKey(f.scheduledAt) === lastMonthKey,
  ).length

  const assessmentsThisMonth = scopedAssessments.filter(
    (a) => monthKey(a.createdAt) === thisMonthKey,
  ).length
  const assessmentsLastMonth = scopedAssessments.filter(
    (a) => monthKey(a.createdAt) === lastMonthKey,
  ).length

  const statCards = [
    {
      label: 'Total Personnel',
      value: personnel.length,
      deltaPct: null,
      goodDirection: 'up' as const,
      icon: 'users' as const,
    },
    {
      label: 'High-Risk Alerts',
      value: personSummaries.filter((s) => s.riskLevel === 'High').length,
      deltaPct: pctChange(highRiskThisMonth, highRiskLastMonth),
      goodDirection: 'down' as const,
      icon: 'alert' as const,
    },
    {
      label: 'Pending Follow-ups',
      value: pendingFollowUps.length,
      deltaPct: pctChange(pendingThisMonth, pendingLastMonth),
      goodDirection: 'down' as const,
      icon: 'clock' as const,
    },
    {
      label: 'Assessments This Month',
      value: assessmentsThisMonth,
      deltaPct: pctChange(assessmentsThisMonth, assessmentsLastMonth),
      goodDirection: 'up' as const,
      icon: 'check' as const,
    },
  ]

  /* ---------------- Stress trend (last 14 days) ---------------- */
  const scoresByDay = new Map<string, number[]>()

  for (const assessment of scopedAssessments) {
    const key = dayKey(assessment.createdAt)
    const scores = scoresByDay.get(key) ?? []
    scores.push(assessment.stressScore)
    scoresByDay.set(key, scores)
  }

  const sortedDayKeys = [...scoresByDay.keys()].sort()
  const last14DayKeys = sortedDayKeys.slice(-14)

  const stressTrend = last14DayKeys.map((key) => {
    const scores = scoresByDay.get(key) ?? []
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return {
      label: formatDate(key),
      value: Math.round(average * 10) / 10,
    }
  })

  /* ---------------- Average stress + delta ---------------- */
  const currentScores = personSummaries
    .map((s) => s.latestAssessment?.stressScore)
    .filter((score): score is number => typeof score === 'number')

  const avgStressScore = currentScores.length
    ? Math.round((currentScores.reduce((sum, s) => sum + s, 0) / currentScores.length) * 10) / 10
    : 0

  const thisMonthScores = scopedAssessments
    .filter((a) => monthKey(a.createdAt) === thisMonthKey)
    .map((a) => a.stressScore)
  const lastMonthScores = scopedAssessments
    .filter((a) => monthKey(a.createdAt) === lastMonthKey)
    .map((a) => a.stressScore)

  const avgThisMonth = thisMonthScores.length
    ? thisMonthScores.reduce((sum, s) => sum + s, 0) / thisMonthScores.length
    : 0
  const avgLastMonth = lastMonthScores.length
    ? lastMonthScores.reduce((sum, s) => sum + s, 0) / lastMonthScores.length
    : 0

  const avgStressDeltaPct = pctChange(avgThisMonth, avgLastMonth)

  /* ---------------- Risk distribution ---------------- */
  const riskLevels: RiskLevel[] = ['Low', 'Moderate', 'Elevated', 'High']
  const totalPersonnelForDonut = personnel.length

  const riskDistribution = riskLevels.map((level) => {
    const count = personSummaries.filter((s) => s.riskLevel === level).length
    return {
      label: level,
      count,
      pct: totalPersonnelForDonut
        ? Math.round((count / totalPersonnelForDonut) * 1000) / 10
        : 0,
      color: RISK_COLORS[level],
    }
  })

  /* ---------------- Risk level by sub-unit ---------------- */
  const unitNames = [...new Set(personSummaries.map((s) => s.unitName))]

  const subUnitBars = unitNames.map((name) => {
    const inUnit = personSummaries.filter((s) => s.unitName === name)
    return {
      name,
      low: inUnit.filter((s) => s.riskLevel === 'Low').length,
      moderate: inUnit.filter((s) => s.riskLevel === 'Moderate').length,
      elevated: inUnit.filter((s) => s.riskLevel === 'Elevated').length,
      high: inUnit.filter((s) => s.riskLevel === 'High').length,
    }
  })

  /* ---------------- Personnel table ---------------- */
  const personnelRows = personSummaries
    .sort((a, b) => (b.latestAssessment?.stressScore ?? 0) - (a.latestAssessment?.stressScore ?? 0))
    .map((s) => ({
      id: String(s.person.id),
      name: s.person.name ?? '',
      subUnit: s.unitName,
      level: s.riskLevel,
      score: s.latestAssessment?.stressScore ?? 0,
      lastAssessment: formatDate(s.latestAssessment?.createdAt),
    }))

  /* ---------------- Follow-ups ---------------- */
  const followUps = [...pendingFollowUps]
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 8)
    .map((followUp) => {
      const owner = personSummaries.find((s) => s.person.id === followUp.userId)
      const isOverdue = new Date(followUp.scheduledAt).getTime() < now

      return {
        personnelName: owner?.person.name ?? 'Unknown',
        personnelId: owner ? String(owner.person.id) : String(followUp.userId),
        dueDate: formatDate(followUp.scheduledAt),
        reason: followUp.notes || 'Welfare Check-in',
        status: isOverdue ? ('Overdue' as const) : ('Scheduled' as const),
      }
    })

  /* ---------------- Recent activity ---------------- */
  const noteEvents = allNotes
    .filter((note) => personnelIds.includes(note.personnelId))
    .map((note) => {
      const author = allUsers.find((u) => u.id === note.authorId)
      const person = allUsers.find((u) => u.id === note.personnelId)
      return {
        text: `Welfare note added for ${person?.name ?? 'personnel'}`,
        by: author?.name ?? 'Welfare Officer',
        time: note.createdAt,
      }
    })

  const recommendationEvents = allRecommendations
    .filter((rec) => personnelIds.includes(rec.userId))
    .map((rec) => {
      const person = allUsers.find((u) => u.id === rec.userId)
      return {
        text: `${rec.title} recommended for ${person?.name ?? 'personnel'}`,
        by: 'Welfare Officer',
        time: rec.createdAt,
      }
    })

  const followUpEvents = scopedFollowUps.map((followUp) => {
    const person = allUsers.find((u) => u.id === followUp.userId)
    return {
      text: `Follow-up scheduled for ${person?.name ?? 'personnel'}`,
      by: 'Welfare Officer',
      time: followUp.createdAt,
    }
  })

  const recentActivity = [...noteEvents, ...recommendationEvents, ...followUpEvents]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)
    .map((event) => ({
      text: event.text,
      by: event.by,
      time: timeAgo(event.time),
    }))

  /* ---------------- Notifications ---------------- */
  const notifications = [...commanderNotifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map((notification) => ({
      id: String(notification.id),
      title: notification.title,
      timeLabel: formatDate(notification.createdAt),
      read: notification.isRead,
    }))

  return {
    commander: {
      serviceId: String(commander.id),
      name: commander.name ?? '',
      rank: commander.rank ?? '',
      unit: primaryUnit?.name ?? '',
      avatarUrl: commander.profilePicture ?? null,
    },
    statCards,
    stressTrend,
    avgStressScore,
    avgStressDeltaPct,
    riskDistribution,
    totalPersonnelForDonut,
    subUnitBars,
    personnel: personnelRows,
    followUps,
    recentActivity,
    notifications,
  }
})