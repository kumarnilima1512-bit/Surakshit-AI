import { requireRole } from '../../utils/authorization'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN'])

  return {
    success: true,
    message: 'Welcome to Admin Dashboard',
    user: {
      id: user.userId,
      email: user.email,
      role: user.role,
    },
  }
})