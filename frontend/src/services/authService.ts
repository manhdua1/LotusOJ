import type { ApiResponse, LoginRequest, RegisterRequest, UserResponse } from '../types/auth'

const TOKEN_KEY = 'lotusoj_token'
const USER_KEY = 'lotusoj_user'

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY)
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },

  getUser(): UserResponse | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as UserResponse
    } catch {
      return null
    }
  },

  setUser(user: UserResponse) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  removeUser() {
    localStorage.removeItem(USER_KEY)
  },

  async login(request: LoginRequest): Promise<ApiResponse<string>> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data: ApiResponse<string> = await response.json()

      if (!response.ok || data.code !== 1000) {
        throw new Error(this.getErrorMessage(data.message || `Error ${response.status}`))
      }

      if (data.result) {
        this.setToken(data.result)
        // Store user basic info derived from email/handle
        const username = request.email.includes('@') ? request.email.split('@')[0] : request.email
        this.setUser({
          username,
          email: request.email,
          role: 'USER',
          rating: 1500,
          rank: 'Specialist',
        })
      }

      return data
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err
      }
      throw new Error('Đã xảy ra lỗi không xác định khi đăng nhập.')
    }
  },

  async register(request: RegisterRequest): Promise<ApiResponse<UserResponse>> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data: ApiResponse<UserResponse> = await response.json()

      if (!response.ok || data.code !== 1000) {
        throw new Error(this.getErrorMessage(data.message || `Error ${response.status}`))
      }

      return data
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err
      }
      throw new Error('Đã xảy ra lỗi không xác định khi đăng ký.')
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken()
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      this.removeToken()
      this.removeUser()
    }
  },

  getErrorMessage(rawMessage: string): string {
    const errorMap: Record<string, string> = {
      INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác.',
      UNAUTHENTICATED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      UNAUTHORIZED: 'Bạn không có quyền thực hiện hành động này.',
      EMAIL_REQUIRED: 'Vui lòng nhập địa chỉ email.',
      PASSWORD_REQUIRED: 'Vui lòng nhập mật khẩu.',
      USERNAME_REQUIRED: 'Vui lòng nhập tên người dùng (username).',
      INVALID_EMAIL: 'Định dạng email không hợp lệ.',
      INVALID_PASSWORD: 'Mật khẩu phải có ít nhất 6 ký tự.',
      INVALID_USERNAME: 'Username phải có từ 3 đến 30 ký tự.',
      USER_EXISTED: 'Tên người dùng hoặc email này đã được sử dụng.',
      'Failed to fetch': 'Không thể kết nối đến máy chủ backend (http://localhost:8080).',
    }

    return errorMap[rawMessage] || rawMessage
  },
}
