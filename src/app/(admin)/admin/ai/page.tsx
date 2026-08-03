import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { promptService } from "@/ai/prompts/service"
import { costTracker } from "@/ai/operations"
import { getAIRegistry } from "@/ai/providers/registry"
import {
  Bot,
  Brain,
  DollarSign,
  Zap,
  Shield,
  Settings,
  Activity,
} from "lucide-react"

export default async function AIAdminPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/admin/login")
  }

  // Fetch data
  const registryPromise = getAIRegistry()
  const [templates, dailySpend, summary, providerStatus] = await Promise.all([
    promptService.list(),
    costTracker.getDailySpend(),
    costTracker.getUsageSummary(),
    registryPromise.then((r) => r.getStatus()),
  ])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/admin/dashboard" className="text-xl font-bold text-primary-600">
            32Smiles Admin
          </a>
          <span className="text-sm text-gray-500">AI Engine Settings</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <Bot className="h-7 w-7 text-primary-600" />
          AI Engine Settings
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today's Requests</p>
                <p className="text-2xl font-bold">{dailySpend.requests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tokens Used Today</p>
                <p className="text-2xl font-bold">{dailySpend.tokens.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today's Cost</p>
                <p className="text-2xl font-bold">${dailySpend.cost.toFixed(4)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Provider Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI Providers
            </h2>
            <div className="space-y-4">
              {providerStatus.map((provider) => (
                <div
                  key={provider.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        provider.available
                          ? "bg-green-500"
                          : provider.enabled
                            ? "bg-yellow-500"
                            : "bg-gray-300"
                      }`}
                    />
                    <div>
                      <p className="font-medium capitalize">{provider.name}</p>
                      <p className="text-sm text-gray-500">{provider.defaultModel}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      provider.available
                        ? "bg-green-100 text-green-700"
                        : provider.enabled
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {provider.available ? "Connected" : provider.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Usage Summary (30 days)
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Requests</span>
                <span className="font-bold">{summary.totalRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Tokens</span>
                <span className="font-bold">{summary.totalTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Cost</span>
                <span className="font-bold">${summary.totalCostUsd.toFixed(4)}</span>
              </div>

              {summary.byProvider.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">By Provider</h3>
                  {summary.byProvider.map((p) => (
                    <div
                      key={p.provider}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <span className="capitalize text-sm">{p.provider}</span>
                      <div className="text-right text-sm">
                        <span className="text-gray-500">{p.requests} reqs</span>
                        <span className="ml-2 font-medium">${p.cost.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prompt Templates */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Prompt Templates
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Variables</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-sm text-gray-500">{template.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {template.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {Array.isArray(template.variables)
                          ? (template.variables as string[]).join(", ")
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            template.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
