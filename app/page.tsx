"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Wallet, Banknote, PiggyBank, CreditCard, Landmark, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { QuickAddProvider } from "@/components/layout/QuickAddProvider"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type AccountType = "checking" | "cash" | "deposit" | "credit_card"
type LiabilityType = "loan" | "mortgage" | "credit_card" | "other"

interface Account {
  id: string; name: string; type: AccountType; balance: number; currency: string; color: string | null
}
interface Liability {
  id: string; name: string; type: LiabilityType; totalAmount: number; remaining: number
  currency: string; monthlyPayment: number | null; interestRate: number | null
}

const ACCOUNT_TYPES: Record<AccountType, { label: string; icon: React.ElementType; color: string }> = {
  checking:    { label: "Текущий счёт",    icon: Landmark,   color: "#3B82F6" },
  cash:        { label: "Наличные",        icon: Banknote,   color: "#10B981" },
  deposit:     { label: "Вклад / Депозит", icon: PiggyBank,  color: "#8B5CF6" },
  credit_card: { label: "Кредитная карта", icon: CreditCard, color: "#F59E0B" },
}
const LIABILITY_TYPES: Record<LiabilityType, { label: string }> = {
  loan: { label: "Кредит" }, mortgage: { label: "Ипотека" },
  credit_card: { label: "Кредитная карта" }, other: { label: "Другое" },
}

function NetWorthCard({ assets, liabilities, currency }: { assets: number; liabilities: number; currency: string }) {
  const net = assets - liabilities
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-sm font-medium text-muted-foreground">Чистый капитал</p>
      <div className={cn("text-4xl font-mono font-semibold tabular-nums", net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
        {net < 0 && <span className="text-3xl">−</span>}{formatCurrency(Math.abs(net), currency)}
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Активы</p>
          <p className="text-lg font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(assets, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Пассивы</p>
          <p className="text-lg font-mono font-semibold text-red-500 tabular-nums">{formatCurrency(liabilities, currency)}</p>
        </div>
      </div>
    </motion.div>
  )
}

function AccountCard({ account, onDelete, onEdit }: { account: Account; onDelete: () => void; onEdit: () => void }) {
  const cfg = ACCOUNT_TYPES[account.type]
  const Icon = cfg.icon
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: (account.color ?? cfg.color) + "20" }}>
        <Icon className="h-5 w-5" style={{ color: account.color ?? cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{account.name}</p>
        <p className="text-xs text-muted-foreground">{cfg.label}</p>
      </div>
      <p className={cn("font-mono font-semibold tabular-nums text-sm", account.balance >= 0 ? "text-foreground" : "text-red-500")}>
        {account.balance < 0 && "−"}{formatCurrency(Math.abs(account.balance), account.currency)}
      </p>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Удалить счёт?</AlertDialogTitle><AlertDialogDescription>«{account.name}» будет удалён. Транзакции останутся.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  )
}

function LiabilityCard({ liability, onDelete, onEdit }: { liability: Liability; onDelete: () => void; onEdit: () => void }) {
  const pct = liability.totalAmount > 0 ? Math.min((liability.remaining / liability.totalAmount) * 100, 100) : 0
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
      className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0"><CreditCard className="h-5 w-5 text-red-500" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm truncate">{liability.name}</p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
              <AlertDialog>
                <AlertDialogTrigger asChild><button className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Удалить?</AlertDialogTitle><AlertDialogDescription>«{liability.name}» будет удалено без возможности восстановления.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{LIABILITY_TYPES[liability.type].label}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Остаток</span>
              <span>{formatCurrency(liability.remaining, liability.currency)} из {formatCurrency(liability.totalAmount, liability.currency)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div className="h-full rounded-full bg-red-500" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
            </div>
          </div>
          {liability.monthlyPayment && <p className="text-xs text-muted-foreground mt-1">Платёж: {formatCurrency(liability.monthlyPayment, liability.currency)}/мес{liability.interestRate ? ` · ${liability.interestRate}%` : ""}</p>}
        </div>
      </div>
    </motion.div>
  )
}

