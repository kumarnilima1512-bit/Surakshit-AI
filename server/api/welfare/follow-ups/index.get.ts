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

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  const officer = await db.orm.public.User.where({
    id: authUser.userId,
  }).first()

  if (!officer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  const officerAssignments = await db.orm.public.UnitAssignment.where({
    personnelId: officer.id,
  }).all()

  const officerUnitIds = officerAssignments.map((assignment) => assignment.unitId)

  const allAssignments = await db.orm.public.UnitAssignment.all()

  const personnelAssignments = allAssignments.filter(
    (assignment) =>
      officerUnitIds.includes(assignment.unitId) &&
      assignment.personnelId !== officer.id,
  )

  const personnelIds = [
    ...new Set(personnelAssignments.map((assignment) => assignment.personnelId)),
  ]

  const units = await db.orm.public.Unit.all()
  const allUsers = await db.orm.public.User.all()

  const personnelById = new Map(
    allUsers
      .filter((user) => personnelIds.includes(user.id))
      .map((user) => [user.id, user]),
  )

  function unitNameFor(personnelId: number): string {
    const assignment = personnelAssignments.find(
      (item) => item.personnelId === personnelId,
    )
    const unit = units.find((item) => item.id === assignment?.unitId)
    return unit?.name ?? ''
  }

  const allFollowUps = await db.orm.public.FollowUp.all()

  const scopedFollowUps = allFollowUps.filter((followUp) =>
    personnelIds.includes(followUp.userId),
  )

  const now = Date.now()

  const followUps = [...scopedFollowUps]
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    )
    .map((followUp) => {
      const person = personnelById.get(followUp.userId)

      let status: FollowUpStatus = 'Upcoming'

      if (followUp.status === 'COMPLETED') {
        status = 'Completed'
      } else if (new Date(followUp.scheduledAt).getTime() < now) {
        status = 'Overdue'
      }

      return {
        id: String(followUp.id),
        personnelId: String(followUp.userId),
        personnelName: person?.name ?? 'Unknown',
        unit: unitNameFor(followUp.userId),
        type: followUp.notes || 'Welfare Check-in',
        dueDate: formatDate(followUp.scheduledAt),
        status,
      }
    })

  return {
    officer: {
      name: officer.name ?? '',
      role: 'Welfare Officer',
      avatarUrl: officer.profilePicture ?? null,
    },
    followUps,
  }
})