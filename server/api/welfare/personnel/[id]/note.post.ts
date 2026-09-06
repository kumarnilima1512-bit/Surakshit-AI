import { readBody } from 'h3'
import { getRouterParam } from 'h3'

import { requireRole } from '../../../../utils/authorization'

export default defineEventHandler(async (event) => {
  const authUser = await requireRole(event, ['OFFICER'])

  const personnelId = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(personnelId) || personnelId <= 0) {
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

  return {
    ok: true,
    personnelId,
    authorId: authUser.userId,
    text,
  }
})