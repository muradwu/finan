export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { HeroMetric } from "@/features/dashboard/components/HeroMetric"
import { CategoryDonut } from "@/features/dashboard/components/CategoryDonut"
import { IncomeExpenseChart } from "@/features/dashboard/components/IncomeExpenseChart"
import { RecentTransactions } from "@/features/dashboard/components/RecentTransactions"
import { QuickAddProvider } from "@/components/layout/QuickAddProvider"
import { CATEGORIES, CategoryKey } from "@/lib/categories"
import { formatCurrency } from "@/lib/formatters"

async function getDashboardData() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [settings, currentMonthTx, last30Tx, recentTx] = await Promise.all([
    prisma.settings.findFirst(),
    prisma.transaction.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.transaction.findMany({ where: { date: { gte: thirtyDaysAgo } } }),
    prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 5 }),
  ])

  const budget = settings?.monthlyBudget ?? 1500
  const currency = settings?.currency ?? "AZN"
  const currentExpenses = currentMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const remaining = budget - currentExpenses

  const byCategory = currentMonthTx
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount
      return acc
    }, {})

  const topCategories = Object.entries(byCategory).sort(([, a], [, b]) => b - a).slice(0, 3)
  const expenseCount = currentMonthTx.filter((t) => t.type === "expense").length
  const avgTransaction = expenseCount > 0 ? currentExpenses / expenseCount : 0

  const dailyMap: Record<string, { income: number; expense: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    dailyMap[d.toISOString().split("T")[0]] = { income: 0, expense: 0 }
  }
  for (const t of last30Tx) {
    const key = new Date(t.date).toISOString().split("T")[0]
    if (dailyMap[key]) {
      if (t.type === "expense") dailyMap[key].expense += t.amount
      else dailyMap[key].income += t.amount
    }
  }
  const chartData = Object.entries(dailyMap).map(([date, v]) => ({ date, income: v.income, expense: v.expense }))
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()

  return { budget, currency, remaining, currentExpenses, byCategory, topCategories, avgTransaction, chartData, recentTx, daysLeft }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <QuickAddProvider>
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
            </p>
          </header>

          <HeroMetric
            remaining={data.remaining}
            budget={data.budget}
            currentExpenses={data.currentExpenses}
            currency={data.currency}
            daysLeft={data.daysLeft}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-3">Расходы по категориям</h2>
              <CategoryDonut byCategory={data.byCategory} currency={data.currency} />
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold mb-3">Топ категории</h2>
                {data.topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет данных</p>
                ) : (
                  <ul className="space-y-2">
                    {data.topCategories.map(([cat, amount]) => (
                      <li key={cat} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CATEGORIES[cat as CategoryKey]?.color }} />
                          <span className="text-sm truncate">{CATEGORIES[cat as CategoryKey]?.label ?? cat}</span>
                        </div>
                        <span className="text-sm tabular-nums font-mono shrink-0">{formatCurrency(amount, data.currency)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-semibold mb-1">Средний чек</h2>
                <p className="text-xl tabular-nums font-mono font-semibold">{formatCurrency(data.avgTransaction, data.currency)}</p>
                <p className="text-xs text-muted-foreground mt-1">на транзакцию этого месяца</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4">Доходы vs Расходы за 30 дней</h2>
            <IncomeExpenseChart data={data.chartData} currency={data.currency} />
            <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full" style={{ background: "oklch(0.5 0.15 143)" }} />
                Доходы
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full" style={{ background: "oklch(0.58 0.14 234)" }} />
                Расходы
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Последние транзакции</h2>
            <RecentTransactions
              transactions={data.recentTx.map((t) => ({
                ...t,
                date: t.date.toISOString(),
                type: t.type as string,
                category: t.category as string,
              }))}
              currency={data.currency}
            />
          </div>
        </div>
      </div>
    </QuickAddProvider>
  )
}
