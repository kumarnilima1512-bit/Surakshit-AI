import { requireRole } from '../../../utils/authorization'
import {
  getMLModelSettings,
  saveMLModelSettings,
  type MLModelSettings,
} from '../../../utils/ml-model-settings'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const body = await readBody<Partial<MLModelSettings>>(event)

  const current = await getMLModelSettings()

  const threshold =
    body.threshold !== undefined
      ? String(body.threshold).trim()
      : current.threshold

  const thresholdNumber = Number(threshold)

  if (
    !Number.isFinite(thresholdNumber) ||
    thresholdNumber < 0 ||
    thresholdNumber > 10
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Risk threshold must be between 0 and 10',
    })
  }

  const settings: MLModelSettings = {
    modelName:
      body.modelName !== undefined
        ? body.modelName.trim() || current.modelName
        : current.modelName,

    modelVersion:
      body.modelVersion !== undefined
        ? body.modelVersion.trim() || current.modelVersion
        : current.modelVersion,

    endpoint:
      body.endpoint !== undefined
        ? body.endpoint.trim() || current.endpoint
        : current.endpoint,

    threshold,

    enabled:
      body.enabled !== undefined
        ? Boolean(body.enabled)
        : current.enabled,
  }

  const saved = await saveMLModelSettings(settings)

  return {
    success: true,
    message: 'ML model settings saved successfully',
    settings: saved,
  }
})