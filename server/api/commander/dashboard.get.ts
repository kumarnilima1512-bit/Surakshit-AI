import { db } from '../../../src/prisma/db'
import { getAuthUser } from '../../utils/auth-session'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#34d399',
  Moderate: '#fbbf24',
  Elevated: '#fb923c',
  High: '#f87171',
}

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
  value: string | null | undefined,
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

function dayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10)
}

function monthKey(value: string): string {
  const date = new Date(value)

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`
}

function pctChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null

  return Math.round(
    ((current - previous) / previous) * 1000,
  ) / 10
}

function timeAgo(value: string): string {
  const diffMs =
    Date.now() - new Date(value).getTime()

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

  const commander =
    await db.orm.public.User.where({
      id: authUser.userId,
    }).first()

  if (!commander) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  /*
   * --------------------------------------------------
   * Load common data
   * --------------------------------------------------
   */

  const [
    allUsers,
    allAssessments,
    allFollowUps,
    allNotes,
    allRecommendations,
    commanderNotifications,
  ] = await Promise.all([
    db.orm.public.User.all(),
    db.orm.public.Assessment.all(),
    db.orm.public.FollowUp.all(),
    db.orm.public.WelfareNote.all(),
    db.orm.public.Recommendation.all(),
    db.orm.public.Notification.where({
      userId: commander.id,
    }).all(),
  ])

  /*
   * --------------------------------------------------
   * Personnel
   *
   * Same source as Commander Personnel page.
   * No UnitAssignment dependency.
   * --------------------------------------------------
   */

  const personnel = allUsers.filter(
    (user) =>
      user.role === 'PERSONNEL' &&
      user.id !== commander.id,
  )

  /*
   * Latest assessment for every personnel
   */

  const personSummaries = personnel.map((person) => {
    const personAssessments = allAssessments
      .filter(
        (assessment) =>
          assessment.userId === person.id,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )

    const latestAssessment =
      personAssessments[0]

    return {
      person,
      latestAssessment,
      riskLevel: normalizeRiskLevel(
        latestAssessment?.riskLevel,
      ),
    }
  })

  const now = Date.now()

  /*
   * --------------------------------------------------
   * Month calculations
   * --------------------------------------------------
   */

  const currentDate = new Date()

  const thisMonthKey =
    monthKey(currentDate.toISOString())

  const lastMonthDate = new Date(currentDate)

  lastMonthDate.setMonth(
    lastMonthDate.getMonth() - 1,
  )

  const lastMonthKey =
    monthKey(lastMonthDate.toISOString())

  /*
   * --------------------------------------------------
   * Stat cards
   * --------------------------------------------------
   */

  const highRiskThisMonth =
    allAssessments.filter(
      (assessment) =>
        normalizeRiskLevel(
          assessment.riskLevel,
        ) === 'High' &&
        monthKey(assessment.createdAt) ===
          thisMonthKey,
    ).length

  const highRiskLastMonth =
    allAssessments.filter(
      (assessment) =>
        normalizeRiskLevel(
          assessment.riskLevel,
        ) === 'High' &&
        monthKey(assessment.createdAt) ===
          lastMonthKey,
    ).length

  const pendingFollowUps =
    allFollowUps.filter(
      (followUp) =>
        followUp.status !== 'COMPLETED' &&
        personnel.some(
          (person) =>
            person.id === followUp.userId,
        ),
    )

  const pendingThisMonth =
    pendingFollowUps.filter(
      (followUp) =>
        monthKey(followUp.scheduledAt) ===
        thisMonthKey,
    ).length

  const pendingLastMonth =
    pendingFollowUps.filter(
      (followUp) =>
        monthKey(followUp.scheduledAt) ===
        lastMonthKey,
    ).length

  const assessmentsThisMonth =
    allAssessments.filter(
      (assessment) =>
        personnel.some(
          (person) =>
            person.id === assessment.userId,
        ) &&
        monthKey(assessment.createdAt) ===
          thisMonthKey,
    ).length

  const assessmentsLastMonth =
    allAssessments.filter(
      (assessment) =>
        personnel.some(
          (person) =>
            person.id === assessment.userId,
        ) &&
        monthKey(assessment.createdAt) ===
          lastMonthKey,
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
      value: personSummaries.filter(
        (summary) =>
          summary.riskLevel === 'High',
      ).length,
      deltaPct: pctChange(
        highRiskThisMonth,
        highRiskLastMonth,
      ),
      goodDirection: 'down' as const,
      icon: 'alert' as const,
    },
    {
      label: 'Pending Follow-ups',
      value: pendingFollowUps.length,
      deltaPct: pctChange(
        pendingThisMonth,
        pendingLastMonth,
      ),
      goodDirection: 'down' as const,
      icon: 'clock' as const,
    },
    {
      label: 'Assessments This Month',
      value: assessmentsThisMonth,
      deltaPct: pctChange(
        assessmentsThisMonth,
        assessmentsLastMonth,
      ),
      goodDirection: 'up' as const,
      icon: 'check' as const,
    },
  ]

  /*
   * --------------------------------------------------
   * Stress trend
   *
   * Uses latest assessment of each personnel.
   * Groups those latest assessments by date.
   * --------------------------------------------------
   */

  const latestAssessments =
    personSummaries
      .map(
        (summary) =>
          summary.latestAssessment,
      )
      .filter(
        (
          assessment,
        ): assessment is NonNullable<
          typeof assessment
        > => Boolean(assessment),
      )

  const scoresByDay =
    new Map<string, number[]>()

  for (const assessment of latestAssessments) {
    const key = dayKey(
      assessment.createdAt,
    )

    const scores =
      scoresByDay.get(key) ?? []

    scores.push(assessment.stressScore)

    scoresByDay.set(key, scores)
  }

  const sortedDayKeys =
    [...scoresByDay.keys()].sort()

  const last14DayKeys =
    sortedDayKeys.slice(-14)

  const stressTrend =
    last14DayKeys.map((key) => {
      const scores =
        scoresByDay.get(key) ?? []

      const average =
        scores.reduce(
          (sum, score) => sum + score,
          0,
        ) / scores.length

      return {
        label: formatDate(key),
        value:
          Math.round(average * 10) / 10,
      }
    })

  /*
   * --------------------------------------------------
   * Average current stress
   * --------------------------------------------------
   */

  const currentScores =
    latestAssessments.map(
      (assessment) =>
        assessment.stressScore,
    )

  const avgStressScore =
    currentScores.length
      ? Math.round(
          (currentScores.reduce(
            (sum, score) =>
              sum + score,
            0,
          ) /
            currentScores.length) *
            10,
        ) / 10
      : 0

  const thisMonthScores =
    allAssessments
      .filter(
        (assessment) =>
          personnel.some(
            (person) =>
              person.id ===
              assessment.userId,
          ) &&
          monthKey(
            assessment.createdAt,
          ) === thisMonthKey,
      )
      .map(
        (assessment) =>
          assessment.stressScore,
      )

  const lastMonthScores =
    allAssessments
      .filter(
        (assessment) =>
          personnel.some(
            (person) =>
              person.id ===
              assessment.userId,
          ) &&
          monthKey(
            assessment.createdAt,
          ) === lastMonthKey,
      )
      .map(
        (assessment) =>
          assessment.stressScore,
      )

  const avgThisMonth =
    thisMonthScores.length
      ? thisMonthScores.reduce(
          (sum, score) =>
            sum + score,
          0,
        ) / thisMonthScores.length
      : 0

  const avgLastMonth =
    lastMonthScores.length
      ? lastMonthScores.reduce(
          (sum, score) =>
            sum + score,
          0,
        ) / lastMonthScores.length
      : 0

  const avgStressDeltaPct =
    pctChange(
      avgThisMonth,
      avgLastMonth,
    )

  /*
   * --------------------------------------------------
   * Risk distribution
   * --------------------------------------------------
   */

  const riskLevels: RiskLevel[] = [
    'Low',
    'Moderate',
    'Elevated',
    'High',
  ]

  const totalPersonnelForDonut =
    personnel.length

  const riskDistribution =
    riskLevels.map((level) => {
      const count =
        personSummaries.filter(
          (summary) =>
            summary.riskLevel === level,
        ).length

      return {
        label: level,
        count,
        pct:
          totalPersonnelForDonut
            ? Math.round(
                (count /
                  totalPersonnelForDonut) *
                  1000,
              ) / 10
            : 0,
        color: RISK_COLORS[level],
      }
    })

  /*
   * --------------------------------------------------
   * Sub-unit
   *
   * UnitAssignment is currently not populated,
   * so personnel are shown under Unassigned.
   * --------------------------------------------------
   */

  const subUnitBars = [
    {
      name: 'Unassigned',
      low: personSummaries.filter(
        (summary) =>
          summary.riskLevel === 'Low',
      ).length,
      moderate: personSummaries.filter(
        (summary) =>
          summary.riskLevel === 'Moderate',
      ).length,
      elevated: personSummaries.filter(
        (summary) =>
          summary.riskLevel === 'Elevated',
      ).length,
      high: personSummaries.filter(
        (summary) =>
          summary.riskLevel === 'High',
      ).length,
    },
  ]

  /*
   * --------------------------------------------------
   * Personnel table
   * --------------------------------------------------
   */

  const personnelRows =
    [...personSummaries]
      .sort(
        (a, b) =>
          (b.latestAssessment
            ?.stressScore ?? 0) -
          (a.latestAssessment
            ?.stressScore ?? 0),
      )
      .map((summary) => ({
        id: String(
          summary.person.id,
        ),
        name:
          summary.person.name ?? '',
        subUnit: 'Unassigned',
        level:
          summary.riskLevel,
        score:
          summary.latestAssessment
            ?.stressScore ?? 0,
        lastAssessment:
          formatDate(
            summary.latestAssessment
              ?.createdAt,
          ),
      }))

  /*
   * --------------------------------------------------
   * Follow-ups
   * --------------------------------------------------
   */

  const followUps =
    [...pendingFollowUps]
      .sort(
        (a, b) =>
          new Date(
            a.scheduledAt,
          ).getTime() -
          new Date(
            b.scheduledAt,
          ).getTime(),
      )
      .slice(0, 8)
      .map((followUp) => {
        const owner =
          personSummaries.find(
            (summary) =>
              summary.person.id ===
              followUp.userId,
          )

        const isOverdue =
          new Date(
            followUp.scheduledAt,
          ).getTime() < now

        return {
          personnelName:
            owner?.person.name ??
            'Unknown',
          personnelId: owner
            ? String(
                owner.person.id,
              )
            : String(
                followUp.userId,
              ),
          dueDate:
            formatDate(
              followUp.scheduledAt,
            ),
          reason:
            followUp.notes ||
            'Welfare Check-in',
          status: isOverdue
            ? ('Overdue' as const)
            : ('Scheduled' as const),
        }
      })

  /*
   * --------------------------------------------------
   * Recent activity
   * --------------------------------------------------
   */

  const noteEvents =
    allNotes
      .filter((note) =>
        personnel.some(
          (person) =>
            person.id ===
            note.personnelId,
        ),
      )
      .map((note) => {
        const author =
          allUsers.find(
            (user) =>
              user.id ===
              note.authorId,
          )

        const person =
          allUsers.find(
            (user) =>
              user.id ===
              note.personnelId,
          )

        return {
          text: `Welfare note added for ${
            person?.name ?? 'personnel'
          }`,
          by:
            author?.name ??
            'Welfare Officer',
          time: note.createdAt,
        }
      })

  const recommendationEvents =
    allRecommendations
      .filter((recommendation) =>
        personnel.some(
          (person) =>
            person.id ===
            recommendation.userId,
        ),
      )
      .map((recommendation) => {
        const person =
          allUsers.find(
            (user) =>
              user.id ===
              recommendation.userId,
          )

        return {
          text: `${
            recommendation.title
          } recommended for ${
            person?.name ??
            'personnel'
          }`,
          by: 'Welfare Officer',
          time:
            recommendation.createdAt,
        }
      })

  const followUpEvents =
    allFollowUps
      .filter((followUp) =>
        personnel.some(
          (person) =>
            person.id ===
            followUp.userId,
        ),
      )
      .map((followUp) => {
        const person =
          allUsers.find(
            (user) =>
              user.id ===
              followUp.userId,
          )

        return {
          text: `Follow-up scheduled for ${
            person?.name ??
            'personnel'
          }`,
          by: 'Welfare Officer',
          time: followUp.createdAt,
        }
      })

  const recentActivity =
    [
      ...noteEvents,
      ...recommendationEvents,
      ...followUpEvents,
    ]
      .sort(
        (a, b) =>
          new Date(b.time).getTime() -
          new Date(a.time).getTime(),
      )
      .slice(0, 8)
      .map((activity) => ({
        text: activity.text,
        by: activity.by,
        time: timeAgo(
          activity.time,
        ),
      }))

  /*
   * --------------------------------------------------
   * Notifications
   * --------------------------------------------------
   */

  const notifications =
    [...commanderNotifications]
      .sort(
        (a, b) =>
          new Date(
            b.createdAt,
          ).getTime() -
          new Date(
            a.createdAt,
          ).getTime(),
      )
      .slice(0, 8)
      .map((notification) => ({
        id: String(
          notification.id,
        ),
        title:
          notification.title,
        timeLabel:
          formatDate(
            notification.createdAt,
          ),
        read:
          notification.isRead,
      }))

  /*
   * --------------------------------------------------
   * Response
   * --------------------------------------------------
   */

  return {
    commander: {
  serviceId: String(commander.id),
  name: `Commander ${commander.name ?? ''}`.trim(),
  rank: commander.rank ?? '',
  unit: 'All Personnel',
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

