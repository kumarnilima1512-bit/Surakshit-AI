import { db } from '../../../src/prisma/db'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async () => {
  const email = process.env.ADMIN_EMAIL 
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw createError({
        statusCode:500,
        statusMessage: 'Admin credentials are not configured',
    })
  }

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