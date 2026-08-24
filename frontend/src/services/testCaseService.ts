import type { ApiResponse } from '../types/problem'
import type { CreateTestCaseRequest, TestCaseResponse, UpdateTestCaseRequest } from '../types/testCase'
import { authService } from './authService'

export const testCaseService = {
  /**
   * Lấy danh sách testcase mẫu (isSample = true) công khai
   */
  async getSampleTestCases(problemId: string): Promise<TestCaseResponse[]> {
    const response = await authService.fetchWithAuth(`/api/problems/${problemId}/testcases/samples`, {
      method: 'GET',
    })

    if (!response.ok) {
      let errorMsg = `Lỗi tải danh sách test case mẫu (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) errorMsg = errJson.message
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }

    const data: ApiResponse<TestCaseResponse[]> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Lỗi xử lý yêu cầu test case')
    }

    return data.result
  },

  /**
   * Lấy toàn bộ danh sách testcase của bài tập (chỉ dành cho Admin / Problem Setter)
   */
  async getProblemTestCases(problemId: string): Promise<TestCaseResponse[]> {
    const response = await authService.fetchWithAuth(`/api/problems/${problemId}/testcases`, {
      method: 'GET',
    })

    if (!response.ok) {
      let errorMsg = `Lỗi tải bộ test của bài tập (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) errorMsg = errJson.message
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }

    const data: ApiResponse<TestCaseResponse[]> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Không thể lấy danh sách test case')
    }

    return data.result
  },

  /**
   * Tạo 1 testcase mới cho bài tập
   */
  async createTestCase(problemId: string, request: CreateTestCaseRequest): Promise<TestCaseResponse> {
    const response = await authService.fetchWithAuth(`/api/problems/${problemId}/testcases`, {
      method: 'POST',
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      let errorMsg = `Lỗi tạo test case (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) errorMsg = errJson.message
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }

    const data: ApiResponse<TestCaseResponse> = await response.json()
    if ((data.code !== 1000 && data.code !== 200 && data.code !== 201) || !data.result) {
      throw new Error(data.message || 'Không thể tạo test case mới')
    }

    return data.result
  },

  /**
   * Cập nhật 1 testcase
   */
  async updateTestCase(testCaseId: string, request: UpdateTestCaseRequest): Promise<TestCaseResponse> {
    const response = await authService.fetchWithAuth(`/api/testcases/${testCaseId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      let errorMsg = `Lỗi cập nhật test case (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) errorMsg = errJson.message
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }

    const data: ApiResponse<TestCaseResponse> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Không thể cập nhật test case')
    }

    return data.result
  },

  /**
   * Xóa 1 testcase
   */
  async deleteTestCase(testCaseId: string): Promise<void> {
    const response = await authService.fetchWithAuth(`/api/testcases/${testCaseId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      let errorMsg = `Lỗi xóa test case (HTTP ${response.status})`
      try {
        const errJson: ApiResponse<unknown> = await response.json()
        if (errJson.message) errorMsg = errJson.message
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }
  },
}
