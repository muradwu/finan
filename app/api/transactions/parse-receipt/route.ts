import { NextRequest, NextResponse } from "next/server"
import { parseReceiptImageDetailed } from "@/lib/openai"
import { auth } from "@/auth"
import { z } from "zod"

const bodySchema = z.object({
  image: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { image } = bodySchema.parse(body)

    const base64 = image.replace(/^data:image\/[a-z]+;base64,/, "")
    const result = await parseReceiptImageDetailed(base64)

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Изображение не передано" }, { status: 400 })
    }
    console.error(err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Не удалось распознать чек", detail: msg }, { status: 500 })
  }
}
