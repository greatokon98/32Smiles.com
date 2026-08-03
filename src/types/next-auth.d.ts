import { DefaultSession } from "next-auth"
import type { Permission } from "@/lib/role-permissions"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      isSuperAdmin?: boolean
      isStaff?: boolean
      permissions?: Permission[]
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    isSuperAdmin?: boolean
    isStaff?: boolean
    permissions?: Permission[]
  }
}
