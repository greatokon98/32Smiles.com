// Maps admin page + admin API URL paths to (resource, action) permission checks.
// Single source of truth for per-route enforcement in middleware and the server-side
// page guard. Resource names match the nav/permission matrix (ROLE_PERMISSIONS).

import type { Action, Resource } from "@/lib/role-permissions"
import { hasPermission, isAdminRole } from "@/lib/role-permissions"

type RouteRule = { prefix: string; resource: Resource; action: Action }

// Ordered longest-prefix first; the first matching rule wins. ":seg" wildcard matches
// any single path segment (e.g. content type or record id).
const PAGE_RULES: RouteRule[] = [
  { prefix: "/admin/dashboard", resource: "dashboard", action: "read" },
  { prefix: "/admin/profile", resource: "dashboard", action: "read" },
  { prefix: "/admin/users/create", resource: "users", action: "create" },
  { prefix: "/admin/users/invite", resource: "users", action: "invite" },
  { prefix: "/admin/users", resource: "users", action: "read" },
  { prefix: "/admin/roles/create", resource: "roles", action: "create" },
  { prefix: "/admin/roles", resource: "roles", action: "read" },
  { prefix: "/admin/content", resource: "content", action: "read" },
  { prefix: "/admin/media", resource: "media", action: "read" },
  { prefix: "/admin/ai-studio", resource: "ai-studio", action: "read" },
  { prefix: "/admin/ai/templates", resource: "ai-templates", action: "read" },
  { prefix: "/admin/ai/usage", resource: "ai-usage", action: "read" },
  { prefix: "/admin/ai", resource: "ai-settings", action: "read" },
  { prefix: "/admin/appointments", resource: "appointments", action: "read" },
  { prefix: "/admin/orders", resource: "orders", action: "read" },
  { prefix: "/admin/contacts", resource: "contacts", action: "read" },
  { prefix: "/admin/notifications", resource: "notifications", action: "read" },
  { prefix: "/admin/communication", resource: "communication", action: "read" },
  { prefix: "/admin/analytics", resource: "analytics", action: "read" },
  { prefix: "/admin/audit-logs", resource: "audit-logs", action: "read" },
  { prefix: "/admin/settings", resource: "settings", action: "read" },
]

// API routes whose permission cannot be derived from the HTTP method alone.
const API_ACTION_OVERRIDES: RouteRule[] = [
  { prefix: "/api/admin/content/:type/:id/publish", resource: "content", action: "publish" },
  { prefix: "/api/admin/content/:type/:id/seo", resource: "content", action: "update" },
  { prefix: "/api/admin/users/invite", resource: "users", action: "invite" },
  { prefix: "/api/admin/notifications/:id", resource: "notifications", action: "read" },
  { prefix: "/api/admin/contacts/:id/reply", resource: "contacts", action: "update" },
  { prefix: "/api/admin/messages", resource: "communication", action: "read" },
]

const API_METHOD_ACTION: Record<string, Action> = {
  GET: "read",
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
}

// Ordered longest-prefix first; first match wins. Wildcard ":seg" matches one segment.
const API_RULES: RouteRule[] = [
  { prefix: "/api/admin/dashboard", resource: "dashboard", action: "read" },
  { prefix: "/api/admin/users/invite", resource: "users", action: "invite" },
  { prefix: "/api/admin/users", resource: "users", action: "read" },
  { prefix: "/api/admin/roles", resource: "roles", action: "read" },
  { prefix: "/api/admin/upload", resource: "media", action: "read" },
  { prefix: "/api/admin/content", resource: "content", action: "read" },
  { prefix: "/api/admin/media", resource: "media", action: "read" },
  { prefix: "/api/admin/ai-studio", resource: "ai-studio", action: "read" },
  { prefix: "/api/admin/ai/templates", resource: "ai-templates", action: "read" },
  { prefix: "/api/admin/ai/stats", resource: "ai-usage", action: "read" },
  { prefix: "/api/admin/ai/knowledge-base", resource: "ai-settings", action: "read" },
  { prefix: "/api/admin/ai/providers", resource: "ai-settings", action: "read" },
  { prefix: "/api/admin/ai", resource: "ai-studio", action: "read" },
  { prefix: "/api/admin/appointments", resource: "appointments", action: "read" },
  { prefix: "/api/admin/orders", resource: "orders", action: "read" },
  { prefix: "/api/admin/contacts", resource: "contacts", action: "read" },
  { prefix: "/api/admin/messages", resource: "communication", action: "read" },
  { prefix: "/api/admin/notifications", resource: "notifications", action: "read" },
  { prefix: "/api/admin/settings", resource: "settings", action: "read" },
  { prefix: "/api/admin/analytics", resource: "analytics", action: "read" },
]

function matches(prefix: string, pathname: string): boolean {
  const r = prefix.split("/").filter(Boolean)
  const p = pathname.split("/").filter(Boolean)
  if (r.length > p.length) return false
  for (let i = 0; i < r.length; i++) {
    if (r[i].startsWith(":")) continue
    if (r[i] !== p[i]) return false
  }
  return true
}

function matchRule(rules: RouteRule[], pathname: string): RouteRule | null {
  return rules.find((rule) => matches(rule.prefix, pathname)) || null
}

export function matchAdminRoute(
  pathname: string,
  isApi: boolean
): { resource: Resource; action: Action } | null {
  if (isApi) {
    const override = API_ACTION_OVERRIDES.find((o) => matches(o.prefix, pathname))
    if (override) return { resource: override.resource, action: override.action }
    const rule = matchRule(API_RULES, pathname)
    if (!rule) return null
    return { resource: rule.resource, action: rule.action }
  }
  const rule = matchRule(PAGE_RULES, pathname)
  if (!rule) return null
  return { resource: rule.resource, action: rule.action }
}

export function checkAdminRouteAccess(args: {
  pathname: string
  isApi: boolean
  method: string
  role: string
  permissions?: { resource: Resource; action: Action }[]
}): { allowed: boolean; resource?: Resource; action?: Action } {
  const route = matchAdminRoute(args.pathname, args.isApi)
  if (!route) return { allowed: true }
  if (!isAdminRole(args.role)) return { allowed: false, resource: route.resource, action: route.action }

  let action = route.action
  if (args.isApi && !API_ACTION_OVERRIDES.some((o) => matches(o.prefix, args.pathname))) {
    action = API_METHOD_ACTION[args.method] || "read"
  }

  const allowed = hasPermission(args.role, route.resource, action, args.permissions)
  return { allowed, resource: route.resource, action }
}