function AddAccountModal({ open, onClose, onSaved, editData }: { open: boolean; onClose: () => void; onSaved: () => void; editData?: Account | null }) {
  const [name, setName] = useState(""); const [type, setType] = useState<AccountType>("checking")
  const [balance, setBalance] = useState("0"); const [currency, setCurrency] = useState("AZN"); const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (editData) { setName(editData.name); setType(editData.type); setBalance(String(editData.balance)); setCurrency(editData.currency) }
    else { setName(""); setType("checking"); setBalance("0"); setCurrency("AZN") }
  }, [editData, open])
  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(editData ? `/api/accounts/${editData.id}` : "/api/accounts", {
        method: editData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, balance: parseFloat(balance) || 0, currency }),
      })
      if (!res.ok) throw new Error()
      toast.success(editData ? "Счёт обновлён" : "Счёт добавлен")
      onSaved(); onClose()
    } catch { toast.error("Ошибка сохранения") } finally { setLoading(false) }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>{editData ? "Редактировать счёт" : "Добавить счёт"}</DialogTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-1"><Label>Название</Label><Input placeholder="Kapital Bank" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label>Тип</Label>
            <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(ACCOUNT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Баланс</Label><Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} className="tabular-nums" /></div>
            <div className="space-y-1"><Label>Валюта</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="AZN">₼ AZN</SelectItem><SelectItem value="USD">$ USD</SelectItem><SelectItem value="EUR">€ EUR</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Отмена</Button>
            <Button onClick={handleSave} disabled={loading || !name.trim()} className="flex-1">Сохранить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddLiabilityModal({ open, onClose, onSaved, editData }: { open: boolean; onClose: () => void; onSaved: () => void; editData?: Liability | null }) {
  const [name, setName] = useState(""); const [type, setType] = useState<LiabilityType>("loan")
  const [totalAmount, setTotalAmount] = useState(""); const [remaining, setRemaining] = useState("")
  const [monthlyPayment, setMonthlyPayment] = useState(""); const [interestRate, setInterestRate] = useState("")
  const [currency, setCurrency] = useState("AZN"); const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (editData) {
      setName(editData.name); setType(editData.type); setTotalAmount(String(editData.totalAmount))
      setRemaining(String(editData.remaining)); setCurrency(editData.currency)
      setMonthlyPayment(editData.monthlyPayment ? String(editData.monthlyPayment) : "")
      setInterestRate(editData.interestRate ? String(editData.interestRate) : "")
    } else { setName(""); setType("loan"); setTotalAmount(""); setRemaining(""); setMonthlyPayment(""); setInterestRate(""); setCurrency("AZN") }
  }, [editData, open])
  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(editData ? `/api/liabilities/${editData.id}` : "/api/liabilities", {
        method: editData ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, type, currency, totalAmount: parseFloat(totalAmount), remaining: parseFloat(remaining),
          ...(monthlyPayment ? { monthlyPayment: parseFloat(monthlyPayment) } : {}),
          ...(interestRate ? { interestRate: parseFloat(interestRate) } : {}),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(editData ? "Обновлено" : "Добавлено")
      onSaved(); onClose()
    } catch { toast.error("Ошибка сохранения") } finally { setLoading(false) }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>{editData ? "Редактировать" : "Добавить обязательство"}</DialogTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-1"><Label>Название</Label><Input placeholder="Автокредит" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label>Тип</Label>
            <Select value={type} onValueChange={(v) => setType(v as LiabilityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(LIABILITY_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Сумма долга</Label><Input type="number" step="0.01" placeholder="10000" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="tabular-nums" /></div>
            <div className="space-y-1"><Label>Остаток</Label><Input type="number" step="0.01" placeholder="8500" value={remaining} onChange={(e) => setRemaining(e.target.value)} className="tabular-nums" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Платёж/мес</Label><Input type="number" step="0.01" placeholder="500" value={monthlyPayment} onChange={(e) => setMonthlyPayment(e.target.value)} className="tabular-nums" /></div>
            <div className="space-y-1"><Label>Ставка %</Label><Input type="number" step="0.1" placeholder="12.5" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="tabular-nums" /></div>
          </div>
          <div className="space-y-1"><Label>Валюта</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="AZN">₼ AZN</SelectItem><SelectItem value="USD">$ USD</SelectItem><SelectItem value="EUR">€ EUR</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Отмена</Button>
            <Button onClick={handleSave} disabled={loading || !name.trim() || !totalAmount || !remaining} className="flex-1">Сохранить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [accountModal, setAccountModal] = useState(false)
  const [liabilityModal, setLiabilityModal] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [editLiability, setEditLiability] = useState<Liability | null>(null)

  const load = () => {
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts).catch(() => {})
    fetch("/api/liabilities").then((r) => r.json()).then(setLiabilities).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const totalAssets = accounts.reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.remaining, 0)
  const currency = accounts[0]?.currency ?? liabilities[0]?.currency ?? "AZN"

  const handleDeleteAccount = async (id: string) => {
    if ((await fetch(`/api/accounts/${id}`, { method: "DELETE" })).ok) { toast.success("Счёт удалён"); load() }
    else toast.error("Ошибка удаления")
  }
  const handleDeleteLiability = async (id: string) => {
    if ((await fetch(`/api/liabilities/${id}`, { method: "DELETE" })).ok) { toast.success("Удалено"); load() }
    else toast.error("Ошибка удаления")
  }

  return (
    <QuickAddProvider>
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
            <p className="text-sm text-muted-foreground">Ваши активы и обязательства</p>
          </header>

          <NetWorthCard assets={totalAssets} liabilities={totalLiabilities} currency={currency} />

          {/* Активы */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div><h2 className="text-base font-semibold">Активы</h2><p className="text-xs text-muted-foreground">Счета и вклады</p></div>
              <div className="flex items-center gap-3">
                {totalAssets > 0 && <span className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(totalAssets, currency)}</span>}
                <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => { setEditAccount(null); setAccountModal(true) }}><Plus className="h-3.5 w-3.5" />Добавить</Button>
              </div>
            </div>
            <AnimatePresence mode="popLayout">
              {accounts.length === 0 ? (
                <motion.div key="empty-acc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-border text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Нет счетов</p>
                  <Button variant="ghost" size="sm" className="mt-2 text-primary" onClick={() => { setEditAccount(null); setAccountModal(true) }}>+ Добавить первый счёт</Button>
                </motion.div>
              ) : accounts.map((acc) => (
                <AccountCard key={acc.id} account={acc} onDelete={() => handleDeleteAccount(acc.id)} onEdit={() => { setEditAccount(acc); setAccountModal(true) }} />
              ))}
            </AnimatePresence>
          </section>

          {/* Пассивы */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div><h2 className="text-base font-semibold">Пассивы</h2><p className="text-xs text-muted-foreground">Кредиты и долги</p></div>
              <div className="flex items-center gap-3">
                {totalLiabilities > 0 && <span className="text-sm font-mono font-semibold text-red-500 tabular-nums">{formatCurrency(totalLiabilities, currency)}</span>}
                <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => { setEditLiability(null); setLiabilityModal(true) }}><Plus className="h-3.5 w-3.5" />Добавить</Button>
              </div>
            </div>
            <AnimatePresence mode="popLayout">
              {liabilities.length === 0 ? (
                <motion.div key="empty-liab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-border text-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Нет обязательств</p>
                  <Button variant="ghost" size="sm" className="mt-2 text-primary" onClick={() => { setEditLiability(null); setLiabilityModal(true) }}>+ Добавить обязательство</Button>
                </motion.div>
              ) : liabilities.map((l) => (
                <LiabilityCard key={l.id} liability={l} onDelete={() => handleDeleteLiability(l.id)} onEdit={() => { setEditLiability(l); setLiabilityModal(true) }} />
              ))}
            </AnimatePresence>
          </section>
        </div>
      </div>

      <AddAccountModal open={accountModal} onClose={() => setAccountModal(false)} onSaved={load} editData={editAccount} />
      <AddLiabilityModal open={liabilityModal} onClose={() => setLiabilityModal(false)} onSaved={load} editData={editLiability} />
    </QuickAddProvider>
  )
}
