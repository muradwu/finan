"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { CATEGORIES, CategoryKey } from "@/lib/categories"
import { formatCurrency } from "@/lib/formatters"

interface CategoryDonutProps {
  byCategory: Record<string, number>
  currency: string
}

const CustomTooltip = ({ active, payload, currency }: { active?: boolean; payload?: Array<{ name: string; value: number }>; currency: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{payload[0].name}</p>
      <p className="text-sm tabular-nums text-muted-foreground">{formatCurrency(payload[0].value, currency)}</p>
    </div>
  )
}

const CustomLegend = ({ payload }: { payload?: Array<{ color: string; value: string }> }) => {
  if (!payload) return null
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  )
}

export function CategoryDonut({ byCategory, currency }: CategoryDonutProps) {
  const data = Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .map(([cat, value]) => ({
      name: CATEGORIES[cat as CategoryKey]?.label ?? cat,
      value,
      color: CATEGORIES[cat as CategoryKey]?.color ?? "#6B7280",
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Нет расходов в этом месяце
      </div>
    )
  }

  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
