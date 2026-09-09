import { requireRole } from '../../../utils/authorization'
import { db } from '../../../../src/prisma/db'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const personnel = await db.orm.public.User.where({
    role: 'PERSONNEL',
  }).all()

  return {
    success: true,
    personnel: personnel.map((user) => ({
      id: user.id,
      name: user.name ?? null,
      username: user.username ?? null,
      email: user.email,
      role: user.role,
    })),
  }
})