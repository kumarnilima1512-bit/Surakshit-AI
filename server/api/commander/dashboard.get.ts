import { requireRole } from '../../utils/authorization'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['COMMANDER'])

  return {
    success: true,
    message: 'Welcome to Commander Dashboard',
    user: {
      id: user.userId,
      email: user.email,
      role: user.role,
    },
  }
})