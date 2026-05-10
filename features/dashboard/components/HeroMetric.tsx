"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface HeroMetricProps {
  remaining: number
  budget: number
  currentExpenses: number
  currency: string
  daysLeft: number
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const frame = useRef<number | undefined>(undefined)

  useEffect(() => {
    const start = performance.now()
    const startVal = 0

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(startVal + (target - startVal) * eased)
      if (progress < 1) frame.current = requestAnimationFrame(animate)
    }

    frame.current = requestAnimationFrame(animate)
    return () => { if (frame.current) cancelAnimationFrame(frame.current) }
  }, [target, duration])

  return value
}

export function HeroMetric({ remaining, budget, currentExpenses, currency, daysLeft }: HeroMetricProps) {
  const pct = budget > 0 ? Math.min((currentExpenses / budget) * 100, 100) : 0
  const animatedRemaining = useCountUp(Math.abs(remaining))

  const status =
    pct >= 100 ? "danger" :
    pct >= 80  ? "warning" :
    "success"

  const statusConfig = {
    success: {
      label:    "Остаётся в бюджете",
      color:    "text-emerald-600 dark:text-emerald-400",
      barClass: "bg-emerald-500",
    },
    warning: {
      label:    "Осталось в бюджете",
      color:    "text-amber-600 dark:text-amber-400",
      barClass: "bg-amber-500",
    },
    danger: {
      label:    "Бюджет превышен на",
      color:    "text-red-600 dark:text-red-400",
      barClass: "bg-red-500",
    },
  }[status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
    >
      <p className="text-sm font-medium text-muted-foreground">{statusConfig.label}</p>

      <div className={cn("tabular-nums font-mono font-semibold tracking-tight text-4xl md:text-5xl", statusConfig.color)}>
        {remaining < 0 && <span className="text-3xl">−</span>}
        {formatCurrency(animatedRemaining, currency)}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(pct)}% от бюджета</span>
          <span>{formatCurrency(budget, currency)}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className={cn("h-full rounded-full", statusConfig.barClass)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {daysLeft > 0
          ? `${daysLeft} ${daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"} до конца месяца`
          : "Последний день месяца"}
      </p>
    </motion.div>
  )
}
