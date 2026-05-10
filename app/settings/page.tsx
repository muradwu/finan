"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Download, FileText, Trash2, Moon, Sun, Monitor, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { QuickAddProvider } from "@/components/layout/QuickAddProvider"
import { formatCurrency } from "@/lib/formatters"

interface Settings {
  id: string
  monthlyBudget: number
  currency: string
  theme: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [budget, setBudget] = useState("")
  const [currency, setCurrency] = useState("AZN")
  const [saving, setSaving] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data)
        setBudget(String(data.monthlyBudget))
        setCurrency(data.currency)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyBudget: parseFloat(budget),
          currency,
          theme: theme ?? "system",
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSettings(data)
      toast.success("Настройки сохранены")
    } catch {
      toast.error("Не удалось сохранить настройки")
    } finally {
      setSaving(false)
    }
  }

  const handleExportCsv = async () => {
    setExportingCsv(true)
    try {
      const res = await fetch("/api/export/csv")
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `finan-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV экспортирован")
    } catch {
      toast.error("Ошибка экспорта CSV")
    } finally {
      setExportingCsv(false)
    }
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      const res = await fetch("/api/transactions?limit=500")
      if (!res.ok) throw new Error()
      const { items } = await res.json()

      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text("Finan — Отчёт о транзакциях", 14, 22)
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Сформирован: ${new Date().toLocaleDateString("ru-RU")}`, 14, 30)

      autoTable(doc, {
        startY: 36,
        head: [["Дата", "Описание", "Категория", "Сумма", "Тип"]],
        body: items.map((t: { date: string; description: string; category: string; amount: number; currency: string; type: string }) => [
          new Date(t.date).toLocaleDateString("ru-RU"),
          t.description,
          t.category,
          `${t.type === "expense" ? "-" : "+"}${t.amount.toFixed(2)} ${t.currency}`,
          t.type === "expense" ? "Расход" : "Доход",
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 73], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      })

      doc.save(`finan-report-${new Date().toISOString().split("T")[0]}.pdf`)
      toast.success("PDF отчёт скачан")
    } catch {
      toast.error("Ошибка создания PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  const handleDeleteAll = async () => {
    const res = await fetch("/api/settings", { method: "DELETE" })
    if (res.ok) {
      toast.success("Все данные удалены")
    } else {
      toast.error("Ошибка удаления данных")
    }
  }

  return (
    <QuickAddProvider>
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-8 max-w-2xl mx-auto">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
          </header>

          {/* Budget & Currency */}
          <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-semibold">Бюджет и валюта</h2>

            <div className="space-y-2">
              <Label htmlFor="budget">Месячный бюджет</Label>
              <div className="flex gap-2">
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="tabular-nums"
                  placeholder="1500"
                  min="0"
                />
                <span className="flex items-center text-sm text-muted-foreground px-3">
                  {currency === "AZN" ? "₼" : currency === "USD" ? "$" : "€"}
                </span>
              </div>
              {settings && budget && (
                <p className="text-xs text-muted-foreground">
                  Текущий бюджет: {formatCurrency(settings.monthlyBudget, settings.currency)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-select">Валюта</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency-select" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AZN">₼ AZN (Манат)</SelectItem>
                  <SelectItem value="USD">$ USD (Доллар)</SelectItem>
                  <SelectItem value="EUR">€ EUR (Евро)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : null}
              Сохранить
            </Button>
          </section>

          {/* Theme */}
          <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold">Тема оформления</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Светлая", icon: Sun },
                { value: "dark",  label: "Тёмная",  icon: Moon },
                { value: "system", label: "Системная", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    theme === value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                  }`}
                  aria-pressed={theme === value}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Export */}
          <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold">Экспорт данных</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="flex-1 gap-2"
              >
                {exportingCsv ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                Скачать CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="flex-1 gap-2"
              >
                {exportingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileText className="h-4 w-4" aria-hidden="true" />
                )}
                Скачать PDF
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              CSV открывается в Excel и Google Sheets. PDF — готовый отчёт для печати.
            </p>
          </section>

          {/* Danger zone */}
          <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
            <h2 className="text-base font-semibold text-destructive">Опасная зона</h2>
            <p className="text-sm text-muted-foreground">
              Это удалит все транзакции. Это действие необратимо.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Удалить все данные
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить все транзакции?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это удалит все твои транзакции навсегда. Данные нельзя восстановить.
                    Настройки и бюджет сохранятся.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Удалить все транзакции
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>

          {/* Seed for demo */}
          <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-base font-semibold">Демо-данные</h2>
            <p className="text-sm text-muted-foreground">Заполнить базу 50 тестовыми транзакциями.</p>
            <Button
              variant="outline"
              onClick={async () => {
                const res = await fetch("/api/seed", { method: "POST" })
                if (res.ok) {
                  const d = await res.json()
                  toast.success(`Загружено ${d.count} транзакций`)
                  window.dispatchEvent(new Event("transaction-added"))
                } else {
                  toast.error("Ошибка загрузки демо-данных")
                }
              }}
            >
              Загрузить демо-данные
            </Button>
          </section>
        </div>
      </div>
    </QuickAddProvider>
  )
}
