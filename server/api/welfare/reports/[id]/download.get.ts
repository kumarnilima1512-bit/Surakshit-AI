import { db } from '../../../../../src/prisma/db'
import { getAuthUser } from '../../../../utils/auth-session'
import PDFDocument from 'pdfkit'

function formatDate(value: string | null | undefined): string {
  if (!value) return ''

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return ''

  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizeRisk(value: string): string {
  const risk = value.toLowerCase()

  if (risk === 'high') return 'High'
  if (risk === 'elevated') return 'Elevated'
  if (risk === 'moderate') return 'Moderate'
  if (risk === 'low') return 'Low'

  return value
}

interface PersonnelRow {
  name: string
  unit: string
  score: number
  riskLevel: string
  assessmentDate: string
}

function createTableHeader(
  doc: PDFKit.PDFDocument,
  columns: string[],
  widths: number[],
) {
  let x = 40
  const y = doc.y

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#111827')

  columns.forEach((column, index) => {
    const width = widths[index] ?? 0

    doc.text(column, x, y, {
      width,
      continued: false,
    })

    x += width
  })

  doc
    .moveTo(40, y + 14)
    .lineTo(555, y + 14)
    .strokeColor('#d1d5db')
    .stroke()

  doc.y = y + 20
}

function createPersonnelTable(
  doc: PDFKit.PDFDocument,
  rows: PersonnelRow[],
) {
  const columns = [
    'Personnel',
    'Unit',
    'Score',
    'Risk Level',
    'Assessment Date',
  ]

  const widths = [150, 115, 55, 85, 150]

  createTableHeader(doc, columns, widths)

  if (!rows.length) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6b7280')
      .text('No personnel assessments found for the selected period.')

    return
  }

  rows.forEach((row) => {
    if (doc.y > 710) {
      doc.addPage()
      doc.y = 40

      createTableHeader(doc, columns, widths)
    }

    const y = doc.y
    let x = 40

    const values = [
      row.name || 'Unknown',
      row.unit || 'Unassigned',
      row.score.toFixed(2),
      normalizeRisk(row.riskLevel),
      formatDateTime(row.assessmentDate),
    ]

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#374151')

    values.forEach((value, index) => {
      const width = widths[index] ?? 0

      doc.text(value, x, y, {
        width: width - 5,
        height: 28,
      })

      x += width
    })

    doc
      .moveTo(40, y + 25)
      .lineTo(555, y + 25)
      .strokeColor('#eeeeee')
      .stroke()

    doc.y = y + 32
  })
}

function createUnitRiskSummary(
  doc: PDFKit.PDFDocument,
  rows: PersonnelRow[],
) {
  doc
    .moveDown(0.8)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111827')
    .text('Personnel Risk Assessment')

  doc.moveDown(0.6)

  createPersonnelTable(doc, rows)
}

function createHighRiskReport(
  doc: PDFKit.PDFDocument,
  rows: PersonnelRow[],
) {
  const highRiskRows = rows.filter((row) => {
    const risk = normalizeRisk(row.riskLevel)

    return risk === 'High' || risk === 'Elevated'
  })

  doc
    .moveDown(0.8)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111827')
    .text('High-Risk Personnel')

  doc
    .moveDown(0.3)
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#6b7280')
    .text(`Total high-risk cases: ${highRiskRows.length}`)

  doc.moveDown(0.6)

  createPersonnelTable(doc, highRiskRows)
}

function createGeneralReport(
  doc: PDFKit.PDFDocument,
  reportType: string,
  rows: PersonnelRow[],
) {
  const total = rows.length

  const high = rows.filter(
    (row) => normalizeRisk(row.riskLevel) === 'High',
  ).length

  const elevated = rows.filter(
    (row) => normalizeRisk(row.riskLevel) === 'Elevated',
  ).length

  const moderate = rows.filter(
    (row) => normalizeRisk(row.riskLevel) === 'Moderate',
  ).length

  const low = rows.filter(
    (row) => normalizeRisk(row.riskLevel) === 'Low',
  ).length

  const average =
    total > 0
      ? rows.reduce((sum, row) => sum + row.score, 0) / total
      : 0

  doc
    .moveDown(0.8)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111827')
    .text(`${reportType} Summary`)

  doc
    .moveDown(0.6)
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#374151')

  doc.text(`Personnel assessments: ${total}`)
  doc.text(`Average stress score: ${average.toFixed(2)}`)
  doc.text(`High risk: ${high}`)
  doc.text(`Elevated risk: ${elevated}`)
  doc.text(`Moderate risk: ${moderate}`)
  doc.text(`Low risk: ${low}`)

  doc
    .moveDown(1)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111827')
    .text('Personnel Assessment Details')

  doc.moveDown(0.6)

  createPersonnelTable(doc, rows)
}

