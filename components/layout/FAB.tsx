"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface FABProps {
  onClick: () => void
  className?: string
}

export function FAB({ onClick, className }: FABProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className={cn(
        "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50",
        "flex items-center justify-center w-14 h-14 rounded-full",
        "bg-primary text-primary-foreground shadow-lg",
        "hover:opacity-90 transition-opacity",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      aria-label="Добавить транзакцию"
    >
      <Plus className="h-6 w-6" aria-hidden="true" />
    </motion.button>
  )
}
