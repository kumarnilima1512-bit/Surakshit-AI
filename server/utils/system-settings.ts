import { promises as fs } from 'node:fs'
import path from 'node:path'

export interface GeneralSettings {
  systemName: string
  timezone: string
  notificationsEnabled: boolean
  maintenanceMode: boolean
  sessionTimeout: string
}

const dataDir = path.resolve(process.cwd(), 'server/data')
const settingsFile = path.join(dataDir, 'general-settings.json')

const defaultSettings: GeneralSettings = {
  systemName: 'Surakshit AI',
  timezone: 'Asia/Kolkata',
  notificationsEnabled: true,
  maintenanceMode: false,
  sessionTimeout: '30',
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

export async function getGeneralSettings(): Promise<GeneralSettings> {
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

export async function saveGeneralSettings(
  settings: GeneralSettings,
): Promise<GeneralSettings> {
  await ensureSettingsFile()

  await fs.writeFile(
    settingsFile,
    JSON.stringify(settings, null, 2),
    'utf-8',
  )

  return settings
}