import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Category, TransactionType } from "@prisma/client"

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  category: z.nativeEnum(Category).optional(),
  description: z.string().min(1).optional(),
  date: z.string().optional(),
  type: z.nativeEnum(TransactionType).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)

    const tx = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        ...(data.date ? { date: new Date(data.date) } : {}),
      },
    })

    return NextResponse.json(tx)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 })
  }
}
