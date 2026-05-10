import { NextRequest, NextResponse } from "next/server"
import { parseTransaction } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bodySchema = z.object({ text: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text } = bodySchema.parse(body)

    const result = await parseTransaction(text)

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Текст не может быть пустым" }, { status: 400 })
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "AI не смог распарсить текст" }, { status: 422 })
    }
    console.error(err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Ошибка AI-обработки", detail: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { originalText, aiResult, correctedResult } = body

    await prisma.aICorrection.create({
      data: {
        originalText,
        aiResult,
        correctedResult,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Ошибка сохранения коррекции" }, { status: 500 })
  }
}
