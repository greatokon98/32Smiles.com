import { ReactNode } from "react"
import { Toaster } from "sonner"
import { SessionProvider } from "next-auth/react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { checkAdminRouteAccess } from "@/lib/admin-access"
import { isAdminRole } from "@/lib/role-permissions"
import AdminShell from "@/features/admin/layout/AdminShell"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  const role = session.user.role || "VIEWER"
  if (!isAdminRole(role)) {
    redirect("/dashboard")
  }

  // Defense in depth: middleware stamps the requested path; re-verify permission
  // server-side so no page can be reached even if a middleware mapping is missed.
  const headersList = await headers()
  const adminPath = headersList.get("x-admin-path")
  if (adminPath) {
    const { allowed } = checkAdminRouteAccess({
      pathname: adminPath,
      isApi: false,
      method: "GET",
      role,
      permissions: session.user.permissions,
    })
    if (!allowed) {
      redirect("/dashboard")
    }
  }

  return (
    <SessionProvider session={session}>
      <AdminShell userId={session.user.id}>{children}<Toaster position="top-right" richColors /></AdminShell>
    </SessionProvider>
  )
}
