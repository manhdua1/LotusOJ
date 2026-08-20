import type {
  ApiResponse,
  PageResponse,
  ProblemDetailResponse,
  ProblemFilterRequest,
  ProblemStatResponse,
  ProblemSummaryResponse,
} from '../types/problem'
import { authService } from './authService'

const SAMPLE_PROBLEMS: ProblemSummaryResponse[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'two-sum',
    title: 'Tổng hai số (Two Sum)',
    difficulty: 'EASY',
    tags: ['math', 'array', 'hash-table'],
    acceptanceRate: 68.5,
    solvedByCurrentUser: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'longest-increasing-subsequence',
    title: 'Dãy con tăng dài nhất (LIS)',
    difficulty: 'MEDIUM',
    tags: ['dp', 'binary-search'],
    acceptanceRate: 45.2,
    solvedByCurrentUser: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    slug: 'shortest-path-dijkstra',
    title: 'Đường đi ngắn nhất trên đồ thị',
    difficulty: 'MEDIUM',
    tags: ['graphs', 'shortest-paths', 'dijkstra'],
    acceptanceRate: 52.1,
    solvedByCurrentUser: null,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    slug: 'max-flow-dinic',
    title: 'Luồng cực đại mạng đồ thị (Dinic Algorithm)',
    difficulty: 'HARD',
    tags: ['flows', 'graphs', 'network-flow'],
    acceptanceRate: 28.7,
    solvedByCurrentUser: false,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    slug: 'palindrome-partitioning',
    title: 'Phân hoạch chuỗi đối xứng',
    difficulty: 'MEDIUM',
    tags: ['strings', 'dp', 'backtracking'],
    acceptanceRate: 39.4,
    solvedByCurrentUser: null,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    slug: 'prime-sieve-queries',
    title: 'Sàng nguyên tố và truy vấn đoạn [L, R]',
    difficulty: 'EASY',
    tags: ['number-theory', 'math'],
    acceptanceRate: 74.8,
    solvedByCurrentUser: true,
  },
]

const SAMPLE_DETAILS: Record<string, ProblemDetailResponse> = {
  'two-sum': {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'two-sum',
    title: 'A. Tổng hai số (Two Sum)',
    statement: `Cho một mảng các số nguyên \`A\` gồm \`N\` phần tử và một số nguyên mục tiêu \`K\`.\n\nHãy tìm hai vị trí chỉ số \`i\` và \`j\` phân biệt sao cho \`A[i] + A[j] = K\`.\nGiả sử luôn tồn tại đúng một cặp chỉ số thỏa mãn yêu cầu. Bạn không được dùng cùng một phần tử hai lần.`,
    inputFormat: `Dòng đầu tiên chứa hai số nguyên \`N\` và \`K\` (2 ≤ N ≤ 10^5, -10^9 ≤ K ≤ 10^9).\nDòng thứ hai chứa \`N\` số nguyên A[1], A[2], ..., A[N] (-10^9 ≤ A[i] ≤ 10^9).`,
    outputFormat: `In ra hai số nguyên đại diện cho 2 chỉ số của mảng (1-indexed) theo thứ tự tăng dần cách nhau một dấu cách.`,
    constraints: `• 2 ≤ N ≤ 100,000\n• -10^9 ≤ K, A[i] ≤ 10^9\n• Thời gian thực thi tối đa: 1.0 giây\n• Giới hạn bộ nhớ: 256 MB`,
    explanationNote: `Giải thích ví dụ 1: Ta có A[1] + A[2] = 2 + 7 = 9 = K. Do đó kết quả in ra là "1 2".`,
    timeLimitMs: 1000,
    memoryLimitKb: 262144,
    difficulty: 'EASY',
    status: 'PUBLISHED',
    tags: ['math', 'array', 'hash-table'],
    sampleTestCases: [
      {
        id: 'tc-1',
        isSample: true,
        orderIndex: 1,
        input: `4 9\n2 7 11 15`,
        expectedOutput: `1 2`,
      },
      {
        id: 'tc-2',
        isSample: true,
        orderIndex: 2,
        input: `3 6\n3 2 4`,
        expectedOutput: `2 3`,
      },
    ],
    acceptanceRate: 68.5,
    createdAt: '2026-08-10T10:00:00',
  },
  'longest-increasing-subsequence': {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'longest-increasing-subsequence',
    title: 'B. Dãy con tăng dài nhất (LIS)',
    statement: `Cho dãy số nguyên gồm \`N\` phần tử. Tìm độ dài của dãy con tăng nghiêm ngặt dài nhất có thể trích xuất từ dãy số ban đầu mà không làm thay đổi thứ tự các phần tử.`,
    inputFormat: `Dòng thứ nhất gồm số nguyên dương \`N\` (1 ≤ N ≤ 200,000).\nDòng thứ hai gồm \`N\` số nguyên A[1], A[2], ..., A[N] (-10^9 ≤ A[i] ≤ 10^9).`,
    outputFormat: `In ra một số nguyên duy nhất là độ dài của dãy con tăng dài nhất.`,
    constraints: `• 1 ≤ N ≤ 200,000\n• -10^9 ≤ A[i] ≤ 10^9`,
    explanationNote: `Dãy con tăng dài nhất là [10, 20, 30, 40] có độ dài bằng 4.`,
    timeLimitMs: 1000,
    memoryLimitKb: 262144,
    difficulty: 'MEDIUM',
    status: 'PUBLISHED',
    tags: ['dp', 'binary-search'],
    sampleTestCases: [
      {
        id: 'tc-21',
        isSample: true,
        orderIndex: 1,
        input: `6\n10 20 10 30 20 40`,
        expectedOutput: `4`,
      },
    ],
    acceptanceRate: 45.2,
    createdAt: '2026-08-11T14:30:00',
  },
}

