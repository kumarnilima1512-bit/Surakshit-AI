import { requireRole } from '../../../utils/authorization'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  const body = await readBody(event)

  const enabled = Boolean(body?.enabled)
  const method = String(body?.method ?? 'Authenticator App').trim()

  if (!method) {
    throw createError({
      statusCode: 400,
      statusMessage: '2FA method is required',
    })
  }

  return {
    success: true,
    message: enabled
      ? 'Two-factor authentication enabled successfully'
      : 'Two-factor authentication disabled successfully',

    twoFactor: {
      enabled,
      method,
      configuredAt: enabled ? new Date().toISOString() : null,
      lastVerifiedAt: null,
    },

    admin: {
      id: user.userId,
      email: user.email,
    },
  }
})