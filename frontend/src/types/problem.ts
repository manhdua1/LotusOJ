export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type ProblemStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface Tag {
  id?: string
  name: string
}

export interface ProblemSummaryResponse {
  id: string
  slug: string
  title: string
  difficulty: ProblemDifficulty
  tags: string[]
  acceptanceRate: number | null
  solvedByCurrentUser: boolean | null
}

export interface TestCaseResponse {
  id: string
  isSample: boolean
  orderIndex: number
  input: string
  expectedOutput: string
}

export interface ProblemDetailResponse {
  id: string
  slug: string
  title: string
  statement: string
  inputFormat: string
  outputFormat: string
  constraints: string
  explanationNote?: string
  timeLimitMs: number
  memoryLimitKb: number
  difficulty: ProblemDifficulty
  status: ProblemStatus
  tags: string[]
  sampleTestCases: TestCaseResponse[]
  acceptanceRate?: number
  createdAt?: string
}

export interface ProblemStatResponse {
  totalSubmissions: number
  totalAccepted: number
  acceptanceRate: number
}

export interface ProblemFilterRequest {
  tag?: string
  difficulty?: ProblemDifficulty | ''
  status?: ProblemStatus | ''
  solved?: boolean
  keyword?: string
}

export interface PageResponse<T> {
  page: number
  size: number
  totalElements: number
  totalPages: number
  isFirst: boolean
  isLast: boolean
  content: T[]
}

export interface ApiResponse<T> {
  code: number
  message?: string
  result: T
}
