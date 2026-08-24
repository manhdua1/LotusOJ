import type { ApiResponse, LoginRequest, RegisterRequest, UserResponse } from '../types/auth'

const TOKEN_KEY = 'lotusoj_token'
const USER_KEY = 'lotusoj_user'

export interface JwtPayload {
  sub?: string
  userId?: string
  role?: string
  exp?: number
  iat?: number
  jti?: string
}

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

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

  decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null
      const base64Url = parts[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload) as JwtPayload
    } catch {
      return null
    }
  },

  isTokenExpired(token?: string | null): boolean {
    const t = token ?? this.getToken()
    if (!t) return true
    const payload = this.decodeToken(t)
    if (!payload?.exp) return true
    // If expiring within 10 seconds, consider expired to refresh proactively
    return payload.exp * 1000 <= Date.now() + 10000
  },

  isAdmin(): boolean {
    const user = this.getUser()
    return user?.role === 'ADMIN' || user?.role === 'PROBLEM_SETTER'
  },

  async refreshToken(): Promise<string | null> {
    // If a refresh is already in progress, return the existing promise
    if (isRefreshing && refreshPromise) {
      return refreshPromise
    }

    isRefreshing = true
    refreshPromise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Refresh token failed with status ${response.status}`)
        }

        const data: ApiResponse<string> = await response.json()
        if ((data.code === 1000 || data.code === 200) && data.result) {
          const newAccessToken = data.result
          this.setToken(newAccessToken)

          const payload = this.decodeToken(newAccessToken)
          const currentUser = this.getUser()
          if (currentUser && payload?.role) {
            currentUser.role = payload.role
            this.setUser(currentUser)
          }

          return newAccessToken
        } else {
          throw new Error(data.message || 'Lỗi làm mới token')
        }
      } catch {
        // Refresh token expired or invalid
        this.removeToken()
        this.removeUser()
        window.dispatchEvent(new CustomEvent('lotusoj_auth_expired'))
        return null
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    })()

    return refreshPromise
  },

  async getValidToken(): Promise<string | null> {
    let token = this.getToken()
    if (!token) return null

    if (this.isTokenExpired(token)) {
      token = await this.refreshToken()
    }
    return token
  },

  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getValidToken()

    const headers = new Headers(options.headers || {})
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    // If server still returns 401 Unauthorized, attempt reactive refresh and retry once
    if (response.status === 401) {
      const newToken = await this.refreshToken()
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`)
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        })
      }
    }

    return response
  },

  async login(request: LoginRequest): Promise<ApiResponse<string>> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'include',
      })

      const data: ApiResponse<string> = await response.json()

      if (!response.ok || data.code !== 1000) {
        throw new Error(this.getErrorMessage(data.message || `Error ${response.status}`))
      }

      if (data.result) {
        this.setToken(data.result)
        const payload = this.decodeToken(data.result)
        const role = payload?.role || 'USER'
        const username = request.email.includes('@') ? request.email.split('@')[0] : request.email
        this.setUser({
          username,
          email: request.email,
          role,
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
        credentials: 'include',
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
          credentials: 'include',
        })
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      this.removeToken()
      this.removeUser()
    }
  },

  async getProfile(): Promise<UserResponse> {
    const response = await this.fetchWithAuth('/api/auth/me', {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Lỗi tải thông tin tài khoản (HTTP ${response.status})`)
    }

    const data: ApiResponse<UserResponse> = await response.json()
    if ((data.code !== 1000 && data.code !== 200) || !data.result) {
      throw new Error(data.message || 'Không thể lấy thông tin tài khoản')
    }

    this.setUser(data.result)
    return data.result
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
