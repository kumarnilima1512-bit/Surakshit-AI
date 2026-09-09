import { requireRole } from '../../../utils/authorization'
import { getAuthUser } from '../../../utils/auth-session'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const authUser = await getAuthUser(event)

  const reports = await db.orm.public.Report.all()

  const sortedReports = [...reports].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  )

  const reportRecords = sortedReports.map((report) => ({
    id: report.id,
    name: report.name,
    type: report.type,
    createdAt: report.createdAt,
    fromDate: report.fromDate,
    toDate: report.toDate,

    // Admin can download ANY report through the Admin endpoint.
    downloadUrl:
      `/api/admin/analytics/reports/${report.id}/download`,
  }))

  return {
    success: true,
    generatedBy: authUser.email,
    reports: reportRecords,
  }
})