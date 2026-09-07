import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

const allowedReportTypes = [
  'Unit Risk Summary',
  'Personnel Readiness Report',
  'Risk Alert Log',
  'Monthly Command Report',
] as const

type ReportType = (typeof allowedReportTypes)[number]

function isReportType(value: unknown): value is ReportType {
  return (
    typeof value === 'string' &&
    allowedReportTypes.includes(value as ReportType)
  )
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !value) {
    return false
  }

  const date = new Date(value)

  return !Number.isNaN(date.getTime())
}

function formatDate(value: string): string {
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

  const body = await readBody<{
    type?: unknown
    from?: unknown
    to?: unknown
  }>(event)

  if (!isReportType(body?.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid report type',
    })
  }

  if (!isValidDate(body?.from) || !isValidDate(body?.to)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid from and to dates are required',
    })
  }

  const fromDate = new Date(body.from)
  const toDate = new Date(body.to)

  if (fromDate.getTime() > toDate.getTime()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'From date cannot be after to date',
    })
  }

  const report = await db.orm.public.Report.create({
    commanderId: commander.id,
    type: body.type,
    name: `${body.type} - ${body.from} to ${body.to}`,
    fromDate: body.from,
    toDate: body.to,
    downloadUrl: '',
  })

  const downloadUrl = `/api/commander/reports/${report.id}/download`

  await db.orm.public.Report
    .where({
      id: report.id,
    })
    .update({
      downloadUrl,
    })

  return {
    id: String(report.id),
    name: report.name,
    type: report.type,
    dateRangeLabel: `${formatDate(body.from)} – ${formatDate(body.to)}`,
    generatedBy: commander.name ?? '',
    generatedOnLabel: formatDate(report.createdAt),
    downloadUrl,
  }
})