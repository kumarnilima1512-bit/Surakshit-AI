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
    enabled?: boolean
  }>(event)

  if (typeof body.enabled !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Enabled must be a boolean value',
    })
  }

  // 2FA storage will be connected when the User security field/model
  // is available in the Prisma ORM contract.
  return {
    ok: true,
    enabled: body.enabled,
  }
})