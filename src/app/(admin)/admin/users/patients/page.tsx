import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { Users, Mail, Clock, UserCheck, UserX } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PatientsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const patients = await prisma.user.findMany({
    where: { role: "VIEWER", deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  function formatDate(iso: Date) {
    return iso.toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  function formatDateTime(iso: Date | null) {
    if (!iso) return null
    return iso.toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">
            {patients.length} patient{patients.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {patients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">No patient accounts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Last Login
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 cursor-pointer relative"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/users/${patient.id}`}
                        className="flex items-center gap-3 before:absolute before:inset-0 before:z-0"
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${patient.isActive ? "bg-primary-100" : "bg-gray-100"}`}>
                          <span className={`text-sm font-medium ${patient.isActive ? "text-primary-600" : "text-gray-400"}`}>
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <p className={`font-medium truncate ${patient.isActive ? "text-gray-900" : "text-gray-400"}`}>
                          {patient.name}
                        </p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 relative z-10">
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 relative z-10">
                      {patient.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                          <UserCheck className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                          <UserX className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 relative z-10">
                      {patient.lastLoginAt ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {formatDateTime(patient.lastLoginAt)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 relative z-10">
                      <span className="text-sm text-gray-500">
                        {formatDate(patient.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
