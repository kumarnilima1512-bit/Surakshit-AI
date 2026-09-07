import { db } from '../../../../../src/prisma/db'
import { getAuthUser } from '../../../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid personnel ID',
    })
  }

  const body = await readBody<{ text?: string }>(event)
  const text = body?.text?.trim()

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Note text is required',
    })
  }

  const officer = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!officer || officer.role !== 'OFFICER') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  // Welfare Officer can add notes for any personnel.
  // No unit restriction is applied here.

  const personnel = await db.orm.public.User.first({
    id,
  })

  if (!personnel || personnel.role !== 'PERSONNEL') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Personnel not found',
    })
  }

  await db.orm.public.WelfareNote.create({
    personnelId: personnel.id,
    authorId: officer.id,
    text,
  })

  return {
    ok: true,
    message: 'Welfare note added successfully',
  }
})
