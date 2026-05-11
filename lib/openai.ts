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
- Категории строго по смыслу:
  food = еда, кофе, чай, ресторан, кафе, обед, завтрак, ужин, продукты, магазин еды, фастфуд
  transport = такси, bolt, uber, метро, автобус, бензин, парковка, поездка
  housing = аренда, квартира, коммунальные, ЖКХ, электричество, газ, вода
  entertainment = кино, театр, концерт, игры, досуг, отдых, ресторан (не еда навынос)
  health = аптека, лекарства, врач, клиника, анализы
  work = зарплата, доход от работы, фриланс, гонорар, консультация
  subscriptions = Netflix, Spotify, iCloud, подписка, стриминг
  shopping = одежда, обувь, техника, электроника, товары
  education = курсы, книги, обучение, урок, тренинг
  other = всё остальное
- Пример: "кофе навынос" → food, "поездка на bolt" → transport, "netflix" → subscriptions`,
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

export async function parseReceiptImage(base64Image: string): Promise<{
  amount: number
  currency: string
  category: string
  description: string
  date: string
  type: "expense" | "income"
}> {
  const today = new Date().toISOString().split("T")[0]

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: "high" },
          },
          {
            type: "text",
            text: `Это фото чека или квитанции. Текст может быть на азербайджанском, русском или английском языке. Извлеки данные о покупке и верни ТОЛЬКО JSON без markdown и без пояснений.

Сегодня: ${today}

Формат ответа (строго JSON):
{
  "amount": number (итоговая сумма к оплате, только число),
  "currency": "AZN" | "USD" | "EUR",
  "category": "food"|"transport"|"housing"|"entertainment"|"health"|"work"|"subscriptions"|"shopping"|"education"|"other",
  "description": "краткое описание на русском (магазин/заведение и что куплено)",
  "date": "YYYY-MM-DD",
  "type": "expense"
}

Правила:
- amount = ищи слова: CƏMİ, CƏMI, YEKUN, TOTAL, ИТОГО, JƏMI — это итоговая сумма
- Если сумма написана как "12.50" или "12,50" — это 12.50
- Если валюта не ясна — "AZN" (Азербайджан)
- Если дата не видна — ${today}
- Кафе/ресторан/supermarket/market → food, aptek/аптека → health, geyim/одежда → shopping, taksi/такси → transport
- description = название магазина/заведения + что куплено (на русском)
- type всегда "expense"
- Если не можешь прочитать сумму — используй наибольшее видимое число на чеке`,
          },
        ],
      },
    ],
    max_tokens: 500,
  })

  const content = response.choices[0]?.message?.content ?? ""
  const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON in response: ${cleaned}`)
  return JSON.parse(jsonMatch[0])
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
