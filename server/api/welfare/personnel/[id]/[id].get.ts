import { db } from '../../../../../src/prisma/db'
import { requireRole } from '../../../../utils/authorization'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

function getRisk(score: number): RiskLevel {
if (score < 3) return 'Low'
if (score < 5) return 'Moderate'
if (score < 7) return 'Elevated'
return 'High'
}

function formatDate(date: string | Date): string {
return new Date(date).toLocaleDateString('en-IN', {
day: '2-digit',
month: 'short',
year: 'numeric',
})
}

function formatTime(date: string | Date): string {
return new Date(date).toLocaleTimeString('en-IN', {
hour: '2-digit',
minute: '2-digit',
})
}

function formatDateTime(date: string | Date): string {
return new Date(date).toLocaleString('en-IN', {
day: '2-digit',
month: 'short',
year: 'numeric',
hour: '2-digit',
minute: '2-digit',
})
}

function getRiskNote(risk: RiskLevel): string {
switch (risk) {
case 'High':
return 'Immediate welfare attention is recommended.'
case 'Elevated':
return 'Regular monitoring and welfare support are recommended.'
case 'Moderate':
return 'Continue routine monitoring and maintain welfare support.'
default:
return 'Stress level is currently within the low-risk range.'
}
}

export default defineEventHandler(async (event) => {
const authUser = await requireRole(event, ['OFFICER'])

const personnelId = Number(getRouterParam(event, 'id'))

if (!Number.isInteger(personnelId) || personnelId <= 0) {
throw createError({
statusCode: 400,
statusMessage: 'Invalid personnel ID',
})
}

const officerAssignment = await db.orm.public.UnitAssignment
.where({ personnelId: authUser.userId })
.first()

if (!officerAssignment) {
throw createError({
statusCode: 404,
statusMessage: 'No unit assigned to welfare officer',
})
}

const assignment = await db.orm.public.UnitAssignment
.where({
unitId: officerAssignment.unitId,
personnelId,
})
.first()

if (!assignment) {
throw createError({
statusCode: 404,
statusMessage: 'Personnel not found in your assigned unit',
})
}

const personnel = await db.orm.public.User
.where({ id: personnelId })
.first()

if (!personnel) {
throw createError({
statusCode: 404,
statusMessage: 'Personnel not found',
})
}

const unit = await db.orm.public.Unit
.where({ id: officerAssignment.unitId })
.first()

if (!unit) {
throw createError({
statusCode: 404,
statusMessage: 'Assigned unit not found',
})
}

const assessments = await db.orm.public.Assessment
.where({ userId: personnelId })
.orderBy((assessment) => assessment.createdAt.desc())
.all()

const latestAssessment = assessments[0]

const currentStressScore = latestAssessment
? Number(latestAssessment.stressScore.toFixed(2))
: 0

const riskLevel = getRisk(currentStressScore)

const followUps = await db.orm.public.FollowUp
.where({ userId: personnelId })
.orderBy((followUp) => followUp.scheduledAt.asc())
.all()

const now = Date.now()

const upcomingFollowUp = followUps
.filter((followUp) => {
const status = followUp.status.toUpperCase()


  return (
    status === 'SCHEDULED' &&
    new Date(followUp.scheduledAt).getTime() >= now
  )
})
.sort(
  (a, b) =>
    new Date(a.scheduledAt).getTime() -
    new Date(b.scheduledAt).getTime(),
)[0]


const stressTrend = [...assessments]
.reverse()
.map((assessment) => ({
dateLabel: formatDate(assessment.createdAt),
score: Number(assessment.stressScore.toFixed(2)),
}))

const recentAssessments = assessments
.slice(0, 8)
.map((assessment) => ({
dateTime: formatDateTime(assessment.createdAt),
score: Number(assessment.stressScore.toFixed(2)),
riskLevel: getRisk(assessment.stressScore),
notes: '',
}))

return {
id: String(personnel.id),
name: personnel.name ?? personnel.username ?? personnel.email,
rank: personnel.rank ?? 'Personnel',
unit: unit.name,
status:
personnel.personnelStatus === 'ACTIVE'
? 'Active'
: personnel.personnelStatus === 'ON_LEAVE'
? 'On Leave'
: 'Inactive',


joinedDate: formatDate(personnel.createdAt),
avatarUrl: personnel.profilePicture ?? null,

currentStressScore,
maxStressScore: 10,
riskLevel,
riskLevelNote: getRiskNote(riskLevel),

lastAssessmentDate: latestAssessment
  ? formatDate(latestAssessment.createdAt)
  : 'Not assessed',

lastAssessmentTime: latestAssessment
  ? formatTime(latestAssessment.createdAt)
  : '—',

nextFollowUpDate: upcomingFollowUp
  ? formatDate(upcomingFollowUp.scheduledAt)
  : null,

stressTrend,
recentAssessments,



}
})
 