"use client"

import { createContext, useContext, useState } from "react"
import { FAB } from "./FAB"
import { QuickAddModal } from "@/features/transactions/components/QuickAddModal"

const QuickAddContext = createContext<{ open: () => void }>({ open: () => {} })

export function useQuickAdd() {
  return useContext(QuickAddContext)
}

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <QuickAddContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <FAB onClick={() => setIsOpen(true)} />
      <QuickAddModal open={isOpen} onClose={() => setIsOpen(false)} />
    </QuickAddContext.Provider>
  )
}
