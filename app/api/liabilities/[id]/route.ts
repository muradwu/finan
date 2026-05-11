import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { LiabilityType } from "@prisma/client"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(LiabilityType).optional(),
  totalAmount: z.number().positive().optional(),
  remaining: z.number().min(0).optional(),
  currency: z.string().optional(),
  monthlyPayment: z.number().optional(),
  interestRate: z.number().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const data = updateSchema.parse(await req.json())
    const liability = await prisma.liability.update({
      where: { id, userId: session.user.id },
      data,
    })
    return NextResponse.json(liability)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.liability.delete({ where: { id, userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 })
  }
}
