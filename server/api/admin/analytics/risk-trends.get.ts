import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const assessments = await db.orm.public.Assessment.all()

  const riskData = {
    low: 0,
    moderate: 0,
    elevated: 0,
    high: 0,
  }

  for (const assessment of assessments) {
    const risk = assessment.riskLevel
      ?.trim()
      .toLowerCase()

    if (risk === 'low') {
      riskData.low++
    } else if (risk === 'moderate') {
      riskData.moderate++
    } else if (risk === 'elevated') {
      riskData.elevated++
    } else if (risk === 'high') {
      riskData.high++
    }
  }

  const trends = assessments
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    )
    .map((assessment) => ({
      id: assessment.id,
      stressScore: assessment.stressScore,
      riskLevel: assessment.riskLevel,
      createdAt: assessment.createdAt,
    }))

  return {
    success: true,
    riskData,
    trends,
    totalAssessments: assessments.length,
  }
})