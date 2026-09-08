import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type ReportType =
  | 'Unit Risk Summary'
  | 'Personnel Readiness Report'
  | 'Risk Alert Log'
  | 'Monthly Command Report'

const REPORT_TYPES: ReportType[] = [
  'Unit Risk Summary',
  'Personnel Readiness Report',
  'Risk Alert Log',
  'Monthly Command Report',
]

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

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

  const body = await readBody<{
    type?: ReportType
    from?: string
    to?: string
  }>(event)

  const type = body.type
  const from = body.from?.trim()
  const to = body.to?.trim()

  if (!type || !from || !to) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Report type, from date, and to date are required',
    })
  }

  if (!REPORT_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid report type',
    })
  }

  const fromDate = new Date(`${from}T00:00:00`)
  const toDate = new Date(`${to}T23:59:59`)

  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(toDate.getTime())
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date range',
    })
  }

  if (fromDate.getTime() > toDate.getTime()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'From date must be before To date',
    })
  }

  const fromLabel = formatDate(from)
  const toLabel = formatDate(to)

  const created = await db.orm.public.Report.create({
    commanderId: commander.id,
    name: `${type} (${fromLabel} - ${toLabel})`,
    type,
    fromDate: fromLabel,
    toDate: toLabel,
    downloadUrl: '',
  })

  const downloadUrl =
    `/api/commander/reports/${created.id}/download`

  await db.orm.public.Report
    .where({
      id: created.id,
    })
    .update({
      downloadUrl,
    })

  return {
    id: String(created.id),
    name: created.name,
    type: created.type,
    dateRangeLabel: `${created.fromDate} - ${created.toDate}`,
    generatedBy: commander.name ?? commander.email,
    generatedOnLabel: created.createdAt,
    downloadUrl,
  }
})