function createPdf(
  report: {
    name: string
    type: string
    fromDate: string
    toDate: string
  },
  officerName: string,
  rows: PersonnelRow[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    })

    const chunks: Buffer[] = []

    doc.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk))
    })

    doc.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    doc.on('error', reject)

    // Header
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#111827')
      .text('Surakshit AI')

    doc
      .moveDown(0.25)
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#6b7280')
      .text('Personnel Stress & Welfare Monitoring System')

    // Report title
    doc
      .moveDown(1)
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#111827')
      .text(report.type)

    // Divider
    doc
      .moveDown(0.5)
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .strokeColor('#d1d5db')
      .stroke()

    // Metadata
    doc
      .moveDown(0.8)
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#374151')
      .text(`Report Name: ${report.name}`)
      .text(`Report Period: ${report.fromDate} - ${report.toDate}`)
      .text(`Generated By: ${officerName}`)
      .text(
        `Generated On: ${formatDate(new Date().toISOString())}`,
      )

    // Report content
    if (report.type === 'Unit Risk Summary') {
      createUnitRiskSummary(doc, rows)
    } else if (report.type === 'High-Risk Case Log') {
      createHighRiskReport(doc, rows)
    } else {
      createGeneralReport(doc, report.type, rows)
    }

    // Footer
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#9ca3af')
      .text(
        'Surakshit AI • Confidential Welfare Report',
        40,
        760,
        {
          width: 515,
          align: 'center',
        },
      )

    doc.end()
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

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid report ID',
    })
  }

  // Find report
  const report = await db.orm.public.Report.where({
    id,
  }).first()

  if (!report) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Report not found',
    })
  }

  // Get all personnel
  const personnel = await db.orm.public.User.where({
    role: 'PERSONNEL',
  }).all()

  const personnelIds = new Set(
    personnel.map((person) => person.id),
  )

  // Get assessments
  const allAssessments = await db.orm.public.Assessment.all()

  const assessmentsByPersonnel = new Map<
  number,
  typeof allAssessments[number]
>()

for (const assessment of allAssessments) {
  if (!personnelIds.has(assessment.userId)) {
    continue
  }

  const existing = assessmentsByPersonnel.get(
    assessment.userId,
  )

  if (
    !existing ||
    new Date(assessment.createdAt).getTime() >
      new Date(existing.createdAt).getTime()
  ) {
    assessmentsByPersonnel.set(
      assessment.userId,
      assessment,
    )
  }
}

const assessments = Array.from(
  assessmentsByPersonnel.values(),
)
  // Get unit information
  const assignments =
    await db.orm.public.UnitAssignment.all()

  const units = await db.orm.public.Unit.all()

  // Build report rows
  const rows: PersonnelRow[] = assessments
    .map((assessment) => {
      const person = personnel.find(
        (item) => item.id === assessment.userId,
      )

      const assignment = assignments.find(
        (item) => item.personnelId === assessment.userId,
      )

      const unit = units.find(
        (item) => item.id === assignment?.unitId,
      )

      return {
        name: person?.name ?? 'Unknown',
        unit: unit?.name ?? 'Unassigned',
        score: Number(assessment.stressScore),
        riskLevel: String(assessment.riskLevel),
        assessmentDate: assessment.createdAt,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.assessmentDate).getTime() -
        new Date(a.assessmentDate).getTime(),
    )

  // Generate PDF in memory.
  // Nothing is saved inside the project folder.
  const pdfBuffer = await createPdf(
    {
      name: report.name,
      type: report.type,
      fromDate: report.fromDate,
      toDate: report.toDate,
    },
    user.email,
    rows,
  )

  const safeName =
    report.name
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase() || `report-${report.id}`

  const filename = `${safeName}.pdf`

  // Tell the browser to download the PDF.
  setHeader(
    event,
    'Content-Type',
    'application/pdf',
  )

  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="${filename}"`,
  )

  setHeader(
    event,
    'Content-Length',
    pdfBuffer.length,
  )

  return pdfBuffer
})