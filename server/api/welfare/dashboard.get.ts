import { db } from '../../../src/prisma/db'
import { getAuthUser } from '../../utils/auth-session'

type RiskLevel =
  | 'Low'
  | 'Moderate'
  | 'Elevated'
  | 'High'

function formatDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return ''

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return ''

  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeAgo(
  value: string | Date | null | undefined,
): string {
  if (!value) return ''

  const created = new Date(value).getTime()
  const now = Date.now()

  const diffMs = Math.max(
    0,
    now - created,
  )

  const minutes = Math.floor(
    diffMs / 60000,
  )

  if (minutes < 1) {
    return 'Just now'
  }

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(
    minutes / 60,
  )

  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(
    hours / 24,
  )

  if (days < 7) {
    return `${days}d ago`
  }

  return formatDate(value)
}

function startOfWeek(
  date: Date,
): Date {
  const result = new Date(date)
  const day = result.getDay()

  const diff =
    day === 0
      ? -6
      : 1 - day

  result.setDate(
    result.getDate() + diff,
  )

  result.setHours(
    0,
    0,
    0,
    0,
  )

  return result
}

function getRiskColor(
  risk: RiskLevel,
): string {
  switch (risk) {
    case 'Low':
      return '#34d399'

    case 'Moderate':
      return '#60a5fa'

    case 'Elevated':
      return '#fbbf24'

    case 'High':
      return '#f87171'

    default:
      return '#64748b'
  }
}

function getRecommendationIcon(
  title: string,
  type: string,
): 'sleep' | 'activity' | 'workload' | 'social' {
  const value =
    `${title} ${type}`.toLowerCase()

  if (
    value.includes('sleep') ||
    value.includes('rest')
  ) {
    return 'sleep'
  }

  if (
    value.includes('physical') ||
    value.includes('exercise') ||
    value.includes('activity')
  ) {
    return 'activity'
  }

  if (
    value.includes('social') ||
    value.includes('counselling') ||
    value.includes('counseling')
  ) {
    return 'social'
  }

  return 'workload'
}

function getRecommendationPriority(
  riskLevel: string,
): RiskLevel {
  const normalized =
    riskLevel.toLowerCase()

  if (normalized === 'high') {
    return 'High'
  }

  if (normalized === 'elevated') {
    return 'Elevated'
  }

  if (normalized === 'moderate') {
    return 'Moderate'
  }

  return 'Low'
}

