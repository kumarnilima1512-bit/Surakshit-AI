import { requireRole } from '../../../utils/authorization'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  return {
    success: true,

    settings: {
      systemName: 'Surakshit AI',
      timezone: 'Asia/Kolkata',
      notificationsEnabled: true,
      maintenanceMode: false,
      sessionTimeout: '30',
    },
  }
})