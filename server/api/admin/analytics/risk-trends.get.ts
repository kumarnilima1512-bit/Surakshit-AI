import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const assessments = await db.orm.public.Assessment.all()

  const trends = assessments
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    )
    .map((assessment) => ({
      id: assessment.id,
      userId: assessment.userId,
      stressScore: assessment.stressScore,
      riskLevel: assessment.riskLevel,
      createdAt: assessment.createdAt,
    }))

  return {
    success: true,
    trends,
  }
})