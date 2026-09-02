import { getAuthUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const authUser = await getAuthUser(event)

  return {
    success: true,
    user: authUser,
  }
})