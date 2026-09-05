import { promises as fs } from 'node:fs'
import path from 'node:path'

export interface MLModelSettings {
  modelName: string
  modelVersion: string
  endpoint: string
  threshold: string
  enabled: boolean
}

const dataDir = path.resolve(process.cwd(), 'server/data')
const settingsFile = path.join(dataDir, 'ml-model-settings.json')

const defaultSettings: MLModelSettings = {
  modelName: 'Surakshit AI Stress Model',
  modelVersion: '1.0.0',
  endpoint: 'http://127.0.0.1:8000/predict',
  threshold: '7.0',
  enabled: true,
}

async function ensureSettingsFile() {
  await fs.mkdir(dataDir, { recursive: true })

  try {
    await fs.access(settingsFile)
  } catch {
    await fs.writeFile(
      settingsFile,
      JSON.stringify(defaultSettings, null, 2),
      'utf-8',
    )
  }
}

export async function getMLModelSettings(): Promise<MLModelSettings> {
  await ensureSettingsFile()

  try {
    const content = await fs.readFile(settingsFile, 'utf-8')

    return {
      ...defaultSettings,
      ...JSON.parse(content),
    }
  } catch {
    return defaultSettings
  }
}

export async function saveMLModelSettings(
  settings: MLModelSettings,
): Promise<MLModelSettings> {
  await ensureSettingsFile()

  await fs.writeFile(
    settingsFile,
    JSON.stringify(settings, null, 2),
    'utf-8',
  )

  return settings
}