export const problemService = {
  getAuthHeaders(): HeadersInit {
    const token = authService.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  },

  async getProblems(
    filter?: ProblemFilterRequest,
    page: number = 0,
    size: number = 20,
    sort: string = 'createdAt,desc'
  ): Promise<PageResponse<ProblemSummaryResponse>> {
    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('size', size.toString())
    params.set('sort', sort)

    if (filter?.keyword && filter.keyword.trim() !== '') {
      params.set('keyword', filter.keyword.trim())
    }
    if (filter?.difficulty) {
      params.set('difficulty', filter.difficulty)
    }
    if (filter?.tag && filter.tag.trim() !== '') {
      params.set('tag', filter.tag.trim())
    }
    if (filter?.status) {
      params.set('status', filter.status)
    }
    if (typeof filter?.solved === 'boolean') {
      params.set('solved', filter.solved ? 'true' : 'false')
    }

    try {
      const response = await fetch(`/api/problems?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse<PageResponse<ProblemSummaryResponse>> = await response.json()
      if (data.code === 1000 && data.result) {
        // If the backend has data, return it
        if (data.result.content && data.result.content.length > 0) {
          return data.result
        }
      }
    } catch {
      // Backend might be offline or empty, fallback gracefully to sample problems
    }

    // Filter sample problems locally for demo/development preview
    let filtered = [...SAMPLE_PROBLEMS]
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase()
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(kw) || p.slug.toLowerCase().includes(kw)
      )
    }
    if (filter?.difficulty) {
      filtered = filtered.filter((p) => p.difficulty === filter.difficulty)
    }
    if (filter?.tag) {
      filtered = filtered.filter((p) => p.tags.some((t) => t.toLowerCase() === filter.tag?.toLowerCase()))
    }
    if (typeof filter?.solved === 'boolean') {
      filtered = filtered.filter((p) => p.solvedByCurrentUser === filter.solved)
    }

    const totalElements = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalElements / size))
    const startIdx = page * size
    const paginated = filtered.slice(startIdx, startIdx + size)

    return {
      page,
      size,
      totalElements,
      totalPages,
      isFirst: page === 0,
      isLast: page >= totalPages - 1,
      content: paginated,
    }
  },

  async getProblemBySlug(slug: string): Promise<ProblemDetailResponse> {
    try {
      const response = await fetch(`/api/problems/slug/${encodeURIComponent(slug)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (response.ok) {
        const data: ApiResponse<ProblemDetailResponse> = await response.json()
        if (data.code === 1000 && data.result) {
          return data.result
        }
      }
    } catch {
      // Fallback to sample
    }

    if (SAMPLE_DETAILS[slug]) {
      return SAMPLE_DETAILS[slug]
    }

    // Generate basic detail placeholder if found in summary
    const summary = SAMPLE_PROBLEMS.find((p) => p.slug === slug)
    if (summary) {
      return {
        id: summary.id,
        slug: summary.slug,
        title: summary.title,
        statement: `Mô tả chi tiết bài toán ${summary.title}.\n\nCho một tập hợp các điều kiện và ràng buộc. Hãy viết chương trình tối ưu để giải quyết bài toán theo đúng định dạng được yêu cầu.`,
        inputFormat: `Dòng đầu tiên chứa số lượng phần tử N.\nDòng thứ hai chứa các giá trị của mảng.`,
        outputFormat: `In ra kết quả tính toán trên một dòng duy nhất.`,
        constraints: `• 1 ≤ N ≤ 100,000\n• Giá trị phần tử nằm trong khoảng [-10^9, 10^9]`,
        explanationNote: `Kiểm tra kĩ các trường hợp đặc biệt (edge cases).`,
        timeLimitMs: 1000,
        memoryLimitKb: 262144,
        difficulty: summary.difficulty,
        status: 'PUBLISHED',
        tags: summary.tags,
        sampleTestCases: [
          {
            id: 'sample-1',
            isSample: true,
            orderIndex: 1,
            input: `5\n1 2 3 4 5`,
            expectedOutput: `15`,
          },
        ],
        acceptanceRate: summary.acceptanceRate || 50,
        createdAt: '2026-08-12T00:00:00',
      }
    }

    throw new Error(`Không tìm thấy bài tập với mã: "${slug}"`)
  },

  async getProblemById(id: string): Promise<ProblemDetailResponse> {
    try {
      const response = await fetch(`/api/problems/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (response.ok) {
        const data: ApiResponse<ProblemDetailResponse> = await response.json()
        if (data.code === 1000 && data.result) {
          return data.result
        }
      }
    } catch {
      // Fallback
    }

    const found = Object.values(SAMPLE_DETAILS).find((p) => p.id === id)
    if (found) return found

    throw new Error(`Không tìm thấy bài tập ID: ${id}`)
  },

  async getProblemStats(id: string): Promise<ProblemStatResponse> {
    try {
      const response = await fetch(`/api/problems/${id}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (response.ok) {
        const data: ApiResponse<ProblemStatResponse> = await response.json()
        if (data.code === 1000 && data.result) {
          return data.result
        }
      }
    } catch {
      // Fallback
    }

    return {
      totalSubmissions: 120,
      totalAccepted: 72,
      acceptanceRate: 60.0,
    }
  },
}
