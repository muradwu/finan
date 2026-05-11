import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finan — Трекер финансов",
    short_name: "Finan",
    description: "Персональный AI-трекер финансов",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    orientation: "portrait",
    icons: [
      { src: "/api/icons/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/api/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/api/icons/512", sizes: "512x512", type: "image/png" },
    ],
  }
}
