import prisma from "@/lib/prisma"

interface AuditLogInput {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        resource: input.resource,
        ...(input.userId && { userId: input.userId }),
        ...(input.resourceId && { resourceId: input.resourceId }),
        ...(input.oldValues && { oldValues: input.oldValues as any }),
        ...(input.newValues && { newValues: input.newValues as any }),
        ...(input.ipAddress && { ipAddress: input.ipAddress }),
        ...(input.userAgent && { userAgent: input.userAgent }),
      },
    })
  } catch (error) {
    console.error("[AuditLog] Failed to create:", error)
  }
}
