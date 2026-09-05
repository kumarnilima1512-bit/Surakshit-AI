import { requireRole } from '../../../utils/authorization'
import { getMLModelSettings } from '../../../utils/ml-model-settings'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const settings = await getMLModelSettings()

  return {
    success: true,
    settings,
  }
})