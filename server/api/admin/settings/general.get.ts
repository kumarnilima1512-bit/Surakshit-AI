import { requireRole } from '../../../utils/authorization'
import { getGeneralSettings } from '../../../utils/system-settings'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const settings = await getGeneralSettings()

  return {
    success: true,
    settings,
  }
})