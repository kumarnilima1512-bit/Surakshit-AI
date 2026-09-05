import { requireRole } from '../../../utils/authorization'
import {
  getGeneralSettings,
  saveGeneralSettings,
  type GeneralSettings,
} from '../../../utils/system-settings'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody<Partial<GeneralSettings>>(event)

  const current = await getGeneralSettings()

  const sessionTimeout =
    body.sessionTimeout !== undefined
      ? String(body.sessionTimeout).trim()
      : current.sessionTimeout

  if (
    sessionTimeout !== '' &&
    (!Number.isFinite(Number(sessionTimeout)) ||
      Number(sessionTimeout) <= 0)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session timeout must be a positive number',
    })
  }

  const settings: GeneralSettings = {
    systemName:
      body.systemName !== undefined
        ? body.systemName.trim() || current.systemName
        : current.systemName,

    timezone:
      body.timezone !== undefined
        ? body.timezone.trim() || current.timezone
        : current.timezone,

    notificationsEnabled:
      body.notificationsEnabled !== undefined
        ? Boolean(body.notificationsEnabled)
        : current.notificationsEnabled,

    maintenanceMode:
      body.maintenanceMode !== undefined
        ? Boolean(body.maintenanceMode)
        : current.maintenanceMode,

    sessionTimeout,
  }

  const saved = await saveGeneralSettings(settings)

  return {
    success: true,
    message: 'General settings saved successfully',
    settings: saved,
  }
})