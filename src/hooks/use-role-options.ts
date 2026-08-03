"use client"

import { useEffect, useState } from "react"

export interface RoleOption {
  value: string
  label: string
  isBuiltIn: boolean
}

const BUILT_IN_OPTIONS: RoleOption[] = [
  { value: "SUPER_ADMIN", label: "Super Admin", isBuiltIn: true },
  { value: "ADMIN", label: "Admin", isBuiltIn: true },
  { value: "EDITOR", label: "Editor", isBuiltIn: true },
  { value: "RECEPTIONIST", label: "Receptionist", isBuiltIn: true },
  { value: "VIEWER", label: "Viewer", isBuiltIn: true },
]

export function useRoleOptions() {
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>(BUILT_IN_OPTIONS)
  const [loadingRoles, setLoadingRoles] = useState(false)

  useEffect(() => {
    let active = true
    setLoadingRoles(true)
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        const custom = Array.isArray(data)
          ? data.map((r: { id: string; name: string }) => ({
              value: r.name,
              label: r.name,
              isBuiltIn: false,
            }))
          : []
        setRoleOptions([...BUILT_IN_OPTIONS, ...custom])
      })
      .catch(() => {
        if (active) setRoleOptions(BUILT_IN_OPTIONS)
      })
      .finally(() => {
        if (active) setLoadingRoles(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { roleOptions, loadingRoles }
}
