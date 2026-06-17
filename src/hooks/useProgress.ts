import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "lc-progress"

function loadProgress(): Record<string, Set<string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    const result: Record<string, Set<string>> = {}
    for (const [company, ids] of Object.entries(parsed)) {
      result[company] = new Set(ids as string[])
    }
    return result
  } catch {
    return {}
  }
}

function saveProgress(progress: Record<string, Set<string>>) {
  const obj: Record<string, string[]> = {}
  for (const [company, ids] of Object.entries(progress)) {
    obj[company] = [...ids]
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
}

export function useProgress(company: string) {
  const [progress, setProgress] = useState<Record<string, Set<string>>>(loadProgress)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const isCompleted = useCallback(
    (questionId: number) => {
      return progress[company]?.has(String(questionId)) ?? false
    },
    [progress, company]
  )

  const toggleQuestion = useCallback((questionId: number) => {
    setProgress((prev) => {
      const next = { ...prev }
      if (!next[company]) next[company] = new Set()
      const set = new Set(next[company])
      if (set.has(String(questionId))) {
        set.delete(String(questionId))
      } else {
        set.add(String(questionId))
      }
      next[company] = set
      return next
    })
  }, [company])

  const completedCount = progress[company]?.size ?? 0
  const resetProgress = useCallback(() => {
    setProgress((prev) => {
      const next = { ...prev }
      next[company] = new Set()
      return next
    })
  }, [company])

  return { isCompleted, toggleQuestion, completedCount, resetProgress }
}

export function useGlobalProgress() {
  const [progress] = useState<Record<string, Set<string>>>(loadProgress)

  const getCompanyProgress = useCallback(
    (company: string) => ({
      completed: progress[company]?.size ?? 0,
    }),
    [progress]
  )

  return { getCompanyProgress }
}
