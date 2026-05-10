import { CATEGORIES, CategoryKey } from "@/lib/categories"
import { cn } from "@/lib/utils"
import {
  UtensilsCrossed, Car, Home, Gamepad2, Heart,
  Briefcase, CreditCard, ShoppingBag, GraduationCap, MoreHorizontal
} from "lucide-react"

const ICONS = {
  UtensilsCrossed, Car, Home, Gamepad2, Heart,
  Briefcase, CreditCard, ShoppingBag, GraduationCap, MoreHorizontal,
}

interface CategoryBadgeProps {
  category: CategoryKey
  size?: "sm" | "md"
  className?: string
}

export function CategoryBadge({ category, size = "md", className }: CategoryBadgeProps) {
  const cat = CATEGORIES[category]
  const IconComponent = ICONS[cat.icon as keyof typeof ICONS] ?? MoreHorizontal

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        cat.bg, cat.text,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
    >
      <IconComponent
        className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
        aria-hidden="true"
      />
      {cat.label}
    </span>
  )
}

export function CategoryIcon({ category, className }: { category: CategoryKey; className?: string }) {
  const cat = CATEGORIES[category]
  const IconComponent = ICONS[cat.icon as keyof typeof ICONS] ?? MoreHorizontal
  return <IconComponent className={cn("h-4 w-4", className)} style={{ color: cat.color }} aria-hidden="true" />
}
