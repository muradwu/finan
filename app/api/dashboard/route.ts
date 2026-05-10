import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [settings, currentMonthTx, prevMonthTx, last30DaysTx, recentTx] = await Promise.all([
      prisma.settings.findFirst(),
      prisma.transaction.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
      prisma.transaction.findMany({ where: { date: { gte: prevMonthStart, lte: prevMonthEnd } } }),
      prisma.transaction.findMany({
        where: { date: { gte: thirtyDaysAgo }, type: "expense" },
      }),
      prisma.transaction.findMany({
        orderBy: { date: "desc" },
        take: 5,
      }),
    ])

    const budget = settings?.monthlyBudget ?? 1500
    const currency = settings?.currency ?? "AZN"

    const currentExpenses = currentMonthTx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const currentIncome = currentMonthTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const remaining = budget - currentExpenses

    const byCategory = currentMonthTx
      .filter((t) => t.type === "expense")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount
        return acc
      }, {})

    const prevByCategory = prevMonthTx
      .filter((t) => t.type === "expense")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount
        return acc
      }, {})

    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }))

    const expenseCount = currentMonthTx.filter((t) => t.type === "expense").length
    const avgTransaction = expenseCount > 0 ? currentExpenses / expenseCount : 0

    const prevExpenses = prevMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const avgTrend = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0

    const dailyData: Record<string, { income: number; expense: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      dailyData[key] = { income: 0, expense: 0 }
    }

    for (const t of last30DaysTx) {
      const key = new Date(t.date).toISOString().split("T")[0]
      if (dailyData[key]) dailyData[key].expense += t.amount
    }

    const currentIncomeTx = currentMonthTx.filter((t) => t.type === "income")
    for (const t of currentIncomeTx) {
      const key = new Date(t.date).toISOString().split("T")[0]
      if (dailyData[key]) dailyData[key].income += t.amount
    }

    const chartData = Object.entries(dailyData).map(([date, vals]) => ({
      date,
      income: vals.income,
      expense: vals.expense,
    }))

    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()

    return NextResponse.json({
      budget,
      currency,
      remaining,
      currentExpenses,
      currentIncome,
      byCategory,
      prevByCategory,
      topCategories,
      avgTransaction,
      avgTrend,
      chartData,
      recentTransactions: recentTx,
      daysLeft,
      transactionCount: currentMonthTx.length,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка загрузки дашборда" }, { status: 500 })
  }
}
