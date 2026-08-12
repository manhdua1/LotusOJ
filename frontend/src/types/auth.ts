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
  id?: string | number
  username: string
  email: string
  role?: string
  avatarUrl?: string
  rating?: number
  rank?: string
  createdAt?: string
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
