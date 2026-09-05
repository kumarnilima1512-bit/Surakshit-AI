import { requireRole } from '../../../utils/authorization'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  return {
    success: true,

    logs: [],

    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  }
})