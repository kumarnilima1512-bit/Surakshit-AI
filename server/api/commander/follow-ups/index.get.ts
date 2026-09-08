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

  const allFollowUps = await db.orm.public.FollowUp.all()
  const allUsers = await db.orm.public.User.all()
  const allUnits = await db.orm.public.Unit.all()
  const allAssignments = await db.orm.public.UnitAssignment.all()

  const personnel = allUsers.filter(
    (user) => user.role === 'PERSONNEL',
  )

  const now = Date.now()

  const followUps = [...allFollowUps]
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() -
        new Date(b.scheduledAt).getTime(),
    )
    .map((followUp) => {
      const person = personnel.find(
        (user) => user.id === followUp.userId,
      )

      const assignment = allAssignments.find(
        (item) => item.personnelId === followUp.userId,
      )

      const unit = allUnits.find(
        (item) => item.id === assignment?.unitId,
      )

      let status: FollowUpStatus = 'Upcoming'

      if (followUp.status === 'COMPLETED') {
        status = 'Completed'
      } else if (
        new Date(followUp.scheduledAt).getTime() < now
      ) {
        status = 'Overdue'
      }

      return {
        id: String(followUp.id),
        personnelId: String(followUp.userId),
        personnelName: person?.name ?? 'Unknown',
        subUnit: unit?.name ?? '',
        type: followUp.notes || 'Welfare Check-in',
        dueDate: formatDate(followUp.scheduledAt),
        status,
      }
    })

  return {
    commander: {
      name: commander.name ?? '',
      rank: commander.rank ?? 'Commander',
      avatarUrl: commander.profilePicture ?? null,
    },
    followUps,
  }
})