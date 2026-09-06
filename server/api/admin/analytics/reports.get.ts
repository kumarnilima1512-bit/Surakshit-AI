import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const assessments = await db.orm.public.Assessment.all()

  const total = assessments.length

  const distribution = {
    LOW: 0,
    MODERATE: 0,
    ELEVATED: 0,
    HIGH: 0,
  }

  let totalStress = 0

  for (const assessment of assessments) {
    totalStress += assessment.stressScore

    const risk = assessment.riskLevel.toUpperCase()

    if (risk in distribution) {
      distribution[risk as keyof typeof distribution]++
    }
  }

  return {
    success: true,
    report: {
      totalAssessments: total,
      averageStressScore: total
        ? Number((totalStress / total).toFixed(2))
        : 0,
      riskDistribution: distribution,
    },
  }
})