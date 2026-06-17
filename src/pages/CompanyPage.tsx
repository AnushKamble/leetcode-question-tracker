"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { fetchQuestions } from "@/lib/api"
import { useProgress } from "@/hooks/useProgress"
import type { Question } from "@/types"
import {
  ArrowLeft, ExternalLink, RotateCcw, CheckCircle2, CircleDot,
  Filter, ArrowUpDown, ListChecks
} from "lucide-react"

const difficultyMeta: Record<string, { label: string; color: string; bar: string; ring: string }> = {
  Easy: {
    label: "Easy",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    bar: "bg-emerald-500",
    ring: "shadow-emerald-500/20",
  },
  Medium: {
    label: "Medium",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    bar: "bg-amber-500",
    ring: "shadow-amber-500/20",
  },
  Hard: {
    label: "Hard",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    bar: "bg-red-500",
    ring: "shadow-red-500/20",
  },
}

type DifficultyFilter = "all" | "Easy" | "Medium" | "Hard"
type SortMode = "default" | "difficulty" | "acceptance" | "title"

export default function CompanyPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")
  const [sortMode, setSortMode] = useState<SortMode>("default")
  const [statusFilter, setStatusFilter] = useState<"all" | "done" | "undone">("all")
  const { isCompleted, toggleQuestion, completedCount, resetProgress } = useProgress(slug ?? "")

  useEffect(() => {
    if (!slug) return
    window.scrollTo(0, 0)
    setLoading(true)
    setError("")
    fetchQuestions(slug)
      .then((data) => {
        setQuestions(data)
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load questions. Try again.")
        setLoading(false)
      })
  }, [slug])

  const filtered = useMemo(() => {
    let result = [...questions]

    if (difficultyFilter !== "all") {
      result = result.filter((q) => q.difficulty === difficultyFilter)
    }

    if (statusFilter === "done") {
      result = result.filter((q) => isCompleted(q.id))
    } else if (statusFilter === "undone") {
      result = result.filter((q) => !isCompleted(q.id))
    }

    const diffOrder = { Easy: 0, Medium: 1, Hard: 2 }
    switch (sortMode) {
      case "difficulty":
        result.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty])
        break
      case "acceptance":
        result.sort((a, b) => parseFloat(b.acceptance) - parseFloat(a.acceptance))
        break
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        result.sort((a, b) => a.id - b.id)
    }

    return result
  }, [questions, difficultyFilter, statusFilter, sortMode, isCompleted])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="size-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">
            <ArrowLeft className="size-4 mr-2" /> Back
          </Button>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const companyName = slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? ""
  const total = questions.length
  const progressPct = total > 0 ? (completedCount / total) * 100 : 0
  const allDone = progressPct === 100 && total > 0

  const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 }
  questions.forEach((q) => {
    if (q.difficulty in difficultyCounts) difficultyCounts[q.difficulty as keyof typeof difficultyCounts]++
  })

  const filterBtn = (label: string, active: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
        active
          ? "bg-primary/15 text-primary shadow-sm animate-glow-pulse"
          : "text-muted-foreground/70 hover:text-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  )

  const diffGlow = allDone
    ? "shadow-emerald-500/10"
    : difficultyFilter !== "all"
      ? `${difficultyMeta[difficultyFilter]?.ring || ""}`
      : ""

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.06),transparent)]" />

      <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-base font-bold tracking-tight">{companyName}</h1>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-normal tabular-nums">
              <CheckCircle2 className="size-3 mr-1 text-emerald-400" />
              {completedCount}/{total}
            </Badge>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={resetProgress}
              title="Reset progress"
              className="text-muted-foreground/50 hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-6 py-8">
        <Card className={`mb-6 bg-card transition-all duration-500 ${allDone ? "ring-1 ring-emerald-500/20" : ""} ${diffGlow}`}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center justify-center size-8 rounded-lg transition-all duration-500 ${allDone ? "bg-emerald-500/15 scale-110" : "bg-primary/15"}`}>
                {allDone ? <CheckCircle2 className="size-4 text-emerald-400" /> : <CircleDot className="size-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {allDone ? "All questions completed!" : `${completedCount} of ${total} solved`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {allDone ? "You're interview-ready" : `${Math.round(progressPct)}% complete — keep going`}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                {Object.entries(difficultyCounts).map(([diff, count]) => {
                  const m = difficultyMeta[diff]
                  return (
                    <span key={diff} className="flex items-center gap-1">
                      <span className={`size-2 rounded-full ${m.bar}`} />
                      {count}
                    </span>
                  )
                })}
              </div>
            </div>
            <Progress value={progressPct} className={`h-1.5 ${allDone ? "bg-emerald-500/10" : ""}`} />
          </CardContent>
        </Card>

        <div className="mb-5 flex flex-wrap items-center gap-2 animate-fade-in-up">
          <Filter className="size-3.5 text-muted-foreground/60 mr-1" />
          {(["all", "Easy", "Medium", "Hard"] as const).map((d) =>
            filterBtn(d === "all" ? "All" : d, difficultyFilter === d, () => setDifficultyFilter(d))
          )}
          <div className="w-px h-5 bg-border mx-2" />
          <ListChecks className="size-3.5 text-muted-foreground/60 mr-1" />
          {(["all", "undone", "done"] as const).map((s) =>
            filterBtn(s === "all" ? "All" : s === "done" ? "Solved" : "Unsolved", statusFilter === s, () => setStatusFilter(s))
          )}
          <div className="w-px h-5 bg-border mx-2" />
          <ArrowUpDown className="size-3.5 text-muted-foreground/60 mr-1" />
          {(["default", "difficulty", "acceptance", "title"] as const).map((s) =>
            filterBtn(
              s === "default" ? "Default" : s.charAt(0).toUpperCase() + s.slice(1),
              sortMode === s,
              () => setSortMode(s)
            )
          )}
          {filtered.length !== questions.length && (
            <span className="text-xs text-muted-foreground/60 ml-auto">
              {filtered.length} of {questions.length}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map((q, idx) => {
            const done = isCompleted(q.id)
            const meta = difficultyMeta[q.difficulty]
            const acceptanceNum = parseFloat(q.acceptance)
            return (
              <Card
                key={q.id}
                data-done={done}
                className="transition-all duration-300 bg-card data-[done=true]:border-emerald-500/25 data-[done=true]:bg-emerald-500/[0.04] hover:bg-accent/50 hover:-translate-y-0.5 hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: `${idx * 25}ms` }}
              >
                <div className="flex items-center gap-3 p-3.5">
                  <Checkbox
                    checked={done}
                    onCheckedChange={() => toggleQuestion(q.id)}
                    className={`transition-all duration-200 data-checked:border-emerald-500 data-checked:bg-emerald-500 data-checked:text-white data-checked:scale-110 ${done ? "" : "opacity-60 hover:opacity-100 hover:scale-105"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs tabular-nums text-muted-foreground/50 font-mono">
                        {String(q.id).padStart(4, "0")}
                      </span>
                      <a
                        href={q.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm leading-snug font-medium transition-all duration-200 ${done ? "text-foreground/60 line-through decoration-muted-foreground/30" : "text-foreground hover:text-primary"}`}
                      >
                        {q.title}
                      </a>
                      <ExternalLink className="size-3 shrink-0 text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
                      <Badge variant="outline" className={`text-[10px] font-normal px-1.5 py-0 transition-all ${meta?.color || ""}`}>
                        {q.difficulty}
                      </Badge>
                      <span className="tabular-nums">{q.acceptance}</span>
                      <div className="flex-1 max-w-24 h-1 rounded-full bg-accent overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${meta?.bar || "bg-primary"}`}
                          style={{ width: `${acceptanceNum}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 animate-fade-in-up">
            <CircleDot className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/60">No questions match your filters</p>
          </div>
        )}
      </main>
    </div>
  )
}
