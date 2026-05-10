"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import { Search, Filter, X, Trash2, PenLine } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoryBadge } from "@/components/shared/CategoryBadge"
import { AmountDisplay } from "@/components/shared/AmountDisplay"
import { QuickAddProvider } from "@/components/layout/QuickAddProvider"
import { CATEGORY_OPTIONS, CategoryKey } from "@/lib/categories"
import { formatDate } from "@/lib/formatters"

interface Transaction {
  id: string
  amount: number
  currency: string
  category: string
  description: string
  date: string
  type: string
}

function groupByDate(items: Transaction[]) {
  const groups: Record<string, Transaction[]> = {}
  for (const t of items) {
    const key = new Date(t.date).toISOString().split("T")[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

function TransactionRow({
  tx,
  onDelete,
}: {
  tx: Transaction
  onDelete: (id: string, desc: string) => void
}) {
  const [swiped, setSwiped] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      transition={{ duration: 0.2 }}
      className="relative group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
    >
      <CategoryBadge category={tx.category as CategoryKey} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tx.description}</p>
        <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
      </div>
      <AmountDisplay
        amount={tx.amount}
        currency={tx.currency}
        type={tx.type as "expense" | "income"}
        showSign={tx.type === "income"}
        size="sm"
      />
      <button
        onClick={() => onDelete(tx.id, tx.description)}
        className="hidden group-hover:flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        aria-label={`Удалить транзакцию ${tx.description}`}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </motion.div>
  )
}

function HistoryContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("all")
  const [category, setCategory] = useState("all")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; desc: string } | null>(null)
  const [currency, setCurrency] = useState("AZN")
  const offset = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchTransactions = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true)
      offset.current = 0
    }
    const params = new URLSearchParams({ limit: "30", offset: String(reset ? 0 : offset.current) })
    if (search) params.set("search", search)
    if (type !== "all") params.set("type", type)
    if (category !== "all") params.set("category", category)

    const res = await fetch(`/api/transactions?${params}`)
    if (!res.ok) return
    const data = await res.json()

    setTransactions(reset ? data.items : (prev) => [...prev, ...data.items])
    setTotal(data.total)
    offset.current = (reset ? 0 : offset.current) + data.items.length

    const settingsRes = await fetch("/api/settings")
    if (settingsRes.ok) {
      const s = await settingsRes.json()
      setCurrency(s.currency ?? "AZN")
    }
    setLoading(false)
  }, [search, type, category])

  useEffect(() => {
    const t = setTimeout(() => fetchTransactions(true), 200)
    return () => clearTimeout(t)
  }, [fetchTransactions])

  useEffect(() => {
    const handleAdded = () => fetchTransactions(true)
    window.addEventListener("transaction-added", handleAdded)
    return () => window.removeEventListener("transaction-added", handleAdded)
  }, [fetchTransactions])

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
    if (res.ok) {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      setTotal((prev) => prev - 1)
      toast.success("Транзакция удалена")
    } else {
      toast.error("Не удалось удалить")
    }
    setDeleteTarget(null)
  }

  const grouped = groupByDate(transactions)
  const totalAmount = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">История</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} транзакций
            </p>
          )}
        </header>

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Поиск по описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Поиск транзакций"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-36" aria-label="Фильтр по типу">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="expense">Расходы</SelectItem>
                <SelectItem value="income">Доходы</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40" aria-label="Фильтр по категории">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || type !== "all" || category !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setType("all"); setCategory("all") }}
                className="gap-1"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Сбросить
              </Button>
            )}
          </div>
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="space-y-2" role="status" aria-label="Загрузка...">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center" role="status">
            <Filter className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {search || type !== "all" || category !== "all"
                ? "Нет транзакций по выбранным фильтрам"
                : "Нет транзакций. Добавь первую с помощью кнопки +"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-6">
              {grouped.map(([date, items]) => (
                <div key={date}>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 sticky top-0 bg-background py-1">
                    {formatDate(date)}
                  </h2>
                  <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                    {items.map((tx) => (
                      <TransactionRow key={tx.id} tx={tx} onDelete={(id, desc) => setDeleteTarget({ id, desc })} />
                    ))}
                  </div>
                </div>
              ))}

              {transactions.length < total && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fetchTransactions(false)}
                >
                  Загрузить ещё
                </Button>
              )}
            </div>
          </AnimatePresence>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить транзакцию?</AlertDialogTitle>
            <AlertDialogDescription>
              &laquo;{deleteTarget?.desc}&raquo; будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить транзакцию
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <QuickAddProvider>
      <Suspense>
        <HistoryContent />
      </Suspense>
    </QuickAddProvider>
  )
}
