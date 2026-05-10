import OpenAI from "openai"

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function parseTransaction(text: string): Promise<{
  amount: number
  currency: string
  category: string
  description: string
  date: string
  type: "expense" | "income"
}> {
  const today = new Date().toISOString().split("T")[0]

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Ты — финансовый парсер. Из текста извлеки транзакцию и верни ТОЛЬКО JSON без markdown.

Формат ответа:
{
  "amount": number (положительное),
  "currency": "AZN" | "USD" | "EUR",
  "category": "food"|"transport"|"housing"|"entertainment"|"health"|"work"|"subscriptions"|"shopping"|"education"|"other",
  "description": "краткое описание на русском",
  "date": "YYYY-MM-DD",
  "type": "expense" | "income"
}

Правила:
- Если валюта не указана — "AZN"
- Если дата не указана — ${today}
- "потратил", "купил", "заплатил", "оплатил" → type: "expense"
- "получил", "зарплата", "доход", "фриланс", "заработал" → type: "income"
- amount всегда положительный
- Категории: food=еда/кафе/ресторан, transport=такси/метро/бензин, housing=аренда/коммунальные, entertainment=кино/игры/досуг, health=аптека/врач, work=зарплата/фриланс, subscriptions=подписки/стриминг, shopping=одежда/магазин, education=курсы/книги`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.1,
    max_tokens: 200,
  })

  const content = response.choices[0]?.message?.content ?? ""
  const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
  return JSON.parse(cleaned)
}

export async function generateInsights(data: {
  totalExpenses: number
  totalIncome: number
  budget: number
  byCategory: Record<string, number>
  prevMonthByCategory: Record<string, number>
  avgTransactionAmount: number
  weekdayAvg: number
  weekendAvg: number
  transactionCount: number
  currency: string
}): Promise<
  Array<{
    title: string
    description: string
    type: "warning" | "info" | "success"
    icon: string
  }>
> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Ты — финансовый советник. Проанализируй данные и верни 3-5 инсайтов в JSON массиве без markdown.

Формат:
[{"title": "string", "description": "string с конкретными числами", "type": "warning"|"info"|"success", "icon": "TrendingUp"|"TrendingDown"|"AlertCircle"|"Lightbulb"|"CheckCircle"|"PiggyBank"|"ShoppingCart"}]

Правила:
- type "warning" — негативный тренд или превышение
- type "success" — позитивный тренд или экономия
- type "info" — нейтральное наблюдение
- Используй конкретные числа из данных
- Пиши на русском, кратко и по делу`,
      },
      {
        role: "user",
        content: JSON.stringify(data),
      },
    ],
    temperature: 0.3,
    max_tokens: 800,
  })

  const content = response.choices[0]?.message?.content ?? "[]"
  const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
  return JSON.parse(cleaned)
}
