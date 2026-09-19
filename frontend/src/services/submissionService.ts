import type { ApiResponse, PageResponse } from '../types/problem'
import type { Language, SubmissionRequest, SubmissionResponse, SubmissionStatus, Verdict } from '../types/submission'
import { authService } from './authService'

export interface SubmissionFilterParams {
  page?: number
  size?: number
  problemId?: string
  problemSlug?: string
  userId?: string
  username?: string
  language?: Language
  verdict?: Verdict
  status?: SubmissionStatus
  sort?: string
}

export const submissionService = {
  async submitSolution(request: SubmissionRequest): Promise<SubmissionResponse> {
    const response = await authService.fetchWithAuth('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      let errorMsg = `Lỗi gửi bài nộp (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) {
          errorMsg = errJson.message
        }
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }

    const data: ApiResponse<SubmissionResponse> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Không thể nộp bài. Vui lòng thử lại!')
    }

    return data.result
  },

  async getSubmission(id: string): Promise<SubmissionResponse> {
    const response = await authService.fetchWithAuth(`/api/submissions/${id}`, {
      method: 'GET',
    })

    if (!response.ok) {
      let errorMsg = `Lỗi lấy trạng thái bài nộp (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) {
          errorMsg = errJson.message
        }
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }

    const data: ApiResponse<SubmissionResponse> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Không thể lấy thông tin bài nộp!')
    }

    return data.result
  },

  /**
   * Lấy danh sách bài nộp của chính người dùng đang đăng nhập
   */
  async getMySubmissions(params: SubmissionFilterParams = {}): Promise<PageResponse<SubmissionResponse>> {
    const query = new URLSearchParams()
    if (params.page !== undefined) query.set('page', params.page.toString())
    if (params.size !== undefined) query.set('size', params.size.toString())
    if (params.problemId) query.set('problemId', params.problemId)
    if (params.problemSlug) query.set('problemSlug', params.problemSlug)
    if (params.language) query.set('language', params.language)
    if (params.verdict) query.set('verdict', params.verdict)
    if (params.status) query.set('status', params.status)
    if (params.sort) query.set('sort', params.sort)

    const url = `/api/submissions/my${query.toString() ? `?${query.toString()}` : ''}`
    const response = await authService.fetchWithAuth(url, {
      method: 'GET',
    })

    if (!response.ok) {
      let errorMsg = `Lỗi lấy lịch sử bài nộp cá nhân (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) {
          errorMsg = errJson.message
        }
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }

    const data: ApiResponse<PageResponse<SubmissionResponse>> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Không thể lấy lịch sử bài nộp!')
    }

    return data.result
  },

  /**
   * Lấy danh sách tất cả các bài nộp trên toàn hệ thống
   */
  async getAllSubmissions(params: SubmissionFilterParams = {}): Promise<PageResponse<SubmissionResponse>> {
    const query = new URLSearchParams()
    if (params.page !== undefined) query.set('page', params.page.toString())
    if (params.size !== undefined) query.set('size', params.size.toString())
    if (params.userId) query.set('userId', params.userId)
    if (params.username) query.set('username', params.username)
    if (params.problemId) query.set('problemId', params.problemId)
    if (params.problemSlug) query.set('problemSlug', params.problemSlug)
    if (params.language) query.set('language', params.language)
    if (params.verdict) query.set('verdict', params.verdict)
    if (params.status) query.set('status', params.status)
    if (params.sort) query.set('sort', params.sort)

    const url = `/api/submissions${query.toString() ? `?${query.toString()}` : ''}`
    const response = await authService.fetchWithAuth(url, {
      method: 'GET',
    })

    if (!response.ok) {
      let errorMsg = `Lỗi lấy danh sách bài nộp hệ thống (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) {
          errorMsg = errJson.message
        }
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }

    const data: ApiResponse<PageResponse<SubmissionResponse>> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Không thể lấy danh sách bài nộp!')
    }

    return data.result
  },
}
