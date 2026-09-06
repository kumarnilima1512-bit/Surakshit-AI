import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody<{
    name?: string
    code?: string
    location?: string
    description?: string
  }>(event)

  const name = body.name?.trim()
  const code = body.code?.trim().toUpperCase()

  if (!name || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and code are required',
    })
  }

  const existing = await db.orm.public.Unit.first({ code })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A unit with this code already exists',
    })
  }

  const unit = await db.orm.public.Unit.create({
    name,
    code,
    location: body.location?.trim() || null,
    description: body.description?.trim() || null,
  })

  return {
    success: true,
    message: 'Unit created successfully',
    unit,
  }
})