import { db } from '../../../../src/prisma/db'
import { requireRole } from '../../../utils/authorization'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'
type FollowUpStatus = 'None' | 'Scheduled' | 'Overdue'

function getRisk(score: number): RiskLevel {
if (score < 3) return 'Low'
if (score < 5) return 'Moderate'
if (score < 7) return 'Elevated'
return 'High'
}

function formatDate(date: string | Date): string {
return new Date(date).toLocaleString('en-IN', {
day: '2-digit',
month: 'short',
year: 'numeric',
hour: '2-digit',
minute: '2-digit',
})
}

function getFollowUpStatus(
followUp: { scheduledAt: string | Date; status: string } | undefined,
): FollowUpStatus {
if (!followUp) return 'None'

const status = followUp.status.toUpperCase()

if (status === 'COMPLETED' || status === 'CANCELLED') {
return 'None'
}

if (
status === 'SCHEDULED' &&
new Date(followUp.scheduledAt).getTime() < Date.now()
) {
return 'Overdue'
}

return 'Scheduled'
}

export default defineEventHandler(async (event) => {
const authUser = await requireRole(event, ['OFFICER'])

const officer = await db.orm.public.User
.where({ id: authUser.userId })
.first()

if (!officer) {
throw createError({
statusCode: 404,
statusMessage: 'Welfare officer not found',
})
}

const assignment = await db.orm.public.UnitAssignment
.where({ personnelId: authUser.userId })
.first()

if (!assignment) {
throw createError({
statusCode: 404,
statusMessage: 'No unit assigned to welfare officer',
})
}

const unit = await db.orm.public.Unit
.where({ id: assignment.unitId })
.first()

if (!unit) {
throw createError({
statusCode: 404,
statusMessage: 'Assigned unit not found',
})
}

const assignments = await db.orm.public.UnitAssignment
.where({ unitId: unit.id })
.include('personnel')
.all()

const personnel = assignments.map((assignment) => assignment.personnel)

const personnelIds = personnel.map((person) => person.id)

const assessments = await db.orm.public.Assessment
.include('user')
.orderBy((assessment) => assessment.createdAt.desc())
.all()

const unitAssessments = assessments.filter((assessment) =>
personnelIds.includes(assessment.userId),
)

const latestAssessment = new Map<
number,
(typeof unitAssessments)[number]

> ()

for (const assessment of unitAssessments) {
if (!latestAssessment.has(assessment.userId)) {
latestAssessment.set(assessment.userId, assessment)
}
}

const followUps = await db.orm.public.FollowUp.all()

const personnelList = personnel.map((person) => {
const personId = Number(person.id)
const assessment = latestAssessment.get(personId)

const personFollowUps = followUps
  .filter((followUp) => followUp.userId === person.id)
  .sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() -
      new Date(a.scheduledAt).getTime(),
  )

const latestFollowUp = personFollowUps[0]

const score = assessment?.stressScore ?? 0

return {
  id: String(person.id),
  name: person.name ?? person.username ?? person.email,
  rank: person.rank ?? 'Personnel',
  unit: unit.name,
  riskLevel: assessment ? getRisk(score) : 'Low',
  score: Number(score.toFixed(2)),
  lastAssessment: assessment
    ? formatDate(assessment.createdAt)
    : 'Not assessed',
  followUpStatus: getFollowUpStatus(latestFollowUp),
}


})

return {
officer: {
name: officer.name ?? officer.username ?? officer.email,
role: officer.rank ?? 'Welfare Officer',
avatarUrl: officer.profilePicture ?? null,
},
personnel: personnelList,
}
})
