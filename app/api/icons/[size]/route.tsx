import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  const px = parseInt(size) || 512
  const radius = Math.round(px * 0.18)
  const fontSize = Math.round(px * 0.55)

  return new ImageResponse(
    <div style={{ width: px, height: px, background: "#16a34a", borderRadius: radius, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "white", fontSize, fontWeight: 700, fontFamily: "sans-serif" }}>F</div>
    </div>,
    { width: px, height: px }
  )
}
