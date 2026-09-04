import { getAuthUser } from '../../utils/auth-session'
import { db } from '../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  return {
    success: true,
    userId: authUser.userId,
    role: authUser.role,
  }
})