import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { AccountType } from "@prisma/client"

const createSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AccountType),
  balance: z.number().default(0),
  currency: z.string().default("AZN"),
  color: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const account = await prisma.account.create({
      data: { ...data, userId: session.user.id },
    })
    return NextResponse.json(account, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: "Ошибка создания счёта" }, { status: 500 })
  }
}
