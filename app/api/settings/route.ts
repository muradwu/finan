import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  monthlyBudget: z.number().positive().optional(),
  currency: z.string().optional(),
  theme: z.string().optional(),
})

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({
        data: { monthlyBudget: 1500, currency: "AZN", theme: "system" },
      })
    }
    return NextResponse.json(settings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка загрузки настроек" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    let settings = await prisma.settings.findFirst()
    if (!settings) {
      settings = await prisma.settings.create({
        data: { monthlyBudget: 1500, currency: "AZN", theme: "system", ...data },
      })
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data,
      })
    }

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
  try {
    await prisma.transaction.deleteMany()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка очистки данных" }, { status: 500 })
  }
}
