"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, AlertCircle, Check, Camera } from "lucide-react"
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
import type { ReceiptAnalysis } from "@/lib/openai"

interface QuickAddModalProps {
  open: boolean
  onClose: () => void
}

type ParsedData = TransactionFormValues & { _parsed?: boolean }

interface Account { id: string; name: string; type: string }

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const [aiText, setAiText] = useState("")
  const [aiState, setAiState] = useState<"idle" | "loading" | "preview" | "receipt-analysis" | "error">("idle")
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [originalText, setOriginalText] = useState("")
  const [slowTimeout, setSlowTimeout] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [receiptPreview, setReceiptPreview] = useState<string>("")
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptAnalysis | null>(null)
  const [selectedItems, setSelectedItems] = useState<boolean[]>([])
  const [isAddingItems, setIsAddingItems] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      fetch("/api/accounts").then((r) => r.json()).then((data) => {
        if (Array.isArray(data)) setAccounts(data)
      }).catch(() => {})
    }
  }, [open])

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

  const handleReceiptPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setReceiptLoading(true)
    setAiState("loading")
    setSlowTimeout(false)
    timeoutRef.current = setTimeout(() => setSlowTimeout(true), 5000)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const canvas = document.createElement("canvas")
        const img = new Image()
        img.onload = () => {
          const maxSize = 1600
          let { width, height } = img
          if (width > maxSize || height > maxSize) {
            if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize }
            else { width = Math.round((width * maxSize) / height); height = maxSize }
          }
          canvas.width = width; canvas.height = height
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.92))
        }
        img.onerror = reject
        img.src = URL.createObjectURL(file)
      })

      setReceiptPreview(base64)

      const res = await fetch("/api/transactions/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      })

      clearTimeout(timeoutRef.current)

      if (!res.ok) throw new Error("Receipt parse failed")
      const data: ReceiptAnalysis = await res.json()

      setReceiptData(data)
      setSelectedItems(data.items.map(() => true))
      setAiState("receipt-analysis")
    } catch {
      clearTimeout(timeoutRef.current)
      setAiState("error")
      toast.error("Не удалось распознать чек. Заполните форму вручную.")
    } finally {
      setReceiptLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const toggleItem = (index: number) => {
    setSelectedItems(prev => prev.map((v, i) => i === index ? !v : v))
  }

  const handleAddSelected = async () => {
    if (!receiptData) return
    const itemsToAdd = receiptData.items.filter((_, i) => selectedItems[i])
    if (itemsToAdd.length === 0) return

    setIsAddingItems(true)
    try {
      const results = await Promise.allSettled(
        itemsToAdd.map(item =>
          fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: item.amount,
              currency: receiptData.currency,
              category: item.category,
              description: item.description,
              date: receiptData.date,
              type: "expense",
              ...(selectedAccountId ? { accountId: selectedAccountId } : {}),
            }),
          })
        )
      )

      const succeeded = results.filter(r => r.status === "fulfilled").length
      if (succeeded > 0) {
        toast.success(
          succeeded === 1 ? "Транзакция добавлена" : `Добавлено транзакций: ${succeeded}`,
          { description: `${receiptData.merchant} · ${receiptData.receiptType}` }
        )
        handleClose()
        window.dispatchEvent(new Event("transaction-added"))
      } else {
        toast.error("Не удалось сохранить транзакции")
      }
    } finally {
      setIsAddingItems(false)
    }
  }

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...(selectedAccountId ? { accountId: selectedAccountId } : {}) }),
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
    setSelectedAccountId("")
    setReceiptPreview("")
    setReceiptData(null)
    setSelectedItems([])
    clearTimeout(timeoutRef.current)
    reset()
    onClose()
  }

  const selectedCount = selectedItems.filter(Boolean).length
  const selectedTotal = receiptData
    ? receiptData.items.filter((_, i) => selectedItems[i]).reduce((sum, item) => sum + item.amount, 0)
    : 0

  const AccountSelector = ({ id }: { id: string }) => (
    <div className="space-y-1">
      <Label htmlFor={id}>Счёт <span className="text-muted-foreground font-normal">(необязательно)</span></Label>
      {accounts.length > 0 ? (
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Не указан" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Не указан</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-xs text-muted-foreground">
          Нет счетов.{" "}
          <a href="/" className="underline text-primary" onClick={handleClose}>Добавить счёт</a>
        </p>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl font-semibold">Добавить транзакцию</DialogTitle>

        <div className="space-y-4">
          {/* AI Input — shown when idle / loading / error */}
          <AnimatePresence mode="wait">
            {aiState !== "preview" && aiState !== "receipt-analysis" ? (
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleReceiptPhoto}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={aiState === "loading"}
                    className="shrink-0"
                    aria-label="Сфотографировать чек"
                  >
                    {receiptLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Camera className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAIParse}
                    disabled={!aiText.trim() || aiState === "loading"}
                    className="shrink-0"
                    aria-label="Обработать AI"
                  >
                    {aiState === "loading" && !receiptLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
                <p id="ai-hint" className="text-xs text-muted-foreground">
                  Напиши или сфотографируй чек — AI распознает расходы
                </p>

                {aiState === "loading" && slowTimeout && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Анализируем чек, это может занять несколько секунд...
                  </p>
                )}

                {aiState === "error" && (
                  <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Не удалось распознать. Заполни форму вручную ниже.
                  </div>
                )}
              </motion.div>
            ) : aiState === "preview" ? (
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
            ) : null}
          </AnimatePresence>

          {/* Receipt Analysis Screen */}
          <AnimatePresence>
            {aiState === "receipt-analysis" && receiptData && (
              <motion.div
                key="receipt-analysis"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                  {receiptPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={receiptPreview}
                      alt="Чек"
                      className="w-10 h-14 object-cover rounded-md border border-border shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{receiptData.merchant}</p>
                    <p className="text-xs text-muted-foreground">{receiptData.receiptType}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(receiptData.date)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-7 text-xs"
                    onClick={() => { setAiState("idle"); setReceiptData(null); setReceiptPreview("") }}
                  >
                    Изменить
                  </Button>
                </div>

                {/* Items checklist */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-0.5">
                    Выбери позиции для добавления
                  </p>
                  {receiptData.items.map((item, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors select-none ${
                        selectedItems[i]
                          ? "bg-primary/5 border-primary/30"
                          : "border-border bg-transparent opacity-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems[i] ?? false}
                        onChange={() => toggleItem(i)}
                        className="w-4 h-4 shrink-0 accent-primary rounded"
                      />
                      <CategoryBadge category={item.category as CategoryKey} />
                      <span className="text-sm flex-1 min-w-0 truncate">{item.description}</span>
                      <span className="text-sm font-medium tabular-nums shrink-0 text-foreground">
                        {item.amount.toFixed(2)} {receiptData.currency}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Summary row */}
                <div className="flex items-center justify-between px-1 py-1.5 border-t text-sm">
                  <span className="text-muted-foreground">
                    Выбрано: {selectedCount} из {receiptData.items.length}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {selectedTotal.toFixed(2)} {receiptData.currency}
                  </span>
                </div>

                <AccountSelector id="account-select-receipt" />

                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddSelected}
                    disabled={selectedCount === 0 || isAddingItems}
                    className="flex-1"
                  >
                    {isAddingItems
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : `Добавить (${selectedCount})`
                    }
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual / Text-AI Form */}
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

                <AccountSelector id="account-select" />

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
