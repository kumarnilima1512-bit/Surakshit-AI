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

  const reports = await db.orm.public.Report.where({
    commanderId: user.userId,
  }).all()

  const sortedReports = [...reports].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const reportRecords = sortedReports.map((report) => ({
    id: String(report.id),
    name: report.name,
    type: report.type,
    dateRangeLabel: `${report.fromDate} - ${report.toDate}`,
    generatedBy: user.email,
    generatedOnLabel: report.createdAt,
    downloadUrl: report.downloadUrl,
  }))

  return {
    commander: {
      name: user.email,
      rank: 'Commander',
      avatarUrl: null,
    },
    reports: reportRecords,
  }
})