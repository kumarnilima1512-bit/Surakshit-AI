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

  const body = await readBody(event)
  const config = useRuntimeConfig()

  try {
    const prediction = await $fetch<{
      success: boolean
      stress_score: number
      risk_level: string
    }>(`${config.mlServiceUrl}/predict`, {
      method: 'POST',
      body,
    })

    if (!prediction.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Prediction failed',
      })
    }

    const assessment = await db.orm.public.Assessment.create({
      userId: authUser.userId,
      stressScore: prediction.stress_score,
      riskLevel: prediction.risk_level,
      emotion: body.emotion ?? null,
      emotionConfidence: body.emotionConfidence ?? null,
      seenByWelfare: false,
      seenbyCommander: false,
    })

    return {
      success: true,
      stress_score: prediction.stress_score,
      risk_level: prediction.risk_level,
      assessmentId: assessment.id,
    }
  } catch (error) {
    console.error('Assessment prediction/save error:', error)

    throw createError({
      statusCode: 503,
      statusMessage: 'Unable to process assessment',
    })
  }
})

