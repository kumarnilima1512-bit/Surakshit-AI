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

  const body = await readBody<{
    name?: string
    phone?: string
    email?: string
  }>(event)

  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()

  if (!name || !email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and email are required',
    })
  }

  const existingUser = await db.orm.public.User.where({
    email,
  }).first()

  if (existingUser && existingUser.id !== user.userId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A user with this email already exists',
    })
  }

  const updatedUser = await db.orm.public.User.where({
    id: user.userId,
  }).update({
    name,
    email,
  })

  if (!updatedUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Commander not found',
    })
  }

  return {
    name: updatedUser.name ?? '',
    rank: 'Commander',
    serviceId: String(updatedUser.id),
    unitName: 'Unit Not Assigned',
    unitCode: 'N/A',
    email: updatedUser.email,
    phone: body.phone?.trim() ?? '',
    joinedDate: updatedUser.createdAt,
    avatarUrl: null,
  }
})