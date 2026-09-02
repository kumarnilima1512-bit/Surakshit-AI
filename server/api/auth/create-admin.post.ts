import { db } from '../../../src/prisma/db'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async () => {
  const email = 'admin@surakshit.ai'
  const password = 'Admin@12345'

  const existingAdmin = await db.orm.public.User.first({
    email,
  })

  if (existingAdmin) {
    return {
      success: false,
      message: 'Admin account already exists',
    }
  }

  const hashedPassword = await hashPassword(password)

  const admin = await db.orm.public.User.create({
    email,
    name: 'System Administrator',
    username: 'admin',
    password: hashedPassword,
    role: 'ADMIN',
  })

  return {
    success: true,
    message: 'Admin account created successfully',
    admin: {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
    },
  }
})