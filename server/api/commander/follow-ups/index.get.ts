import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type FollowUpStatus = 'Upcoming' | 'Overdue' | 'Completed'

function formatDate(value: string | null | undefined): string {
  if (!value) return ''

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
    })
  }

  const commander = await db.orm.public.User.where({
    id: authUser.userId,
  }).first()

  if (!commander) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  const commanderAssignments =
    await db.orm.public.UnitAssignment.where({
      personnelId: commander.id,
    }).all()

  const unitIds = commanderAssignments.map(
    (assignment) => assignment.unitId,
  )

  const personnelAssignments =
    await db.orm.public.UnitAssignment.all()

  const unitPersonnelIds = [
    ...new Set(
      personnelAssignments
        .filter(
          (assignment) =>
            unitIds.includes(assignment.unitId) &&
            assignment.personnelId !== commander.id,
        )
        .map((assignment) => assignment.personnelId),
    ),
  ]

  const users = await db.orm.public.User.all()
  const units = await db.orm.public.Unit.all()
  const followUps = await db.orm.public.FollowUp.all()

  const personnel = users.filter(
    (user) =>
      unitPersonnelIds.includes(user.id) &&
      user.role === 'PERSONNEL',
  )

  const result = followUps
    .filter((followUp) => unitPersonnelIds.includes(followUp.userId))
    .map((followUp) => {
      const person = personnel.find(
        (user) => user.id === followUp.userId,
      )

      const assignment = personnelAssignments.find(
        (item) =>
          item.personnelId === followUp.userId &&
          unitIds.includes(item.unitId),
      )

      const unit = units.find(
        (item) => item.id === assignment?.unitId,
      )

      let status: FollowUpStatus

if (followUp.status?.toUpperCase() === 'COMPLETED') {
  status = 'Completed'
} else if (
  new Date(followUp.scheduledAt).getTime() < Date.now()
) {
  status = 'Overdue'
} else {
  status = 'Upcoming'
}

      return {
        id: String(followUp.id),
        personnelId: String(followUp.userId),
        personnelName: person?.name ?? '',
        subUnit: unit?.name ?? '',
        type: followUp.notes ?? 'Welfare Check-in',
        dueDate: formatDate(followUp.scheduledAt),
        status,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.dueDate).getTime() -
        new Date(a.dueDate).getTime(),
    )

  return {
    commander: {
      name: commander.name ?? '',
      rank: commander.rank ?? '',
      avatarUrl: commander.profilePicture ?? null,
    },
    followUps: result,
  }
})