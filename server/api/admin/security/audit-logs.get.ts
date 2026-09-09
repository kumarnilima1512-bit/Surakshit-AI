import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const [logs, users] = await Promise.all([
    db.orm.public.AuditLog.all(),
    db.orm.public.User.all(),
  ])

  const userMap = new Map(
    users.map((user) => [
      user.id,
      user.name || user.username || user.email,
    ]),
  )

  const sortedLogs = [...logs].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  )

  const formattedLogs = sortedLogs.map((log) => ({
    id: log.id,
    user: userMap.get(log.userId) || 'Unknown User',
    action: log.action,
    resource: log.resource,
    ipAddress: log.ipAddress || 'N/A',
    createdAt: new Date(log.createdAt).toLocaleString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    ),
  }))

  return {
    success: true,
    logs: formattedLogs,
    pagination: {
      page: 1,
      limit: 20,
      total: formattedLogs.length,
      totalPages:
        formattedLogs.length > 0 ? 1 : 0,
    },
  }
})