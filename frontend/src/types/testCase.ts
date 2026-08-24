export interface TestCaseResponse {
  id: string
  isSample: boolean
  orderIndex: number
  input: string
  expectedOutput: string
}

export interface CreateTestCaseRequest {
  input: string
  expectedOutput: string
  isSample: boolean
  orderIndex?: number
}

export interface UpdateTestCaseRequest {
  input?: string
  expectedOutput?: string
  isSample?: boolean
  orderIndex?: number
}
