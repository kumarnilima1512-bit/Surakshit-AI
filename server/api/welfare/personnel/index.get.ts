import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

function normalizeRiskLevel(
  riskLevel: string | null | undefined,
): RiskLevel | 'Not Assessed' {
  if (!riskLevel) return 'Not Assessed'

  const value = riskLevel.toLowerCase()

  if (value === 'high') return 'High'
  if (value === 'elevated') return 'Elevated'
  if (value === 'moderate') return 'Moderate'

  return 'Low'
}

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  try {
    /*
     * Get all personnel.
     */
    const users = await db.orm.public.User.where({
      role: 'PERSONNEL',
    }).all()

    /*
     * Get all assessments.
     * We use the same Assessment records created when
     * personnel submit their stress assessment.
     */
    const assessments = await db.orm.public.Assessment.all()

    /*
     * Get unit assignments and units.
     */
    const assignments = await db.orm.public.UnitAssignment.all()
    const units = await db.orm.public.Unit.all()

    /*
     * Build personnel list.
     */
    const personnel = users.map((user) => {
      const userAssessments = assessments
        .filter((assessment) => assessment.userId === user.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        )

      const latestAssessment = userAssessments[0]

      const assignment = assignments.find(
        (item) => item.personnelId === user.id,
      )

      const unit = units.find(
        (item) => item.id === assignment?.unitId,
      )

      /*
       * Count assessments that Welfare Officer has not seen.
       */
      const unseenAssessments = userAssessments.filter(
        (assessment) => !assessment.seenByWelfare,
      ).length

      /*
       * Latest assessment's Seen status.
       */
      const latestAssessmentSeen =
        latestAssessment?.seenByWelfare ?? true

      return {
        id: user.id,
        name: user.name ?? '',
        rank: user.rank ?? '',
        unit: unit?.name ?? '',

        risk: normalizeRiskLevel(
          latestAssessment?.riskLevel,
        ),

        score: latestAssessment?.stressScore ?? null,

        lastAssessment:
          latestAssessment?.createdAt ?? null,

        /*
         * Seen information for the Welfare dashboard.
         */
        seen: latestAssessmentSeen,

        seenStatus: latestAssessment
          ? latestAssessmentSeen
            ? 'Seen'
            : 'Not Seen'
          : 'No Assessment',

        unseenAssessments,
      }
    })

    return {
      success: true,

      officer: {
        id: authUser.userId,
        role: authUser.role,
      },

      personnel,
    }
  } catch (error) {
    console.error(
      'Welfare personnel list error:',
      error,
    )

    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to load personnel list',
    })
  }
})

