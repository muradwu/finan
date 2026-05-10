import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface AmountDisplayProps {
  amount: number
  currency?: string
  type?: "expense" | "income" | "neutral"
  size?: "sm" | "md" | "lg" | "xl" | "hero"
  className?: string
  showSign?: boolean
}

const sizeClasses = {
  sm:   "text-sm",
  md:   "text-base",
  lg:   "text-xl",
  xl:   "text-2xl",
  hero: "text-4xl font-semibold",
}

export function AmountDisplay({
  amount,
  currency = "AZN",
  type = "neutral",
  size = "md",
  className,
  showSign = false,
}: AmountDisplayProps) {
  const colorClass =
    type === "income"  ? "text-emerald-600 dark:text-emerald-400" :
    type === "expense" ? "text-foreground" :
    "text-foreground"

  const sign = showSign ? (type === "expense" ? "−" : type === "income" ? "+" : "") : ""

  return (
    <span
      className={cn(
        "tabular-nums font-mono tracking-tight",
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {sign}{formatCurrency(amount, currency)}
    </span>
  )
}
