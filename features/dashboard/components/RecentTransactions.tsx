import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { CategoryBadge } from "@/components/shared/CategoryBadge"
import { AmountDisplay } from "@/components/shared/AmountDisplay"
import { formatDateShort } from "@/lib/formatters"
import { CategoryKey } from "@/lib/categories"

interface Transaction {
  id: string
  amount: number
  currency: string
  category: string
  description: string
  date: string | Date
  type: string
}

export function RecentTransactions({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Нет транзакций
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {transactions.slice(0, 5).map((tx) => (
        <div
          key={tx.id}
          className="flex items-center gap-3 py-2 px-1"
        >
          <CategoryBadge category={tx.category as CategoryKey} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{tx.description}</p>
            <p className="text-xs text-muted-foreground">{formatDateShort(tx.date)}</p>
          </div>
          <AmountDisplay
            amount={tx.amount}
            currency={tx.currency || currency}
            type={tx.type as "expense" | "income"}
            size="sm"
            showSign={tx.type === "income"}
          />
        </div>
      ))}

      <Link
        href="/history"
        className="flex items-center justify-center gap-1 pt-2 text-sm text-primary hover:underline"
      >
        Все транзакции <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
