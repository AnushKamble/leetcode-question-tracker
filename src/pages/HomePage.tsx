"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { fetchCompanies } from "@/lib/api"
import { useGlobalProgress } from "@/hooks/useProgress"
import type { Company } from "@/types"
import { SearchIcon, Building2, ArrowRight, Sparkles, TrendingUp, Layers, Zap } from "lucide-react"

const tierConfig: Record<number, { label: string; icon: typeof Zap; color: string; glow: string }> = {
  0: { label: "FAANG & Elite", icon: Sparkles, color: "from-violet-500/30 via-fuchsia-500/20 to-transparent", glow: "rgba(139,92,246,0.15)" },
  1: { label: "Big Tech", icon: Zap, color: "from-blue-500/30 via-cyan-500/20 to-transparent", glow: "rgba(59,130,246,0.15)" },
  2: { label: "Top Tier", icon: TrendingUp, color: "from-emerald-500/30 via-teal-500/20 to-transparent", glow: "rgba(16,185,129,0.15)" },
  3: { label: "Notable", icon: Layers, color: "from-amber-500/25 via-orange-500/15 to-transparent", glow: "rgba(245,158,11,0.12)" },
  4: { label: "Companies", icon: Building2, color: "from-neutral-500/20 to-transparent", glow: "rgba(115,115,115,0.1)" },
}

const tierColors = [
  "from-violet-500/20 via-fuchsia-500/5 to-transparent",
  "from-blue-500/20 via-cyan-500/5 to-transparent",
  "from-emerald-500/20 via-teal-500/5 to-transparent",
  "from-amber-500/15 via-orange-500/5 to-transparent",
  "from-neutral-500/10 to-transparent",
]

export default function HomePage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { getCompanyProgress } = useGlobalProgress()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    fetchCompanies()
      .then((data) => {
        if (mountedRef.current) {
          setCompanies(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setError("Failed to load companies. Try refreshing the page.")
          setLoading(false)
        }
      })
    return () => { mountedRef.current = false }
  }, [])

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce<Record<number, Company[]>>((acc, c) => {
    if (!acc[c.tier]) acc[c.tier] = []
    acc[c.tier].push(c)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="size-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading companies...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="size-10 rounded-full bg-destructive/15 flex items-center justify-center">
            <span className="text-destructive text-lg font-medium">!</span>
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={() => window.location.reload()} className="text-xs text-primary hover:underline">
            Reload page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(56,189,248,0.08),transparent)]" />
      </div>

      <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/15">
              <Sparkles className="size-4 text-primary" />
            </div>
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              LeetProgress
            </span>
          </div>
          <div className="relative ml-auto w-full max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Search companies..."
              className="pl-9 h-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-8 space-y-12">
        {search && (
          <p className="text-sm text-muted-foreground animate-fade-in-up">
            Found {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {!search &&
          Object.entries(grouped).map(([tierStr, comps], sectionIdx) => {
            const tier = Number(tierStr)
            const cfg = tierConfig[tier]
            const Icon = cfg.icon
            return (
              <section key={tier} className="animate-fade-in-up" style={{ animationDelay: `${sectionIdx * 80}ms` }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`flex items-center justify-center size-7 rounded-lg bg-gradient-to-br ${cfg.color}`}>
                    <Icon className="size-3.5 text-foreground/80" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground/70 tracking-wide uppercase">
                    {cfg.label}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {comps.map((company, cardIdx) => {
                    const { completed } = getCompanyProgress(company.slug)
                    return (
                      <button
                        key={company.slug}
                        onClick={() => navigate(`/company/${company.slug}`)}
                        className="group text-left animate-fade-in-up"
                        style={{ animationDelay: `${sectionIdx * 80 + cardIdx * 30}ms` }}
                      >
                        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_-8px_rgba(120,80,255,0.15)] hover:-translate-y-1 cursor-pointer h-full bg-card hover:bg-accent/50">
                          <div
                            className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${tierColors[tier]}`}
                          />
                          <div className="pointer-events-none absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-0" />
                          <CardHeader className="pb-0 relative">
                            <CardTitle className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium">{company.name}</span>
                              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/30 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-3 relative">
                            <Badge
                              variant={completed > 0 ? "secondary" : "outline"}
                              className={`text-[11px] font-normal transition-all ${
                                completed > 0
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "text-muted-foreground/60"
                              }`}
                            >
                              {completed > 0 ? `${completed} solved` : "Not started"}
                            </Badge>
                          </CardContent>
                        </Card>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}

        {search && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 animate-fade-in-up">
            <SearchIcon className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/60">No companies found</p>
          </div>
        )}
      </main>
    </div>
  )
}
