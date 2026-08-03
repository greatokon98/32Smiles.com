import { auth } from "@/lib/auth"

// Pure data + helpers (safe for middleware, route guards, and client components)
export {
  ALL_ACTIONS,
  ALL_RESOURCES,
  BUILT_IN_ROLES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  getEffectivePermissions,
  hasPermission,
  isAdminRole,
  isBuiltInRole,
} from "@/lib/role-permissions"
export type { Action, Permission, Resource } from "@/lib/role-permissions"
import type { Action, Permission, Resource } from "@/lib/role-permissions"
import { hasPermission, isBuiltInRole } from "@/lib/role-permissions"

const ENUM_TO_ROLE: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  RECEPTIONIST: "Receptionist",
  VIEWER: "Viewer",
}

const ROLE_TO_ENUM: Record<string, string> = {
  "Super Admin": "SUPER_ADMIN",
  Admin: "ADMIN",
  Editor: "EDITOR",
  Receptionist: "RECEPTIONIST",
  Viewer: "VIEWER",
}

export function getRoleEnumFromName(name: string): string {
  return ROLE_TO_ENUM[name] || "VIEWER"
}

export function getRoleNameFromEnum(roleEnum: string): string {
  return ENUM_TO_ROLE[roleEnum] || roleEnum || "Viewer"
}

// Effective permissions for the current session. Built-in roles resolve from the
// code matrix; custom roles use the permissions embedded in the session at login.
function sessionPermissions(
  session: { user?: { role?: string; permissions?: Permission[] } } | null
): Permission[] | undefined {
  const role = session?.user?.role || "VIEWER"
  if (isBuiltInRole(role)) return undefined
  return session?.user?.permissions || []
}

export async function checkPermission(
  resource: Resource,
  action: Action
): Promise<{ allowed: boolean; session: any; error?: string }> {
  const session = await auth()
  if (!session?.user) return { allowed: false, session: null, error: "Unauthorized" }
  const role = session.user.role || "VIEWER"
  const allowed = hasPermission(role, resource, action, sessionPermissions(session))
  if (!allowed) return { allowed: false, session, error: "Forbidden" }
  return { allowed: true, session }
}

export async function requirePermission(
  resource: Resource,
  action: Action
): Promise<{ session: any }> {
  const session = await auth()
  if (!session?.user) {
    const error = new Error("Unauthorized")
    ;(error as any).status = 401
    throw error
  }
  const role = session.user.role || "VIEWER"
  const allowed = hasPermission(role, resource, action, sessionPermissions(session))
  if (!allowed) {
    const error = new Error("Forbidden")
    ;(error as any).status = 403
    throw error
  }
  return { session }
}

export function buildNavItems<
  T extends { resource?: Resource; action?: Action; children?: T[] }
>(
  items: T[],
  role: string,
  permissions?: Permission[]
): T[] {
  return items.reduce<T[]>((acc, item) => {
    if (item.children) {
      const filteredChildren = buildNavItems(item.children, role, permissions)
      if (filteredChildren.length > 0) {
        acc.push({ ...item, children: filteredChildren })
      }
      return acc
    }
    if (hasPermission(role, item.resource!, item.action || "read", permissions)) {
      acc.push(item)
    }
    return acc
  }, [])
}
