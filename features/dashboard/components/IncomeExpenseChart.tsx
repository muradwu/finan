"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { formatCurrency, formatDateShort } from "@/lib/formatters"

interface ChartData {
  date: string
  income: number
  expense: number
}

interface IncomeExpenseChartProps {
  data: ChartData[]
  currency: string
}

const CustomTooltip = ({
  active, payload, label, currency,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  currency: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md space-y-1 min-w-[140px]">
      <p className="text-xs text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm tabular-nums flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name === "income" ? "Доход" : "Расход"}</span>
          <span>{formatCurrency(p.value, currency)}</span>
        </p>
      ))}
    </div>
  )
}

export function IncomeExpenseChart({ data, currency }: IncomeExpenseChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDateShort(d.date),
  }))

  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1)

  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.5 0.15 143)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="oklch(0.5 0.15 143)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.58 0.14 234)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="oklch(0.58 0.14 234)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxVal * 1.1]}
            tickFormatter={(v) => `${Math.round(v)}`}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="income"
            stroke="oklch(0.5 0.15 143)"
            strokeWidth={2}
            fill="url(#incomeGrad)"
            name="income"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="oklch(0.58 0.14 234)"
            strokeWidth={2}
            fill="url(#expenseGrad)"
            name="expense"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
