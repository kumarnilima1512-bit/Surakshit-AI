import { requireRole } from '../../../utils/authorization'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  return {
    success: true,

    attempts: [],

    summary: {
      total: 0,
      last24Hours: 0,
      blocked: 0,
    },

    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  }
})