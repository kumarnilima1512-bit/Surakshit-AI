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

const body = await readBody<{
stressScore?: number
riskLevel?: string
}>(event)

if (
typeof body?.stressScore !== 'number' ||
!Number.isFinite(body.stressScore)
) {
throw createError({
statusCode: 400,
statusMessage: 'Valid stress score is required',
})
}

if (!body?.riskLevel) {
throw createError({
statusCode: 400,
statusMessage: 'Risk level is required',
})
}

const stressScore = Math.min(
Math.max(body.stressScore, 1),
10,
)

const assessment =
await db.orm.public.Assessment.create({
userId: authUser.userId,
stressScore,
riskLevel: body.riskLevel,
})

return {
success: true,
assessment: {
id: assessment.id,
stressScore: Number(assessment.stressScore),
riskLevel: assessment.riskLevel,
createdAt: assessment.createdAt,
},
}
})
