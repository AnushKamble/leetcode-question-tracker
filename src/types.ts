export interface Question {
  id: number
  url: string
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  acceptance: string
  frequency: string
}

export interface Company {
  name: string
  slug: string
  tier: number
}
