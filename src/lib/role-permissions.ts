// Pure role/permission data + helpers.
// This module must NOT import auth, prisma, or next — it is used by middleware (edge/node),
// server route guards, and client components alike.

export type Resource =
  | "dashboard"
  | "content"
  | "media"
  | "ai-studio"
  | "ai-settings"
  | "ai-templates"
  | "ai-usage"
  | "appointments"
  | "orders"
  | "contacts"
  | "notifications"
  | "communication"
  | "users"
  | "roles"
  | "api-manager"
  | "analytics"
  | "audit-logs"
  | "settings"

export type Action = "create" | "read" | "update" | "delete" | "publish" | "invite" | "manage"

export type Permission = { resource: Resource; action: Action }

export const ALL_RESOURCES: Resource[] = [
  "dashboard", "content", "media", "ai-studio", "ai-settings", "ai-templates",
  "ai-usage", "appointments", "orders", "contacts", "notifications", "communication",
  "users", "roles", "api-manager", "analytics", "audit-logs", "settings",
]

export const ALL_ACTIONS: Action[] = [
  "create", "read", "update", "delete", "publish", "invite", "manage",
]

export const BUILT_IN_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "RECEPTIONIST", "VIEWER"] as const
export type BuiltInRole = (typeof BUILT_IN_ROLES)[number]

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  RECEPTIONIST: "Receptionist",
  VIEWER: "Viewer",
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: ALL_RESOURCES.flatMap((r) => ALL_ACTIONS.map((a) => ({ resource: r, action: a }))),

  ADMIN: [
    { resource: "dashboard", action: "read" },
    { resource: "content", action: "create" },
    { resource: "content", action: "read" },
    { resource: "content", action: "update" },
    { resource: "content", action: "delete" },
    { resource: "content", action: "publish" },
    { resource: "media", action: "create" },
    { resource: "media", action: "read" },
    { resource: "media", action: "update" },
    { resource: "media", action: "delete" },
    { resource: "ai-studio", action: "create" },
    { resource: "ai-studio", action: "read" },
    { resource: "appointments", action: "create" },
    { resource: "appointments", action: "read" },
    { resource: "appointments", action: "update" },
    { resource: "appointments", action: "delete" },
    { resource: "orders", action: "read" },
    { resource: "orders", action: "update" },
    { resource: "contacts", action: "read" },
    { resource: "contacts", action: "update" },
    { resource: "notifications", action: "create" },
    { resource: "notifications", action: "read" },
    { resource: "notifications", action: "delete" },
    { resource: "communication", action: "read" },
    { resource: "users", action: "read" },
    { resource: "users", action: "update" },
    { resource: "analytics", action: "read" },
  ],

  EDITOR: [
    { resource: "dashboard", action: "read" },
    { resource: "content", action: "create" },
    { resource: "content", action: "read" },
    { resource: "content", action: "update" },
    { resource: "content", action: "delete" },
    { resource: "content", action: "publish" },
    { resource: "media", action: "create" },
    { resource: "media", action: "read" },
    { resource: "media", action: "update" },
    { resource: "ai-studio", action: "create" },
    { resource: "ai-studio", action: "read" },
    { resource: "notifications", action: "read" },
    { resource: "communication", action: "read" },
  ],

  RECEPTIONIST: [
    { resource: "dashboard", action: "read" },
    { resource: "appointments", action: "create" },
    { resource: "appointments", action: "read" },
    { resource: "appointments", action: "update" },
    { resource: "orders", action: "read" },
    { resource: "orders", action: "update" },
    { resource: "contacts", action: "create" },
    { resource: "contacts", action: "read" },
    { resource: "contacts", action: "update" },
    { resource: "notifications", action: "read" },
    { resource: "communication", action: "read" },
  ],

  VIEWER: [],
}

export function isBuiltInRole(role: string): boolean {
  return (BUILT_IN_ROLES as readonly string[]).includes(role)
}

export function isAdminRole(role: string): boolean {
  return role !== "VIEWER"
}

export function getEffectivePermissions(
  role: string,
  customPermissions?: Permission[]
): Permission[] {
  if (isBuiltInRole(role)) {
    return ROLE_PERMISSIONS[role] || []
  }
  return customPermissions || []
}

export function hasPermission(
  role: string,
  resource: Resource,
  action: Action,
  customPermissions?: Permission[]
): boolean {
  if (role === "SUPER_ADMIN") return true
  return getEffectivePermissions(role, customPermissions).some(
    (p) => p.resource === resource && p.action === action
  )
}
