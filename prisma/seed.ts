import { PrismaClient, Category, TransactionType } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60), 0, 0)
  return d
}

const transactions: Array<{
  amount: number
  currency: string
  category: Category
  description: string
  date: Date
  type: TransactionType
}> = [
  // ======= ЕДА (30%) ~15 транзакций =======
  { amount: 4.5,  currency: "AZN", category: "food", description: "Кофе навынос, Starbucks",      date: daysAgo(1),  type: "expense" },
  { amount: 18.0, currency: "AZN", category: "food", description: "Обед в офисной столовой",       date: daysAgo(1),  type: "expense" },
  { amount: 62.0, currency: "AZN", category: "food", description: "Bravo Market, продукты",        date: daysAgo(2),  type: "expense" },
  { amount: 6.0,  currency: "AZN", category: "food", description: "Кофе с круассаном",             date: daysAgo(3),  type: "expense" },
  { amount: 35.0, currency: "AZN", category: "food", description: "Ужин в Sumakh ресторан",        date: daysAgo(4),  type: "expense" },
  { amount: 47.0, currency: "AZN", category: "food", description: "Produkty, Fresco маркет",       date: daysAgo(5),  type: "expense" },
  { amount: 12.0, currency: "AZN", category: "food", description: "Пицца на обед, доставка",       date: daysAgo(7),  type: "expense" },
  { amount: 5.0,  currency: "AZN", category: "food", description: "Капучино, кофейня у метро",     date: daysAgo(8),  type: "expense" },
  { amount: 28.0, currency: "AZN", category: "food", description: "Обед с коллегами, Noodle House", date: daysAgo(9), type: "expense" },
  { amount: 74.0, currency: "AZN", category: "food", description: "Bravo Market, еженедельный",   date: daysAgo(10), type: "expense" },
  { amount: 22.0, currency: "AZN", category: "food", description: "Ужин, заказ из Wolt",           date: daysAgo(12), type: "expense" },
  { amount: 3.5,  currency: "AZN", category: "food", description: "Чай и выпечка",                 date: daysAgo(14), type: "expense" },
  { amount: 55.0, currency: "AZN", category: "food", description: "Produkty, еженедельный запас",  date: daysAgo(16), type: "expense" },
  { amount: 8.0,  currency: "AZN", category: "food", description: "Завтрак в кафе, Baku Center",  date: daysAgo(19), type: "expense" },
  { amount: 42.0, currency: "AZN", category: "food", description: "Bravo Market, продукты",        date: daysAgo(24), type: "expense" },

  // ======= ТРАНСПОРТ (15%) ~7-8 транзакций =======
  { amount: 7.0,  currency: "AZN", category: "transport", description: "Bolt, поездка до офиса",    date: daysAgo(1),  type: "expense" },
  { amount: 0.3,  currency: "AZN", category: "transport", description: "Метро, на работу",           date: daysAgo(2),  type: "expense" },
  { amount: 9.0,  currency: "AZN", category: "transport", description: "Bolt, с работы домой",       date: daysAgo(4),  type: "expense" },
  { amount: 0.3,  currency: "AZN", category: "transport", description: "Метро, BakuCard",             date: daysAgo(6),  type: "expense" },
  { amount: 12.0, currency: "AZN", category: "transport", description: "Bolt, поездка в аэропорт",   date: daysAgo(11), type: "expense" },
  { amount: 4.0,  currency: "AZN", category: "transport", description: "Парковка, ТЦ Gənclik Mall",  date: daysAgo(15), type: "expense" },
  { amount: 6.5,  currency: "AZN", category: "transport", description: "Bolt, вечерняя поездка",     date: daysAgo(20), type: "expense" },
  { amount: 0.3,  currency: "AZN", category: "transport", description: "Метро + автобус",             date: daysAgo(25), type: "expense" },

  // ======= ЖИЛЬЁ (20%) ~2-3 транзакции =======
  { amount: 600.0, currency: "AZN", category: "housing", description: "Аренда квартиры, май",        date: daysAgo(3),  type: "expense" },
  { amount: 85.0,  currency: "AZN", category: "housing", description: "Azərenerji, счёт за свет",   date: daysAgo(8),  type: "expense" },
  { amount: 42.0,  currency: "AZN", category: "housing", description: "Азеригаз, газ",               date: daysAgo(10), type: "expense" },
  { amount: 18.0,  currency: "AZN", category: "housing", description: "Интернет, Nar Home",          date: daysAgo(12), type: "expense" },

  // ======= РАЗВЛЕЧЕНИЯ (10%) ~5 транзакций =======
  { amount: 10.0, currency: "AZN", category: "entertainment", description: "Кино, Park Cinema",       date: daysAgo(3),  type: "expense" },
  { amount: 45.0, currency: "AZN", category: "entertainment", description: "Ужин с друзьями, Caspian", date: daysAgo(7), type: "expense" },
  { amount: 8.0,  currency: "AZN", category: "entertainment", description: "Книга, Ali & Nino",        date: daysAgo(13), type: "expense" },
  { amount: 25.0, currency: "AZN", category: "entertainment", description: "Бильярд-клуб, вечер",     date: daysAgo(18), type: "expense" },
  { amount: 12.0, currency: "AZN", category: "entertainment", description: "Кино, 4DX формат",         date: daysAgo(22), type: "expense" },

  // ======= ПОДПИСКИ (8%) ~4 транзакции =======
  { amount: 12.0, currency: "AZN", category: "subscriptions", description: "Netflix подписка",         date: daysAgo(5),  type: "expense" },
  { amount: 5.0,  currency: "AZN", category: "subscriptions", description: "Spotify Premium",           date: daysAgo(5),  type: "expense" },
  { amount: 3.0,  currency: "AZN", category: "subscriptions", description: "iCloud+ 50GB",             date: daysAgo(6),  type: "expense" },
  { amount: 8.0,  currency: "AZN", category: "subscriptions", description: "YouTube Premium",          date: daysAgo(7),  type: "expense" },

  // ======= ШОППИНГ (10%) ~5 транзакций =======
  { amount: 85.0, currency: "AZN", category: "shopping", description: "Рубашка, Zara Baku",            date: daysAgo(6),  type: "expense" },
  { amount: 15.0, currency: "AZN", category: "shopping", description: "Аптека, Vitamax",               date: daysAgo(9),  type: "expense" },
  { amount: 38.0, currency: "AZN", category: "shopping", description: "Спортивные носки и ремень",     date: daysAgo(14), type: "expense" },
  { amount: 12.0, currency: "AZN", category: "shopping", description: "Шампунь и гель для душа",      date: daysAgo(17), type: "expense" },
  { amount: 120.0,currency: "AZN", category: "shopping", description: "Кроссовки, Adidas outlet",     date: daysAgo(21), type: "expense" },

  // ======= ЗДОРОВЬЕ ~2 транзакции =======
  { amount: 20.0, currency: "AZN", category: "health", description: "Витамины, D3 + Omega-3",          date: daysAgo(11), type: "expense" },
  { amount: 45.0, currency: "AZN", category: "health", description: "Стоматолог, плановый осмотр",    date: daysAgo(26), type: "expense" },

  // ======= ОБРАЗОВАНИЕ ~2 транзакции =======
  { amount: 30.0, currency: "AZN", category: "education", description: "Coursera подписка",            date: daysAgo(4),  type: "expense" },
  { amount: 18.0, currency: "AZN", category: "education", description: "Книга, TypeScript Deep Dive",  date: daysAgo(16), type: "expense" },

  // ======= ДРУГОЕ ~2 транзакции =======
  { amount: 10.0, currency: "AZN", category: "other", description: "Пополнение BakuCard",              date: daysAgo(8),  type: "expense" },
  { amount: 15.0, currency: "AZN", category: "other", description: "Подарок коллеге на день рождения", date: daysAgo(19), type: "expense" },

  // ======= ДОХОДЫ (3-5 транзакций) =======
  { amount: 2000.0, currency: "AZN", category: "work", description: "Зарплата за апрель",              date: daysAgo(10), type: "income" },
  { amount: 450.0,  currency: "AZN", category: "work", description: "Фриланс проект, UI дизайн",       date: daysAgo(15), type: "income" },
  { amount: 800.0,  currency: "AZN", category: "work", description: "Консалтинг, разработка API",      date: daysAgo(22), type: "income" },
  { amount: 150.0,  currency: "AZN", category: "work", description: "Продажа старого ноутбука",        date: daysAgo(28), type: "income" },
]

async function main() {
  console.log("🌱 Seeding database...")

  await prisma.transaction.deleteMany()
  await prisma.settings.deleteMany()
  await prisma.user.deleteMany()

  const password = await bcrypt.hash("demo1234", 12)
  const user = await prisma.user.create({
    data: { email: "demo@finan.app", password, name: "Demo" },
  })

  await prisma.transaction.createMany({ data: transactions.map((t) => ({ ...t, userId: user.id })) })

  await prisma.settings.create({
    data: { userId: user.id, monthlyBudget: 1500, currency: "AZN", theme: "system" },
  })

  console.log(`✅ Created demo user: demo@finan.app / demo1234`)
  console.log(`✅ Created ${transactions.length} transactions`)
  console.log("✅ Created default settings (budget: 1500 AZN)")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
