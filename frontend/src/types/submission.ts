export type Language = 'CPP' | 'JAVA' | 'PYTHON' | 'C' | 'CSHARP'

export type SubmissionStatus = 'PENDING' | 'JUDGING' | 'DONE' | 'FAILED'

export type Verdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'OUTPUT_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'

export interface SubmissionRequest {
  problemId: string
  language: Language
  sourceCode: string
}

export interface SubmissionResponse {
  id: string
  problemId: string
  language: Language
  status: SubmissionStatus
  verdict: Verdict | null
  runtimeMs: number | null
  memoryKb: number | null
  submittedAt: string
}
