export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  avatarUrl?: string
}

export interface UserResponse {
  id?: string
  username: string
  email: string
  role?: string
  status?: string
  avatarUrl?: string
  totalSolved?: number
  totalSubmissions?: number
  createdAt?: string
  updatedAt?: string
}

export interface ApiResponse<T> {
  code: number
  message?: string
  result?: T
}

export interface AuthState {
  user: UserResponse | null
  token: string | null
  isAuthenticated: boolean
}
