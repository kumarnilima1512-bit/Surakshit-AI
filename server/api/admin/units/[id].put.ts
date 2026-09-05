
import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid unit ID',
    })
  }

  const body = await readBody<{
    name?: string
    code?: string
    location?: string
    description?: string
  }>(event)

  const existingUnit = await db.orm.public.Unit.first({
    id,
  })

  if (!existingUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Unit not found',
    })
  }

  const name = body.name?.trim() || existingUnit.name
  const code = body.code?.trim().toUpperCase() || existingUnit.code

  if (code !== existingUnit.code) {
    const duplicateUnit = await db.orm.public.Unit.first({
      code,
    })

    if (duplicateUnit && duplicateUnit.id !== id) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A unit with this code already exists',
      })
    }
  }

  const updatedUnit = await db.orm.public.Unit.update({
    id,
    name,
    code,
    location:
      body.location !== undefined
        ? body.location.trim() || null
        : existingUnit.location,
    description:
      body.description !== undefined
        ? body.description.trim() || null
        : existingUnit.description,
  } as never)

  if (!updatedUnit) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Unit not found',
    })
  }

  return {
    success: true,
    message: 'Unit updated successfully',
    unit: {
      id: updatedUnit.id,
      name: updatedUnit.name,
      code: updatedUnit.code,
      location: updatedUnit.location,
      description: updatedUnit.description,
      createdAt: updatedUnit.createdAt,
      updatedAt: updatedUnit.updatedAt,
    },
  }
})