export default defineEventHandler(
  async (event) => {
    const authUser =
      await getAuthUser(event)

    if (
      authUser.role !==
      'OFFICER'
    ) {
      throw createError({
        statusCode: 403,
        statusMessage:
          'Welfare officer access required',
      })
    }

    // =========================================================
    // OFFICER
    // =========================================================

    const officer =
      await db.orm.public.User.first({
        id: authUser.userId,
      })

    if (
      !officer ||
      officer.role !== 'OFFICER'
    ) {
      throw createError({
        statusCode: 404,
        statusMessage:
          'Welfare officer not found',
      })
    }

    // =========================================================
    // UNITS + ASSIGNMENTS
    // =========================================================

    const allUnits =
      await db.orm.public.Unit.all()

    const allAssignments =
      await db.orm.public.UnitAssignment.all()

    const officerAssignments =
      allAssignments.filter(
        (assignment) =>
          assignment.personnelId ===
          officer.id,
      )

    const officerUnitIds =
      officerAssignments.map(
        (assignment) =>
          assignment.unitId,
      )

    const primaryUnit =
      allUnits.find(
        (unit) =>
          unit.id ===
          officerUnitIds[0],
      ) ?? null

    // =========================================================
    // ALL PERSONNEL
    // =========================================================

    const allUsers =
      await db.orm.public.User.all()

    const personnel =
      allUsers.filter(
        (user) =>
          user.role ===
          'PERSONNEL',
      )

    const personnelIds =
      new Set(
        personnel.map(
          (person) =>
            person.id,
        ),
      )

    // =========================================================
    // ALL DATABASE RECORDS
    // =========================================================

    const allAssessments =
      await db.orm.public.Assessment.all()

    const allFollowUps =
      await db.orm.public.FollowUp.all()

    const allRecommendations =
      await db.orm.public.Recommendation.all()

    const allNotifications =
      await db.orm.public.Notification.all()

    // =========================================================
    // PERSONNEL-SCOPED DATA
    // =========================================================

    const assessments =
      allAssessments.filter(
        (assessment) =>
          personnelIds.has(
            assessment.userId,
          ),
      )

    const followUps =
      allFollowUps.filter(
        (followUp) =>
          personnelIds.has(
            followUp.userId,
          ),
      )

    const recommendations =
      allRecommendations.filter(
        (recommendation) =>
          personnelIds.has(
            recommendation.userId,
          ),
      )

    // =========================================================
    // LATEST ASSESSMENT PER PERSONNEL
    // =========================================================

    const latestAssessmentMap =
      new Map<
        number,
        (typeof assessments)[number]
      >()

    for (
      const assessment of assessments
    ) {
      const existing =
        latestAssessmentMap.get(
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
        latestAssessmentMap.set(
          assessment.userId,
          assessment,
        )
      }
    }

    // =========================================================
    // PERSONNEL SUMMARY
    // =========================================================

    const personSummaries =
      personnel.map(
        (person) => {
          const latestAssessment =
            latestAssessmentMap.get(
              person.id,
            )

          const assignment =
            allAssignments.find(
              (item) =>
                item.personnelId ===
                person.id,
            )

          const unit =
            allUnits.find(
              (item) =>
                item.id ===
                assignment?.unitId,
            )

          return {
            id: person.id,

            name:
              person.name ??
              'Unknown',

            rank:
              person.rank ??
              'Personnel',

            unit:
              unit?.name ??
              'Unassigned',

            avatarUrl:
              person.profilePicture ??
              null,

            stressScore:
              latestAssessment
                ?.stressScore ??
              null,

            emotion:
              latestAssessment
                ?.emotion ??
              null,

            emotionConfidence:
              latestAssessment
                ?.emotionConfidence ??
              null,

            riskLevel:
              (latestAssessment
                ?.riskLevel ??
                'Low') as RiskLevel,

            lastAssessment:
              latestAssessment
                ?.createdAt ??
              null,
          }
        },
      )

    // =========================================================
    // STATISTICS
    // =========================================================

    const totalPersonnel =
      personnel.length

    const highRiskCases =
      personSummaries.filter(
        (person) =>
          person.riskLevel ===
          'High',
      ).length

    const activeInterventions =
      recommendations.filter(
        (recommendation) =>
          recommendation.isActive ===
          true,
      ).length

    const completedInterventions =
      recommendations.filter(
        (recommendation) =>
          recommendation.isActive ===
          false,
      ).length

    const totalInterventions =
      activeInterventions +
      completedInterventions

    const now =
      new Date()

    const pendingFollowUps =
      followUps.filter(
        (followUp) =>
          followUp.status ===
          'SCHEDULED',
      ).length

    const overdueFollowUps =
      followUps.filter(
        (followUp) =>
          followUp.status ===
            'SCHEDULED' &&
          new Date(
            followUp.scheduledAt,
          ).getTime() <
            now.getTime(),
      ).length

    const weekStart =
      startOfWeek(now)

    const assessmentsThisWeek =
      assessments.filter(
        (assessment) =>
          new Date(
            assessment.createdAt,
          ).getTime() >=
          weekStart.getTime(),
      ).length

    // =========================================================
    // STAT CARDS
    //
    // IMPORTANT:
    // These icon values MUST match dashboard.vue exactly.
    // =========================================================

    const statCards = [
      {
        label:
          'Total Personnel',
        value:
          totalPersonnel,
        icon:
          'users' as const,
        footerValue:
          `+${assessmentsThisWeek}`,
        footerText:
          'assessments this week',
        footerTone:
          'positive' as const,
      },

      {
        label:
          'High Risk Cases',
        value:
          highRiskCases,
        icon:
          'alertTriangle' as const,
        footerValue:
          `${highRiskCases}`,
        footerText:
          'currently high risk',
        footerTone:
          highRiskCases > 0
            ? ('negative' as const)
            : ('neutral' as const),
        urgentText:
          overdueFollowUps > 0
            ? `${overdueFollowUps} urgent`
            : undefined,
      },

      {
        label:
          'Active Interventions',
        value:
          activeInterventions,
        icon:
          'shield' as const,
        footerValue:
          `${completedInterventions}`,
        footerText:
          'completed',
        footerTone:
          'positive' as const,
      },

      {
        label:
          'Pending Follow-ups',
        value:
          pendingFollowUps,
        icon:
          'alertCircle' as const,
        footerValue:
          `${overdueFollowUps}`,
        footerText:
          'overdue',
        footerTone:
          overdueFollowUps > 0
            ? ('negative' as const)
            : ('neutral' as const),
        urgentText:
          overdueFollowUps > 0
            ? `${overdueFollowUps} urgent`
            : undefined,
      },

      {
        label:
          'Assessments This Week',
        value:
          assessmentsThisWeek,
        icon:
          'user' as const,
        footerValue:
          `${assessments.length}`,
        footerText:
          'total assessments',
        footerTone:
          'neutral' as const,
      },
    ]

    // =========================================================
    // RISK DISTRIBUTION
    // =========================================================

    const riskCounts: Record<
      RiskLevel,
      number
    > = {
      Low: 0,
      Moderate: 0,
      Elevated: 0,
      High: 0,
    }

    for (
      const person of personSummaries
    ) {
      riskCounts[
        person.riskLevel
      ]++
    }

    const riskDistribution =
      (
        Object.keys(
          riskCounts,
        ) as RiskLevel[]
      ).map(
        (risk) => {
          const count =
            riskCounts[risk]

          const pct =
            totalPersonnel > 0
              ? Number(
                  (
                    (count /
                      totalPersonnel) *
                    100
                  ).toFixed(1),
                )
              : 0

          return {
            label: risk,
            pct,
            count,
            color:
              getRiskColor(risk),
          }
        },
      )

    // =========================================================
    // STRESS TREND - LAST 7 DAYS
    // =========================================================

    const trendLabels: string[] = []
    const trendValues: number[] = []

    const trendStart =
      new Date(now)

    trendStart.setDate(
      trendStart.getDate() -
        6,
    )

    trendStart.setHours(
      0,
      0,
      0,
      0,
    )

    for (
      let i = 0;
      i < 7;
      i++
    ) {
      const date =
        new Date(
          trendStart,
        )

      date.setDate(
        trendStart.getDate() +
          i,
      )

      const nextDate =
        new Date(date)

      nextDate.setDate(
        date.getDate() +
          1,
      )

      const dayAssessments =
        assessments.filter(
          (assessment) => {
            const created =
              new Date(
                assessment.createdAt,
              ).getTime()

            return (
              created >=
                date.getTime() &&
              created <
                nextDate.getTime()
            )
          },
        )

      const average =
        dayAssessments.length > 0
          ? dayAssessments.reduce(
              (
                sum,
                assessment,
              ) =>
                sum +
                assessment.stressScore,
              0,
            ) /
            dayAssessments.length
          : 0

      trendLabels.push(
        date.toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'short',
          },
        ),
      )

      trendValues.push(
        Number(
          average.toFixed(2),
        ),
      )
    }

    const stressTrend = {
      labels:
        trendLabels,
      values:
        trendValues,
    }

    // =========================================================
    // HIGH-RISK PERSONNEL
    // =========================================================

    const highRiskPersonnel =
      personSummaries
        .filter(
          (person) =>
            person.riskLevel ===
              'High' ||
            person.riskLevel ===
              'Elevated',
        )
        .sort(
          (a, b) =>
            (b.stressScore ?? 0) -
            (a.stressScore ?? 0),
        )
        .slice(0, 10)
        .map(
          (person) => ({
            id:
              String(
                person.id,
              ),
            name:
              person.name,
            unit:
              person.unit,
            score:
              Number(
                (
                  person.stressScore ??
                  0
                ).toFixed(2),
              ),
            riskLevel:
              person.riskLevel,
            lastAssessment:
              person.lastAssessment
                ? formatDate(
                    person.lastAssessment,
                  )
                : 'No assessment',
          }),
        )

    // =========================================================
    // INTERVENTION STATUS
    // =========================================================

    const interventionCounts = {
      Active:
        activeInterventions,
      Completed:
        completedInterventions,
    }

    const interventionStatus =
      (
        Object.keys(
          interventionCounts,
        ) as Array<
          'Active' | 'Completed'
        >
      ).map(
        (status) => {
          const count =
            interventionCounts[
              status
            ]

          const pct =
            totalInterventions >
            0
              ? Number(
                  (
                    (count /
                      totalInterventions) *
                    100
                  ).toFixed(1),
                )
              : 0

          return {
            label:
              status,
            pct,
            count,
            color:
              status ===
              'Active'
                ? '#34d399'
                : '#64748b',
          }
        },
      )

    // =========================================================
    // RECENT ASSESSMENTS
    // =========================================================

    const recentAssessments =
      [...assessments]
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        )
        .slice(0, 10)
        .map(
          (assessment) => ({
            dateTime:
              formatDateTime(
                assessment.createdAt,
              ),

            personnelId:
              String(
                assessment.userId,
              ),

            score:
              Number(
                assessment.stressScore.toFixed(
                  2,
                ),
              ),

            riskLevel:
              assessment.riskLevel as RiskLevel,
          }),
        )

    // =========================================================
    // WELFARE RECOMMENDATIONS
    // =========================================================

    const welfareRecommendations =
      [...recommendations]
        .filter(
          (recommendation) =>
            recommendation.isActive ===
            true,
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        )
        .slice(0, 5)
        .map(
          (
            recommendation,
          ) => {
            const person =
              personSummaries.find(
                (item) =>
                  item.id ===
                  recommendation.userId,
              )

            const priority =
              getRecommendationPriority(
                person?.riskLevel ??
                  'Low',
              )

            return {
              title:
                recommendation.title,

              description:
                recommendation.description,

              priority,

              icon:
                getRecommendationIcon(
                  recommendation.title,
                  recommendation.type,
                ),
            }
          },
        )

    // =========================================================
    // RECENT ALERTS
    // =========================================================

    const recentAlerts: Array<{
      title: string
      detail: string
      time: string
      tone:
        | 'red'
        | 'amber'
        | 'violet'
        | 'blue'
    }> = []

    // High-risk alerts
    for (
      const person of highRiskPersonnel.slice(
        0,
        5,
      )
    ) {
      recentAlerts.push({
        title:
          'High-Risk Personnel',

        detail:
          `${person.name} has a ${person.riskLevel.toLowerCase()} stress risk.`,

        time:
          person.lastAssessment,

        tone:
          person.riskLevel ===
          'High'
            ? 'red'
            : 'amber',
      })
    }

    // Overdue follow-up alerts
    const overdueFollowUpsList =
      followUps
        .filter(
          (followUp) =>
            followUp.status ===
              'SCHEDULED' &&
            new Date(
              followUp.scheduledAt,
            ).getTime() <
              now.getTime(),
        )
        .sort(
          (a, b) =>
            new Date(
              b.scheduledAt,
            ).getTime() -
            new Date(
              a.scheduledAt,
            ).getTime(),
        )
        .slice(0, 5)

    for (
      const followUp of overdueFollowUpsList
    ) {
      const person =
        personnel.find(
          (user) =>
            user.id ===
            followUp.userId,
        )

      recentAlerts.push({
        title:
          'Overdue Follow-up',

        detail:
          `${person?.name ?? 'Personnel'} has an overdue welfare follow-up.`,

        time:
          formatDate(
            followUp.scheduledAt,
          ),

        tone:
          'amber',
      })
    }

    // New assessments / general blue alerts
    const recentHighAssessment =
      [...assessments]
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        )
        .find(
          (assessment) =>
            assessment.riskLevel ===
              'Elevated' ||
            assessment.riskLevel ===
              'High',
        )

    if (
      recentHighAssessment
    ) {
      const person =
        personnel.find(
          (user) =>
            user.id ===
            recentHighAssessment.userId,
        )

      recentAlerts.push({
        title:
          'Recent Risk Assessment',

        detail:
          `${person?.name ?? 'Personnel'} received a ${recentHighAssessment.riskLevel.toLowerCase()} risk assessment.`,

        time:
          formatTimeAgo(
            recentHighAssessment.createdAt,
          ),

        tone:
          recentHighAssessment.riskLevel ===
          'High'
            ? 'red'
            : 'violet',
      })
    }

    // Most recent first
    recentAlerts.sort(
      (a, b) =>
        a.time.localeCompare(
          b.time,
        ),
    )

    // =========================================================
    // OFFICER NOTIFICATIONS
    // =========================================================

    const notifications =
      allNotifications
        .filter(
          (notification) =>
            notification.userId ===
            officer.id,
        )
        .sort(
          (a, b) =>
            new Date(
              b.createdAt,
            ).getTime() -
            new Date(
              a.createdAt,
            ).getTime(),
        )
        .slice(0, 10)
        .map(
          (notification) => ({
            id:
              String(
                notification.id,
              ),

            title:
              notification.title,

            timeLabel:
              formatTimeAgo(
                notification.createdAt,
              ),

            read:
              notification.isRead,
          }),
        )

    // =========================================================
    // FINAL RESPONSE
    // =========================================================

    return {
      officer: {
        name:
          officer.name ??
          'Welfare Officer',

        role:
          'Welfare Officer',

        unitName:
          primaryUnit?.name ??
          'All Units',

        unitCode:
          primaryUnit?.code ??
          'N/A',

        lastLoginLabel:
          officer.updatedAt
            ? formatTimeAgo(
                officer.updatedAt,
              )
            : 'N/A',

        avatarUrl:
          officer.profilePicture ??
          null,
      },

      statCards,

      riskDistribution,

      totalPersonnelForDonut:
        totalPersonnel,

      riskDistributionScopeLabel:
        'Current',

      stressTrend,

      trendRangeLabel:
        'Last 7 Days',

      highRiskPersonnel,

      interventionStatus,

      totalInterventions,

      recentAssessments,

      welfareRecommendations,

      recentAlerts:
        recentAlerts.slice(
          0,
          10,
        ),

      notifications,
    }
  },
)