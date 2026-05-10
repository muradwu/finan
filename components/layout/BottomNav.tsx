"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, History, Lightbulb, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/",         label: "Дашборд",   icon: LayoutDashboard },
  { href: "/history",  label: "История",   icon: History },
  { href: "/insights", label: "Инсайты",   icon: Lightbulb },
  { href: "/settings", label: "Настройки", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/80 backdrop-blur-md border-t border-border safe-area-bottom"
      aria-label="Мобильная навигация"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center px-3 rounded-lg transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
