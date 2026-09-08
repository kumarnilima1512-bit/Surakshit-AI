import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)

  if (user.role !== 'COMMANDER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Commander access required',
    })
  }

  const commander = await db.orm.public.User.first({
    id: user.userId,
  })

  if (!commander) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  const reports = await db.orm.public.Report.where({
    commanderId: user.userId,
  }).all()

  const sortedReports = [...reports].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  )

  const reportRecords = sortedReports.map((report) => ({
    id: String(report.id),
    name: report.name,
    type: report.type,
    dateRangeLabel: `${report.fromDate} - ${report.toDate}`,
    generatedBy: commander.name ?? commander.email,
    generatedOnLabel: report.createdAt,
    downloadUrl: report.downloadUrl,
  }))

  return {
    commander: {
      name: commander.name ?? commander.email,
      rank: commander.rank ?? 'Commander',
      avatarUrl: commander.profilePicture ?? null,
    },
    reports: reportRecords,
  }
})