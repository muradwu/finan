"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BarChart2, History, Lightbulb, Settings, TrendingUp, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { signOut, useSession } from "next-auth/react"

const links = [
  { href: "/",           label: "Дашборд",   icon: LayoutDashboard },
  { href: "/analytics",  label: "Аналитика", icon: BarChart2 },
  { href: "/history",    label: "История",   icon: History },
  { href: "/insights",   label: "Инсайты",   icon: Lightbulb },
  { href: "/settings",   label: "Настройки", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg tracking-tight">Finan</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1" aria-label="Основная навигация">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
              aria-current={active ? "page" : undefined}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {session?.user && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{session.user.name ?? session.user.email}</span>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Выйти">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </aside>
  )
}
