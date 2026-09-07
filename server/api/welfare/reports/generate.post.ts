import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'

type ReportType =
  | 'Unit Risk Summary'
  | 'High-Risk Case Log'
  | 'Intervention Outcomes'
  | 'Monthly Welfare Report'

const REPORT_TYPES: ReportType[] = [
  'Unit Risk Summary',
  'High-Risk Case Log',
  'Intervention Outcomes',
  'Monthly Welfare Report',
]

function formatDate(value: string | null | undefined): string {
  if (!value) return ''

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event)

  if (user.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
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

  const fromDate = new Date(from)
  const toDate = new Date(to)

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date range',
    })
  }

  if (fromDate.getTime() > toDate.getTime()) {
    throw createError({
      statusCode: 400,
      statusMessage: '"From" date must be before "To" date',
    })
  }

  const fromLabel = formatDate(fromDate.toISOString())
  const toLabel = formatDate(toDate.toISOString())

  const created = await db.orm.public.Report.create({
    commanderId: user.userId,
    name: `${type} (${fromLabel} - ${toLabel})`,
    type,
    fromDate: fromLabel,
    toDate: toLabel,
    // No document-generation pipeline exists yet, so this points at a
    // placeholder endpoint. Wire this up to real report generation
    // once that pipeline exists.
    downloadUrl: '#',
  })

  return {
    id: String(created.id),
    name: created.name,
    type: created.type,
    dateRangeLabel: `${created.fromDate} - ${created.toDate}`,
    generatedBy: user.email,
    generatedOnLabel: created.createdAt,
    downloadUrl: created.downloadUrl,
  }
})