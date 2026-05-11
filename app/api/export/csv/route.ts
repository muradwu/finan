import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CATEGORIES, CategoryKey } from "@/lib/categories"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where: Record<string, unknown> = { userId: session.user.id }
    if (from || to) {
      where.date = {}
      if (from) (where.date as Record<string, unknown>).gte = new Date(from)
      if (to) (where.date as Record<string, unknown>).lte = new Date(to)
    }

    const transactions = await prisma.transaction.findMany({ where, orderBy: { date: "desc" } })

    const headers = ["Дата", "Описание", "Категория", "Сумма", "Валюта", "Тип"]
    const rows = transactions.map((t) => [
      new Date(t.date).toLocaleDateString("ru-RU"),
      `"${t.description.replace(/"/g, '""')}"`,
      CATEGORIES[t.category as CategoryKey]?.label ?? t.category,
      t.type === "expense" ? `-${t.amount.toFixed(2)}` : t.amount.toFixed(2),
      t.currency,
      t.type === "expense" ? "Расход" : "Доход",
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")

    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="finan-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка экспорта" }, { status: 500 })
  }
}
