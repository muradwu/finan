export const CATEGORIES = {
  food:          { label: "Еда",          color: "#F59E0B", bg: "bg-amber-100 dark:bg-amber-900/30",   text: "text-amber-700 dark:text-amber-400",   icon: "UtensilsCrossed" },
  transport:     { label: "Транспорт",    color: "#3B82F6", bg: "bg-blue-100 dark:bg-blue-900/30",     text: "text-blue-700 dark:text-blue-400",     icon: "Car" },
  housing:       { label: "Жилье",        color: "#8B5CF6", bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", icon: "Home" },
  entertainment: { label: "Развлечения",  color: "#EC4899", bg: "bg-pink-100 dark:bg-pink-900/30",     text: "text-pink-700 dark:text-pink-400",     icon: "Gamepad2" },
  health:        { label: "Здоровье",     color: "#10B981", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: "Heart" },
  work:          { label: "Работа",       color: "#6366F1", bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400", icon: "Briefcase" },
  subscriptions: { label: "Подписки",     color: "#06B6D4", bg: "bg-cyan-100 dark:bg-cyan-900/30",     text: "text-cyan-700 dark:text-cyan-400",     icon: "CreditCard" },
  shopping:      { label: "Шоппинг",      color: "#F97316", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", icon: "ShoppingBag" },
  education:     { label: "Образование",  color: "#84CC16", bg: "bg-lime-100 dark:bg-lime-900/30",     text: "text-lime-700 dark:text-lime-400",     icon: "GraduationCap" },
  other:         { label: "Другое",       color: "#6B7280", bg: "bg-gray-100 dark:bg-gray-800",        text: "text-gray-600 dark:text-gray-400",     icon: "MoreHorizontal" },
} as const

export type CategoryKey = keyof typeof CATEGORIES

export const CATEGORY_OPTIONS = Object.entries(CATEGORIES).map(([key, val]) => ({
  value: key as CategoryKey,
  label: val.label,
  color: val.color,
}))
