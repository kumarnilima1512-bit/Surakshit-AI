import { requireRole } from '../../../utils/authorization'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody(event)

  const systemName = String(body?.systemName ?? '').trim()
  const timezone = String(body?.timezone ?? '').trim()
  const notificationsEnabled = Boolean(body?.notificationsEnabled)
  const maintenanceMode = Boolean(body?.maintenanceMode)
  const sessionTimeout = String(body?.sessionTimeout ?? '').trim()

  if (!systemName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'System name is required',
    })
  }

  if (!timezone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Timezone is required',
    })
  }

  const timeoutNumber = Number(sessionTimeout)

  if (
    !Number.isFinite(timeoutNumber) ||
    timeoutNumber < 1
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session timeout must be at least 1 minute',
    })
  }

  return {
    success: true,
    message: 'General settings saved successfully',

    settings: {
      systemName,
      timezone,
      notificationsEnabled,
      maintenanceMode,
      sessionTimeout: timeoutNumber.toString(),
    },
  }
})