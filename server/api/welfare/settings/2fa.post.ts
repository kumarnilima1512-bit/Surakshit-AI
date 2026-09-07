import { db } from '../../../../src/prisma/db'
import { getAuthUser } from '../../../utils/auth-session'
import {
  hashPassword,
} from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  if (authUser.role !== 'OFFICER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Welfare officer access required',
    })
  }

  const body = await readBody<{
    enabled?: boolean
    pin?: string
  }>(event)

  const enabled = body?.enabled === true
  const pin = body?.pin?.trim() ?? ''

  const user = await db.orm.public.User.first({
    id: authUser.userId,
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Welfare officer not found',
    })
  }

  // --------------------------------------------------
  // DISABLE 2FA
  // --------------------------------------------------

  if (!enabled) {
    await db.orm.public.User.where({
      id: user.id,
    }).update({
      twoFactorEnabled: false,
    })

    return {
      ok: true,
      enabled: false,
    }
  }

  // --------------------------------------------------
  // ENABLE 2FA
  // --------------------------------------------------

  if (!pin) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'A 6-digit security PIN is required',
    })
  }

  if (!/^\d{6}$/.test(pin)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Security PIN must contain exactly 6 digits',
    })
  }

  // --------------------------------------------------
  // HASH PIN
  // Uses the same bcrypt configuration
  // as the existing authentication system.
  // --------------------------------------------------

  const pinHash = await hashPassword(pin)

  // --------------------------------------------------
  // SAVE 2FA SETTINGS
  // --------------------------------------------------

  await db.orm.public.User.where({
    id: user.id,
  }).update({
    twoFactorEnabled: true,
    twoFactorPinHash: pinHash,
  })

  return {
    ok: true,
    enabled: true,
  }
})