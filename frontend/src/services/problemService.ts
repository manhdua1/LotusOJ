import type {
  ApiResponse,
  PageResponse,
  ProblemDetailResponse,
  ProblemFilterRequest,
  ProblemStatResponse,
  ProblemSummaryResponse,
} from '../types/problem'
import { authService } from './authService'

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

    const response = await fetch(`/api/problems?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      let errorMessage = `Lỗi tải danh sách bài tập (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) {
          errorMessage = errJson.message
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMessage)
    }

    const data: ApiResponse<PageResponse<ProblemSummaryResponse>> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Lỗi xử lý yêu cầu từ hệ thống')
    }

    return data.result
  },

  async getProblemBySlug(slug: string): Promise<ProblemDetailResponse> {
    const response = await fetch(`/api/problems/slug/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      let errorMessage = `Không tìm thấy bài tập: "${slug}"`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) {
          errorMessage = errJson.message
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMessage)
    }

    const data: ApiResponse<ProblemDetailResponse> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || `Không tìm thấy bài tập: "${slug}"`)
    }

    return data.result
  },

  async getProblemById(id: string): Promise<ProblemDetailResponse> {
    const response = await fetch(`/api/problems/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      let errorMessage = `Không tìm thấy bài tập với ID: ${id}`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) {
          errorMessage = errJson.message
        }
      } catch {
        // fallback
      }
      throw new Error(errorMessage)
    }

    const data: ApiResponse<ProblemDetailResponse> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || `Không tìm thấy bài tập với ID: ${id}`)
    }

    return data.result
  },

  async getProblemStats(id: string): Promise<ProblemStatResponse> {
    const response = await fetch(`/api/problems/${id}/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      let errorMessage = `Không thể lấy thống kê bài tập`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) {
          errorMessage = errJson.message
        }
      } catch {
        // fallback
      }
      throw new Error(errorMessage)
    }

    const data: ApiResponse<ProblemStatResponse> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Không thể lấy thống kê bài tập')
    }

    return data.result
  },
}
