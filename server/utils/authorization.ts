import { getAuthUser, type AuthUser } from './auth-session'

export async function requireRole(
  event: any,
  allowedRoles: AuthUser['role'][]
): Promise<AuthUser> {
  const user = await getAuthUser(event)

  if (!allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to access this resource',
    })
  }

  return user
}