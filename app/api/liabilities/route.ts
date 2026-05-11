import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { LiabilityType } from "@prisma/client"

const createSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(LiabilityType),
  totalAmount: z.number().positive(),
  remaining: z.number().min(0),
  currency: z.string().default("AZN"),
  monthlyPayment: z.number().optional(),
  interestRate: z.number().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const liabilities = await prisma.liability.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(liabilities)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const data = createSchema.parse(await req.json())
    const liability = await prisma.liability.create({
      data: { ...data, userId: session.user.id },
    })
    return NextResponse.json(liability, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: "Ошибка создания обязательства" }, { status: 500 })
  }
}
