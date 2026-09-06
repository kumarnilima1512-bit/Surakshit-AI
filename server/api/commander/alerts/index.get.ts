import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type Severity = 'Critical' | 'Warning' | 'Info'

function getSeverity(type: string | null | undefined): Severity {
  const value = type?.toLowerCase()

  if (value === 'critical' || value === 'high') return 'Critical'
  if (value === 'warning' || value === 'elevated') return 'Warning'

  return 'Info'
}

function formatTime(value: string | null | undefined): string {
  if (!value) return ''

  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

  const assignments = await db.orm.public.UnitAssignment.all()

  const personnelAssignments = assignments.filter(
    (assignment) =>
      unitIds.includes(assignment.unitId) &&
      assignment.personnelId !== commander.id,
  )

  const personnelIds = [
    ...new Set(
      personnelAssignments.map(
        (assignment) => assignment.personnelId,
      ),
    ),
  ]

  const users = await db.orm.public.User.all()

  const personnel = users.filter(
    (user) =>
      personnelIds.includes(user.id) &&
      user.role === 'PERSONNEL',
  )

  const units = await db.orm.public.Unit.all()

  const notifications = await db.orm.public.Notification.all()

  const alerts = notifications
    .filter((notification) => {
      if (!personnelIds.includes(notification.userId)) {
        return false
      }

      const type = notification.type?.toLowerCase()

      return (
        type === 'critical' ||
        type === 'high' ||
        type === 'warning' ||
        type === 'elevated' ||
        type === 'info' ||
        type === 'alert' ||
        type === 'risk'
      )
    })
    .map((notification) => {
      const person = personnel.find(
        (user) => user.id === notification.userId,
      )

      const personAssignment = personnelAssignments.find(
        (assignment) =>
          assignment.personnelId === notification.userId,
      )

      const unit = units.find(
        (item) => item.id === personAssignment?.unitId,
      )

      const severity = getSeverity(notification.type)

      return {
        id: String(notification.id),
        title: notification.title,
        detail: notification.message,
        severity,
        personnelId: person ? String(person.id) : null,
        subUnit: unit?.name ?? '',
        time: formatTime(notification.createdAt),
        acknowledged: notification.isRead,
      }
    })
    .sort(
      (a, b) =>
        new Date(
          notifications.find(
            (notification) => String(notification.id) === a.id,
          )?.createdAt ?? '',
        ).getTime() -
        new Date(
          notifications.find(
            (notification) => String(notification.id) === b.id,
          )?.createdAt ?? '',
        ).getTime(),
    )
    .reverse()

  return {
    commander: {
      name: commander.name ?? '',
      rank: commander.rank ?? '',
      avatarUrl: commander.profilePicture ?? null,
    },
    alerts,
  }
})

