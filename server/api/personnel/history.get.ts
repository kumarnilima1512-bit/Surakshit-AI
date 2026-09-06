import { getAuthUser } from '../../utils/auth-session'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Personnel access required',
    })
  }

  const assessments = await db.orm.public.Assessment
    .where({
      userId: authUser.userId,
    })
    .orderBy((assessment) => assessment.createdAt.desc())
    .all()

  const formatDate = (value: unknown): string => {
    return new Date(String(value)).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (value: unknown): string => {
    return new Date(String(value)).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return {
    success: true,
    assessments: assessments.map((assessment) => ({
      id: assessment.id,
      date: formatDate(assessment.createdAt),
      time: formatTime(assessment.createdAt),
      dateTime: `${formatDate(assessment.createdAt)} ${formatTime(
        assessment.createdAt
      )}`,
      stressScore: Number(assessment.stressScore),
      riskLevel: assessment.riskLevel,
    })),
  }
})