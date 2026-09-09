import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const [
    users,
    units,
    assignments,
    assessments,
    posts,
    notifications,
  ] = await Promise.all([
    db.orm.public.User.all(),
    db.orm.public.Unit.all(),
    db.orm.public.UnitAssignment.all(),
    db.orm.public.Assessment.all(),
    db.orm.public.Post.all(),
    db.orm.public.Notification.all(),
  ])

  const stressScores = assessments
    .map((assessment) => assessment.stressScore)
    .filter((score) => typeof score === 'number')

  const avgStress =
    stressScores.length > 0
      ? stressScores.reduce((sum, score) => sum + score, 0) /
        stressScores.length
      : 0

  const highRisk = assessments.filter((assessment) => {
    const risk = assessment.riskLevel?.trim().toLowerCase()

    return risk === 'high' || risk === 'elevated'
  }).length

  return {
    success: true,

    analytics: {
      users: users.length,
      units: units.length,
      assignments: assignments.length,
      assessments: assessments.length,
      posts: posts.length,
      notifications: notifications.length,
      avgStress,
      highRisk,
    },
  }
})