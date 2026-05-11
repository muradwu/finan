import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { Category, TransactionType } from "@prisma/client"

const createSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("AZN"),
  category: z.nativeEnum(Category),
  description: z.string().min(1),
  date: z.string(),
  type: z.nativeEnum(TransactionType),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const limit = parseInt(searchParams.get("limit") ?? "50")
    const offset = parseInt(searchParams.get("offset") ?? "0")

    const where: Record<string, unknown> = { userId: session.user.id }

    if (category) {
      const cats = category.split(",").filter(Boolean)
      if (cats.length > 0) where.category = { in: cats as Category[] }
    }
    if (type) where.type = type as TransactionType
    if (search) where.description = { contains: search, mode: "insensitive" }
    if (from || to) {
      where.date = {}
      if (from) (where.date as Record<string, unknown>).gte = new Date(from)
      if (to) (where.date as Record<string, unknown>).lte = new Date(to)
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({ where, orderBy: { date: "desc" }, take: limit, skip: offset }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({ items, total })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка загрузки транзакций" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const tx = await prisma.transaction.create({
      data: { ...data, date: new Date(data.date), userId: session.user.id },
    })

    return NextResponse.json(tx, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Неверный формат данных", details: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Ошибка создания транзакции" }, { status: 500 })
  }
}
