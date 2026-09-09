import { db } from '../../src/prisma/db'

interface CreateAuditLogInput {
  userId: number
  action: string
  resource: string
  ipAddress?: string | null
}

export async function createAuditLog(
  input: CreateAuditLogInput,
) {
  return db.orm.public.AuditLog.create({
    userId: input.userId,
    action: input.action,
    resource: input.resource,
    ipAddress: input.ipAddress ?? null,
  })
}