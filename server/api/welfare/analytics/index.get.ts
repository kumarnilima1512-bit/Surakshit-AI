import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

function normalizeRiskLevel(
  riskLevel: string | null | undefined,
): RiskLevel {
  const value = riskLevel?.toLowerCase()

  if (value === 'high') return 'High'
  if (value === 'elevated') return 'Elevated'
  if (value === 'moderate') return 'Moderate'

  return 'Low'
}

function monthKey(value: string | Date): string {
  const date = new Date(value)

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const parts = key.split('-')
  const year = Number(parts[0] ?? 0)
  const month = Number(parts[1] ?? 1)

  return new Date(year, month - 1, 1).toLocaleDateString(
    'en-GB',
    {
      month: 'short',
      year: '2-digit',
    },
  )
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

  /*
   * Welfare analytics covers all personnel.
   * We intentionally do not restrict by the officer's unit
   * because the Welfare Officer dashboard operates on the
   * complete personnel welfare dataset.
   */
  const allUsers = await db.orm.public.User.all()

  const personnel = allUsers.filter(
    (user) => user.role === 'PERSONNEL',
  )

  const personnelIds = personnel.map(
    (person) => person.id,
  )

  const allAssignments =
    await db.orm.public.UnitAssignment.all()

  const units = await db.orm.public.Unit.all()

  function unitNameFor(personnelId: number): string {
    const assignment = allAssignments.find(
      (item) => item.personnelId === personnelId,
    )

    const unit = units.find(
      (item) => item.id === assignment?.unitId,
    )

    return unit?.name ?? 'Unassigned'
  }

  const allAssessments =
    await db.orm.public.Assessment.all()

  const scopedAssessments = allAssessments.filter(
    (assessment) =>
      personnelIds.includes(assessment.userId),
  )

  /* ---------------- Monthly stress trend ---------------- */

  const stressByMonth = new Map<string, number[]>()

  for (const assessment of scopedAssessments) {
    const key = monthKey(assessment.createdAt)

    const scores =
      stressByMonth.get(key) ?? []

    scores.push(assessment.stressScore)

    stressByMonth.set(key, scores)
  }

  const sortedMonthKeys =
    [...stressByMonth.keys()].sort()

  const last6MonthKeys =
    sortedMonthKeys.slice(-6)

  const stressTrendMonthly = {
    labels: last6MonthKeys.map(monthLabel),

    values: last6MonthKeys.map((key) => {
      const scores =
        stressByMonth.get(key) ?? []

      if (!scores.length) return 0

      const average =
        scores.reduce(
          (sum, score) => sum + score,
          0,
        ) / scores.length

      return Math.round(average * 10) / 10
    }),
  }

  /* ---------------- Monthly risk trend ---------------- */

  const riskByMonth =
    new Map<
      string,
      Record<RiskLevel, number>
    >()

  for (const assessment of scopedAssessments) {
    const key = monthKey(assessment.createdAt)

    const bucket =
      riskByMonth.get(key) ?? {
        Low: 0,
        Moderate: 0,
        Elevated: 0,
        High: 0,
      }

    bucket[
      normalizeRiskLevel(
        assessment.riskLevel,
      )
    ] += 1

    riskByMonth.set(key, bucket)
  }

  const riskTrendMonthly = {
    labels: last6MonthKeys.map(monthLabel),

    low: last6MonthKeys.map(
      (key) =>
        riskByMonth.get(key)?.Low ?? 0,
    ),

    moderate: last6MonthKeys.map(
      (key) =>
        riskByMonth.get(key)?.Moderate ?? 0,
    ),

    elevated: last6MonthKeys.map(
      (key) =>
        riskByMonth.get(key)?.Elevated ?? 0,
    ),

    high: last6MonthKeys.map(
      (key) =>
        riskByMonth.get(key)?.High ?? 0,
    ),
  }

  /* ---------------- Average stress by unit ---------------- */

  const scoresByUnit =
    new Map<string, number[]>()

  for (const assessment of scopedAssessments) {
    const unitName =
      unitNameFor(assessment.userId)

    const scores =
      scoresByUnit.get(unitName) ?? []

    scores.push(assessment.stressScore)

    scoresByUnit.set(unitName, scores)
  }

  const unitComparison =
    [...scoresByUnit.entries()].map(
      ([unit, scores]) => {
        const average =
          scores.reduce(
            (sum, score) => sum + score,
            0,
          ) / scores.length

        return {
          unit,
          avgStress:
            Math.round(average * 10) / 10,
        }
      },
    )

  /* ---------------- Intervention outcomes ---------------- */

  const allRecommendations =
    await db.orm.public.Recommendation.all()

  const scopedRecommendations =
    allRecommendations.filter(
      (recommendation) =>
        personnelIds.includes(
          recommendation.userId,
        ),
    )

  const activeCount =
    scopedRecommendations.filter(
      (recommendation) =>
        recommendation.isActive,
    ).length

  const completedCount =
    scopedRecommendations.filter(
      (recommendation) =>
        !recommendation.isActive,
    ).length

  const totalInterventions =
    activeCount + completedCount

  const interventionOutcomes = [
    {
      label: 'Active',
      count: activeCount,
      pct: totalInterventions
        ? Math.round(
            (activeCount /
              totalInterventions) *
              1000,
          ) / 10
        : 0,
      color: '#60a5fa',
    },
    {
      label: 'Completed',
      count: completedCount,
      pct: totalInterventions
        ? Math.round(
            (completedCount /
              totalInterventions) *
              1000,
          ) / 10
        : 0,
      color: '#34d399',
    },
  ]

  return {
    officer: {
      name: officer.name ?? '',
      role: 'Welfare Officer',
      avatarUrl:
        officer.profilePicture ?? null,
    },

    rangeLabel: 'Last 6 Months',

    stressTrendMonthly,

    riskTrendMonthly,

    unitComparison,

    interventionOutcomes,

    totalInterventions,
  }
})