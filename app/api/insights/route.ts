import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { generateInsights } from "@/lib/openai"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [settings, last30, prev30] = await Promise.all([
      prisma.settings.findUnique({ where: { userId } }),
      prisma.transaction.findMany({ where: { userId, date: { gte: thirtyDaysAgo } } }),
      prisma.transaction.findMany({ where: { userId, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    ])

    if (last30.length < 20) {
      return NextResponse.json({ insights: [], insufficientData: true, count: last30.length })
    }

    const expenses = last30.filter((t) => t.type === "expense")
    const income = last30.filter((t) => t.type === "income")
    const prevExpenses = prev30.filter((t) => t.type === "expense")

    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
    const totalIncome = income.reduce((s, t) => s + t.amount, 0)

    const byCategory = expenses.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount
      return acc
    }, {})

    const prevByCategory = prevExpenses.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount
      return acc
    }, {})

    const weekdayTx = expenses.filter((t) => { const d = new Date(t.date).getDay(); return d >= 1 && d <= 5 })
    const weekendTx = expenses.filter((t) => { const d = new Date(t.date).getDay(); return d === 0 || d === 6 })
    const weekdayAvg = weekdayTx.length > 0 ? weekdayTx.reduce((s, t) => s + t.amount, 0) / weekdayTx.length : 0
    const weekendAvg = weekendTx.length > 0 ? weekendTx.reduce((s, t) => s + t.amount, 0) / weekendTx.length : 0

    const insights = await generateInsights({
      totalExpenses, totalIncome, budget: settings?.monthlyBudget ?? 1500,
      byCategory, prevMonthByCategory: prevByCategory,
      avgTransactionAmount: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      weekdayAvg, weekendAvg, transactionCount: last30.length, currency: settings?.currency ?? "AZN",
    })

    return NextResponse.json({ insights, insufficientData: false, count: last30.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка генерации инсайтов" }, { status: 500 })
  }
}
