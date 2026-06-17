import type { Question, Company } from "@/types"

const BASE = "https://raw.githubusercontent.com/snehasishroy/leetcode-companywise-interview-questions/master"

const TIER_ORDER: string[] = [
  "google", "amazon", "meta", "microsoft", "apple",
  "netflix", "nvidia", "adobe", "salesforce", "oracle",
  "uber", "airbnb", "linkedin", "twitter", "snapchat",
  "bytedance", "tiktok", "stripe", "square", "paypal",
  "bloomberg", "jpmorgan", "goldman-sachs", "two-sigma",
  "citadel", "databricks", "confluent", "cloudflare",
  "coinbase", "robinhood", "doordash", "lyft",
  "pinterest", "spotify", "dropbox", "reddit",
  "palantir", "datadog", "snowflake", "mongodb",
  "atlassian", "twilio", "stripe", "roblox",
  "intel", "amd", "cisco", "ibm", "dell", "hp",
  "tesla", "spacex", "shopify", "walmart",
  "capital-one", "american-express", "mastercard", "visa",
]

const CACHE_PREFIX = "lc-cache-"
const CACHE_TTL = 1000 * 60 * 30

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return data as T
  } catch {
    return null
  }
}

function cacheSet(key: string, data: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`)
  return res.text()
}

export async function fetchCompanies(): Promise<Company[]> {
  const cached = cacheGet<Company[]>("companies")
  if (cached) return cached

  const url = "https://api.github.com/repos/snehasishroy/leetcode-companywise-interview-questions/contents"
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch companies")
  const data: { name: string; type: string }[] = await res.json()
  const companies = data
    .filter((item) => item.type === "dir")
    .map((item) => ({
      name: item.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: item.name,
      tier: getTier(item.name),
    }))
    .sort(tierSort)

  cacheSet("companies", companies)
  return companies
}

function getTier(slug: string): number {
  const idx = TIER_ORDER.indexOf(slug)
  if (idx === -1) return 4
  if (idx <= 4) return 0
  if (idx <= 10) return 1
  if (idx <= 20) return 2
  if (idx <= 35) return 3
  return 4
}

function tierSort(a: Company, b: Company) {
  if (a.tier !== b.tier) return a.tier - b.tier
  const aIdx = TIER_ORDER.indexOf(a.slug)
  const bIdx = TIER_ORDER.indexOf(b.slug)
  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
  if (aIdx !== -1) return -1
  if (bIdx !== -1) return 1
  return a.name.localeCompare(b.name)
}

export async function fetchQuestions(company: string): Promise<Question[]> {
  const cacheKey = `questions-${company}`
  const cached = cacheGet<Question[]>(cacheKey)
  if (cached) return cached

  const csv = await fetchText(`${BASE}/${company}/all.csv`)
  const lines = csv.trim().split("\n")
  const questions: Question[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i])
    if (parts.length < 6) continue
    questions.push({
      id: Number(parts[0]),
      url: parts[1],
      title: parts[2],
      difficulty: parts[3] as Question["difficulty"],
      acceptance: parts[4],
      frequency: parts[5],
    })
  }

  cacheSet(cacheKey, questions)
  return questions
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue }
    current += ch
  }
  result.push(current.trim())
  return result
}
