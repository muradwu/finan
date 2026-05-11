import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"

const updateSchema = z.object({
  monthlyBudget: z.number().positive().optional(),
  currency: z.string().optional(),
  theme: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  try {
    let settings = await prisma.settings.findUnique({ where: { userId } })
    if (!settings) {
      settings = await prisma.settings.create({ data: { userId, monthlyBudget: 1500, currency: "AZN", theme: "system" } })
    }
    return NextResponse.json(settings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка загрузки настроек" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: data,
      create: { userId, monthlyBudget: 1500, currency: "AZN", theme: "system", ...data },
    })

    return NextResponse.json(settings)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Ошибка сохранения настроек" }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await prisma.transaction.deleteMany({ where: { userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка очистки данных" }, { status: 500 })
  }
}
