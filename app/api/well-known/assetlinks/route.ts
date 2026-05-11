import { NextResponse } from "next/server"

// Этот файл будет обновлён после генерации TWA через pwabuilder.com
// sha256_cert_fingerprints берётся из Google Play Console
export async function GET() {
  const links = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.finan.app",
        sha256_cert_fingerprints: ["PLACEHOLDER"],
      },
    },
  ]
  return NextResponse.json(links, {
    headers: { "Content-Type": "application/json" },
  })
}
