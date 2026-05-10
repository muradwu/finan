import { z } from "zod"

export const transactionSchema = z.object({
  amount: z.number().positive("Сумма должна быть больше 0"),
  currency: z.string().min(1),
  category: z.string().min(1, "Выберите категорию"),
  description: z.string().min(1, "Введите описание"),
  date: z.string().min(1, "Выберите дату"),
  type: z.enum(["expense", "income"]),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>
