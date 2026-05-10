"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, AlertCircle, Lightbulb,
  CheckCircle, PiggyBank, ShoppingCart, BarChart3
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { QuickAddProvider } from "@/components/layout/QuickAddProvider"
import { cn } from "@/lib/utils"

interface Insight {
  title: string
  description: string
  type: "warning" | "info" | "success"
  icon: string
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp, TrendingDown, AlertCircle, Lightbulb,
  CheckCircle, PiggyBank, ShoppingCart, BarChart3,
}

const typeConfig = {
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-100",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-900 dark:text-blue-100",
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-900 dark:text-emerald-100",
  },
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insufficientData, setInsufficientData] = useState(false)
  const [count, setCount] = useState(0)

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/insights")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setInsights(data.insights ?? [])
      setInsufficientData(data.insufficientData)
      setCount(data.count ?? 0)
    } catch {
      setError("Не удалось загрузить инсайты. Проверь подключение и попробуй снова.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  return (
    <QuickAddProvider>
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">Инсайты</h1>
            <p className="text-sm text-muted-foreground mt-0.5">AI-анализ твоих финансов</p>
          </header>

          {loading ? (
            <div className="space-y-4" role="status" aria-live="polite" aria-label="Загрузка инсайтов...">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center" role="alert">
              <AlertCircle className="h-10 w-10 text-destructive/60" aria-hidden="true" />
              <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
              <Button onClick={fetchInsights} variant="outline" size="sm">Повторить</Button>
            </div>
          ) : insufficientData ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center" role="status">
              <BarChart3 className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-medium">Недостаточно данных</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Добавь минимум 20 транзакций, чтобы AI мог генерировать инсайты.
                  Сейчас у тебя {count} транзакций за 30 дней.
                </p>
              </div>
              <Button
                onClick={() => document.dispatchEvent(new Event("open-quick-add"))}
                size="sm"
              >
                Добавить транзакцию
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, i) => {
                const cfg = typeConfig[insight.type]
                const IconComponent = ICONS[insight.icon] ?? Lightbulb
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className={cn("rounded-2xl border p-5 space-y-2", cfg.bg)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("p-2 rounded-full bg-white/60 dark:bg-black/20", cfg.icon)}>
                        <IconComponent className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className={cn("font-semibold text-sm", cfg.title)}>{insight.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                  </motion.div>
                )
              })}

              <Button variant="outline" size="sm" onClick={fetchInsights} className="w-full">
                Обновить инсайты
              </Button>
            </div>
          )}
        </div>
      </div>
    </QuickAddProvider>
  )
}
