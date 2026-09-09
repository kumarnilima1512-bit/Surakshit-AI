import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const [history, users] = await Promise.all([
    db.orm.public.LoginHistory.all(),
    db.orm.public.User.all(),
  ])

  const userMap = new Map(
    users.map((user) => [
      user.id,
      user.name || user.username || user.email,
    ]),
  )

  const sortedHistory = [...history].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  )

  const formattedHistory = sortedHistory.map((record) => ({
    id: record.id,
    user: record.userId
      ? userMap.get(record.userId) || 'Unknown User'
      : 'Unknown User',
    ipAddress: record.ipAddress || 'N/A',
    device: record.device,
    status:
      record.status === 'SUCCESS'
        ? 'Successful'
        : 'Failed',
    createdAt: new Date(
      record.createdAt,
    ).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))

  return {
    success: true,
    history: formattedHistory,
    pagination: {
      page: 1,
      limit: 20,
      total: formattedHistory.length,
      totalPages:
        formattedHistory.length > 0 ? 1 : 0,
    },
  }
})