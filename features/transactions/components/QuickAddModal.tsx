"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, AlertCircle, Check } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CategoryBadge } from "@/components/shared/CategoryBadge"
import { AmountDisplay } from "@/components/shared/AmountDisplay"
import { CATEGORY_OPTIONS, CategoryKey } from "@/lib/categories"
import { transactionSchema, TransactionFormValues } from "../schema"
import { formatDate } from "@/lib/formatters"

interface QuickAddModalProps {
  open: boolean
  onClose: () => void
}

type ParsedData = TransactionFormValues & { _parsed?: boolean }

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const [aiText, setAiText] = useState("")
  const [aiState, setAiState] = useState<"idle" | "loading" | "preview" | "error">("idle")
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [originalText, setOriginalText] = useState("")
  const [slowTimeout, setSlowTimeout] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as never,
    defaultValues: { currency: "AZN", type: "expense", date: new Date().toISOString().split("T")[0] },
  })

  const watchedValues = watch()

  const handleAIParse = async () => {
    if (!aiText.trim()) return
    setAiState("loading")
    setSlowTimeout(false)
    setOriginalText(aiText)

    timeoutRef.current = setTimeout(() => setSlowTimeout(true), 3000)
    const abortTimeout = setTimeout(() => {
      clearTimeout(timeoutRef.current)
      setAiState("error")
      toast.error("Превышено время ожидания AI. Заполните форму вручную.")
    }, 10000)

    try {
      const res = await fetch("/api/transactions/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      })

      clearTimeout(timeoutRef.current)
      clearTimeout(abortTimeout)

      if (!res.ok) throw new Error("Parse failed")
      const data = await res.json()

      const parsedData: ParsedData = {
        amount: data.amount,
        currency: data.currency ?? "AZN",
        category: data.category,
        description: data.description,
        date: data.date ?? new Date().toISOString().split("T")[0],
        type: data.type,
        _parsed: true,
      }

      setParsed(parsedData)
      Object.entries(parsedData).forEach(([key, val]) => {
        if (key !== "_parsed") setValue(key as keyof TransactionFormValues, val as string)
      })
      setAiState("preview")
    } catch {
      clearTimeout(timeoutRef.current)
      clearTimeout(abortTimeout)
      setAiState("error")
    }
  }

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error()

      if (parsed?._parsed && aiState === "preview") {
        const corrected = { amount: data.amount, currency: data.currency, category: data.category, description: data.description }
        const ai = { amount: parsed.amount, currency: parsed.currency, category: parsed.category, description: parsed.description }
        if (JSON.stringify(corrected) !== JSON.stringify(ai)) {
          fetch("/api/transactions/parse", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ originalText, aiResult: ai, correctedResult: corrected }),
          }).catch(() => {})
        }
      }

      toast.success("Транзакция добавлена", {
        description: `${data.type === "expense" ? "Расход" : "Доход"}: ${data.description}`,
      })
      handleClose()
      window.dispatchEvent(new Event("transaction-added"))
    } catch {
      toast.error("Не удалось сохранить транзакцию")
    }
  }

  const handleClose = () => {
    setAiText("")
    setAiState("idle")
    setParsed(null)
    setSlowTimeout(false)
    clearTimeout(timeoutRef.current)
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl font-semibold">Добавить транзакцию</DialogTitle>

        <div className="space-y-4">
          {/* AI Input */}
          <AnimatePresence mode="wait">
            {aiState !== "preview" ? (
              <motion.div
                key="ai-input"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <Label htmlFor="ai-text">Опиши транзакцию</Label>
                <div className="flex gap-2">
                  <Input
                    id="ai-text"
                    ref={inputRef}
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Например: потратил 12 на кофе"
                    onKeyDown={(e) => e.key === "Enter" && handleAIParse()}
                    disabled={aiState === "loading"}
                    aria-describedby="ai-hint"
                  />
                  <Button
                    type="button"
                    onClick={handleAIParse}
                    disabled={!aiText.trim() || aiState === "loading"}
                    className="shrink-0"
                    aria-label="Обработать AI"
                  >
                    {aiState === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <p id="ai-hint" className="text-xs text-muted-foreground">
                  Нажми Enter или кнопку — AI распознает сумму, категорию и дату
                </p>

                {aiState === "loading" && slowTimeout && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Это занимает дольше обычного...
                  </p>
                )}

                {aiState === "error" && (
                  <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    AI не смог распознать. Заполни форму вручную ниже.
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="ai-preview"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <span className="text-sm text-primary font-medium">AI распознал транзакцию</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 text-xs"
                  onClick={() => setAiState("idle")}
                >
                  Изменить
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview / Manual Form */}
          <AnimatePresence>
            {(aiState === "preview" || aiState === "error") && (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit(onSubmit as never)}
                className="space-y-4"
              >
                {aiState === "preview" && parsed && (
                  <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <CategoryBadge category={parsed.category as CategoryKey} />
                      <AmountDisplay amount={parsed.amount} currency={parsed.currency} type={parsed.type} size="lg" />
                    </div>
                    <p className="text-sm text-foreground">{parsed.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(parsed.date)}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="amount">Сумма</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register("amount", { valueAsNumber: true })}
                      className="tabular-nums"
                      aria-describedby={errors.amount ? "amount-error" : undefined}
                    />
                    {errors.amount && (
                      <p id="amount-error" className="text-xs text-destructive" role="alert">{errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="type-select">Тип</Label>
                    <Select
                      value={watchedValues.type}
                      onValueChange={(v) => setValue("type", v as "expense" | "income")}
                    >
                      <SelectTrigger id="type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Расход</SelectItem>
                        <SelectItem value="income">Доход</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">Описание</Label>
                  <Input
                    id="description"
                    placeholder="Что это было?"
                    {...register("description")}
                    aria-describedby={errors.description ? "desc-error" : undefined}
                  />
                  {errors.description && (
                    <p id="desc-error" className="text-xs text-destructive" role="alert">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cat-select">Категория</Label>
                  <Select
                    value={watchedValues.category}
                    onValueChange={(v) => setValue("category", v)}
                  >
                    <SelectTrigger id="cat-select">
                      <SelectValue placeholder="Выбери категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="date">Дата</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register("date")}
                    aria-describedby={errors.date ? "date-error" : undefined}
                  />
                  {errors.date && (
                    <p id="date-error" className="text-xs text-destructive" role="alert">{errors.date.message}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Сохранить"}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
