import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { isBuiltInRole } from "@/lib/role-permissions"
import type { Permission } from "@/lib/role-permissions"

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findFirst({
          where: { email: credentials.email as string, deletedAt: null },
        })

        if (!user || !user.isActive || !user.passwordHash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        // For custom roles, embed their DB permissions in the session.
        let permissions: Permission[] | undefined
        if (!isBuiltInRole(user.role)) {
          const roleRow = await prisma.role.findUnique({
            where: { name: user.role },
            select: {
              permissions: { select: { resource: true, action: true } },
            },
          })
          permissions =
            roleRow?.permissions.map((p) => ({
              resource: p.resource as Permission["resource"],
              action: p.action as Permission["action"],
            })) || []
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isSuperAdmin: user.role === "SUPER_ADMIN",
          isStaff: user.role !== "VIEWER",
          permissions,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || "VIEWER"
        token.isSuperAdmin = Boolean((user as { isSuperAdmin?: boolean }).isSuperAdmin)
        token.isStaff = (user as { isStaff?: boolean }).isStaff ?? ((user as { role?: string }).role || "VIEWER") !== "VIEWER"
        token.permissions = (user as { permissions?: Permission[] }).permissions
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Canonical user id comes from NextAuth's `sub` claim (set at login),
        // not a custom claim, so identity can never desync from the JWT.
        const userId = (token.sub as string) || ""
        session.user.id = userId

        // Reconcile name/email/role against the database so a stale or
        // mislabeled JWT never presents as a different account.
        let dbUser: { name: string | null; email: string | null; role: string } | null = null
        if (userId) {
          try {
            dbUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true, role: true },
            })
          } catch {
            dbUser = null
          }
        }

        if (dbUser) {
          session.user.name = dbUser.name ?? session.user.name ?? ""
          session.user.email = dbUser.email ?? session.user.email ?? ""
          session.user.role = dbUser.role
          session.user.isSuperAdmin = dbUser.role === "SUPER_ADMIN"
          session.user.isStaff = dbUser.role !== "VIEWER"
        } else {
          session.user.role = token.role as string
          session.user.isSuperAdmin = Boolean(token.isSuperAdmin)
          session.user.isStaff = token.isStaff === true
        }
        session.user.permissions = token.permissions as Permission[] | undefined
      }
      return session
    },
  },
})

// Helper to check if user is authenticated and has required role
export async function requireAuth(roles?: string[]) {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (roles && !roles.includes(session.user.role)) {
    throw new Error("Forbidden")
  }

  return session
}
