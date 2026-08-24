import type { ApiResponse } from '../types/problem'
import type { SubmissionRequest, SubmissionResponse } from '../types/submission'
import { authService } from './authService'

export const submissionService = {
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

  async submitSolution(request: SubmissionRequest): Promise<SubmissionResponse> {
    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: this.getAuthHeaders(),
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
    const response = await fetch(`/api/submissions/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
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
}
