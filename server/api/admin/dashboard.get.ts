import { requireRole } from '../../utils/authorization'
import { db } from '../../../src/prisma/db'

/* =========================================================
   HELPERS
========================================================= */

function formatRelativeTime(date: Date | string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = Math.max(0, now - then)

  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 30) return `${diffDay}d ago`

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function toneForRiskLevel(riskLevel: string): 'blue' | 'amber' | 'green' {
  const level = riskLevel.toLowerCase()

  if (level === 'high' || level === 'elevated') {
    return 'amber'
  }

  return 'green'
}

function monthLabel(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  })
}

function dayLabel(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/* =========================================================
   HANDLER
========================================================= */

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  const [
    users,
    units,
    assignments,
    assessments,
  ] = await Promise.all([
    db.orm.public.User.all(),
    db.orm.public.Unit.all(),
    db.orm.public.UnitAssignment.all(),
    db.orm.public.Assessment.all(),
  ])

  const personnel = users.filter(
    (u) => u.role === 'PERSONNEL'
  )

  const activePersonnelIds = new Set(
    assignments.map((a) => a.personnelId)
  )

  const activePersonnel = personnel.filter((p) =>
    activePersonnelIds.has(p.id)
  )

  const highRiskAssessments = assessments.filter(
    (a) => a.riskLevel.toLowerCase() === 'high'
  )

  const elevatedRiskAssessments = assessments.filter(
    (a) => a.riskLevel.toLowerCase() === 'elevated'
  )

  const averageStress =
    assessments.length > 0
      ? assessments.reduce(
          (sum, assessment) => sum + Number(assessment.stressScore),
          0
        ) / assessments.length
      : 0

  /* =========================================================
     LOOKUP HELPERS
  ========================================================= */

  const unitById = new Map<string | number, (typeof units)[number]>(
    units.map((u) => [u.id, u])
  )

  const userById = new Map<string | number, (typeof users)[number]>(
    users.map((u) => [u.id, u])
  )

  const unitIdByPersonnelId = new Map<string | number, string | number>(
    assignments.map((a) => [a.personnelId, a.unitId])
  )

  function getUnitNameForPersonnel(personnelId: string | number): string {
    const unitId = unitIdByPersonnelId.get(personnelId)
    const unit = unitId !== undefined ? unitById.get(unitId) : undefined
    return unit?.name || 'Unassigned'
  }

  /* =========================================================
     RISK DISTRIBUTION (donut)
  ========================================================= */

  const riskLevels = [
    'Low',
    'Moderate',
    'Elevated',
    'High',
  ]

  const riskDistribution = riskLevels.map((level) => {
    const count = assessments.filter(
      (a) =>
        a.riskLevel.toLowerCase() === level.toLowerCase()
    ).length

    const pct =
      assessments.length > 0
        ? Number(((count / assessments.length) * 100).toFixed(2))
        : 0

    return {
      label: level,
      pct,
      count,
      color:
        level === 'Low'
          ? '#34d399'
          : level === 'Moderate'
            ? '#fbbf24'
            : level === 'Elevated'
              ? '#fb923c'
              : '#f87171',
    }
  })

  /* =========================================================
     UNIT BARS (matches frontend UnitBar interface)
  ========================================================= */

  const unitBars = units.map((unit) => {
    const unitPersonnelIds = new Set(
      assignments
        .filter((a) => a.unitId === unit.id)
        .map((a) => a.personnelId)
    )

    const unitAssessments = assessments.filter((a) =>
      unitPersonnelIds.has(a.userId)
    )

    const countByLevel = (level: string) =>
      unitAssessments.filter(
        (a) => a.riskLevel.toLowerCase() === level
      ).length

    return {
      unit: unit.name,
      low: countByLevel('low'),
      moderate: countByLevel('moderate'),
      elevated: countByLevel('elevated'),
      high: countByLevel('high'),
    }
  })

  /* =========================================================
     RECENT ACTIVITY (matches frontend ActivityItem interface)
  ========================================================= */

  const recentAssessments = [...assessments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 10)

  const recentActivity = recentAssessments.map((assessment) => {
    const person = userById.get(assessment.userId)

    const personName =
      person?.name ||
      person?.username ||
      person?.email ||
      'Unknown Personnel'

    return {
      text: `${personName} completed a stress assessment (Risk: ${assessment.riskLevel})`,
      by: personName,
      time: formatRelativeTime(assessment.createdAt),
      tone: toneForRiskLevel(assessment.riskLevel),
    }
  })

  /* =========================================================
     HIGH RISK PERSONNEL (matches frontend HighRiskPerson interface)
  ========================================================= */

  const highRiskPersonnel = [
    ...highRiskAssessments,
    ...elevatedRiskAssessments,
  ]
    .sort(
      (a, b) => Number(b.stressScore) - Number(a.stressScore)
    )
    .slice(0, 10)
    .map((assessment) => {
      const person = userById.get(assessment.userId)

      const level: 'High' | 'Elevated' =
        assessment.riskLevel.toLowerCase() === 'high'
          ? 'High'
          : 'Elevated'

      return {
        id: assessment.userId,
        name:
          person?.name ||
          person?.username ||
          person?.email ||
          'Unknown Personnel',
        unit: getUnitNameForPersonnel(assessment.userId),
        level,
        score: Number(assessment.stressScore),
      }
    })

  /* =========================================================
     STRESS TREND (last 7 days, avg stress per day)
  ========================================================= */

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const trendBuckets = new Map<string, number[]>()

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    trendBuckets.set(dayLabel(d), [])
  }

  for (const assessment of assessments) {
    const createdAt = new Date(assessment.createdAt)

    if (createdAt >= sevenDaysAgo) {
      const label = dayLabel(createdAt)

      if (trendBuckets.has(label)) {
        trendBuckets.get(label)!.push(Number(assessment.stressScore))
      }
    }
  }

  const stressTrend = Array.from(trendBuckets.entries()).map(
    ([label, scores]) => ({
      label,
      value:
        scores.length > 0
          ? Number(
              (
                scores.reduce((sum, s) => sum + s, 0) / scores.length
              ).toFixed(2)
            )
          : 0,
    })
  )

  /* =========================================================
     MONTHLY STATS (last 6 months)
  ========================================================= */

  const monthBuckets = new Map<
    string,
    { total: number; highRisk: number }
  >()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo)
    d.setMonth(d.getMonth() + i)
    monthBuckets.set(monthLabel(d), { total: 0, highRisk: 0 })
  }

  for (const assessment of assessments) {
    const createdAt = new Date(assessment.createdAt)

    if (createdAt >= sixMonthsAgo) {
      const label = monthLabel(createdAt)

      if (monthBuckets.has(label)) {
        const bucket = monthBuckets.get(label)!
        bucket.total += 1

        if (assessment.riskLevel.toLowerCase() === 'high') {
          bucket.highRisk += 1
        }
      }
    }
  }

  const monthlyStats = Array.from(monthBuckets.entries()).map(
    ([month, stats]) => ({
      month,
      total: stats.total,
      highRisk: stats.highRisk,
    })
  )

  /* =========================================================
     RESPONSE
  ========================================================= */

  return {
    success: true,
    message: 'Welcome to Admin Dashboard',

    user: {
      id: user.userId,
      email: user.email,
      role: user.role,
    },

    adminName: 'System Administrator',

    statCards: [
      {
        label: 'Total Personnel',
        value: personnel.length,
        deltaPct: null,
        goodDirection: 'up',
        icon: 'users',
      },
      {
        label: 'Active Personnel',
        value: activePersonnel.length,
        deltaPct: null,
        goodDirection: 'up',
        icon: 'user',
      },
      {
        label: 'High Risk',
        value: highRiskAssessments.length,
        deltaPct: null,
        goodDirection: 'down',
        icon: 'alert',
      },
      {
        label: 'Elevated Risk',
        value: elevatedRiskAssessments.length,
        deltaPct: null,
        goodDirection: 'down',
        icon: 'triangle',
      },
      {
        label: 'Units',
        value: units.length,
        deltaPct: null,
        goodDirection: 'up',
        icon: 'building',
      },
      {
        label: 'Assessments',
        value: assessments.length,
        deltaPct: null,
        goodDirection: 'up',
        icon: 'doc',
      },
      {
        label: 'Avg. Stress',
        value: Number(averageStress.toFixed(2)),
        deltaPct: null,
        goodDirection: 'down',
        icon: 'shield',
      },
    ],

    stressTrend,

    avgStressScore: Number(averageStress.toFixed(2)),
    avgStressDeltaPct: null,

    riskDistribution,

    totalPersonnelForDonut: personnel.length,

    unitBars,

    recentActivity,

    highRiskPersonnel,

    systemOverview: [
      {
        label: 'Total Users',
        value: users.length,
        deltaPct: null,
      },
      {
        label: 'Total Units',
        value: units.length,
        deltaPct: null,
      },
      {
        label: 'Assessments',
        value: assessments.length,
        deltaPct: null,
      },
      {
        label: 'High Risk Personnel',
        value: highRiskAssessments.length,
        deltaPct: null,
      },
    ],

    monthlyStats,

    systemHealth: [
      {
        name: 'Database',
        status: 'Online',
      },
      {
        name: 'Authentication',
        status: 'Online',
      },
      {
        name: 'ML Prediction Service',
        status: 'Online',
      },
      {
        name: 'API Server',
        status: 'Online',
      },
    ],
  }
})