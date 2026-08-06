"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { siteConfig } from "@/config/site"

function GateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string

    try {
      const res = await fetch("/api/demo/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.status === 429) {
        setError("Too many attempts. Please try again later.")
        setLoading(false)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || "Unable to verify the password. Please try again.")
        setLoading(false)
        return
      }

      router.replace(callbackUrl)
      router.refresh()
    } catch {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="demo-password" className="block text-sm font-medium text-gray-700 mb-1">
            Demo Password
          </label>
          <input
            id="demo-password"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Enter Demo"}
        </button>
      </form>

      <p className="text-xs text-center text-gray-500">
        Confidential — for evaluation only. Content and design are the property of {siteConfig.name}.
      </p>
    </div>
  )
}

export default function DemoAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              {siteConfig.name}
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 mt-4">Demo Preview</h1>
            <p className="text-gray-500 text-sm mt-1">Enter the demo password to continue</p>
          </div>

          <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
            <GateForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
