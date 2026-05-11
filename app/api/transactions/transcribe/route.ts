import { NextRequest, NextResponse } from "next/server"
import { openai } from "@/lib/openai"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: "Аудио не передано" }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      // No language specified — Whisper auto-detects Russian/Azerbaijani
    })

    return NextResponse.json({ text: transcription.text })
  } catch (err) {
    console.error("Transcription error:", err)
    return NextResponse.json({ error: "Не удалось распознать речь" }, { status: 500 })
  }
}
