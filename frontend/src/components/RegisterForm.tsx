import React, { useState } from 'react'
import { authService } from '../services/authService'
import type { UserResponse } from '../types/auth'

interface RegisterFormProps {
  onSuccess: (user: UserResponse) => void
  onSwitchToLogin: () => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validate = (): boolean => {
    const errors: {
      username?: string
      email?: string
      password?: string
      confirmPassword?: string
    } = {}

    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      errors.username = 'Vui lòng nhập tên người dùng (handle).'
    } else if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      errors.username = 'Tên người dùng phải có độ dài từ 3 đến 30 ký tự.'
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      errors.username = 'Tên người dùng chỉ được chứa chữ cái, chữ số và dấu gạch dưới (_).'
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập địa chỉ email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Địa chỉ email không đúng định dạng.'
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.'
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.'
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      const response = await authService.register({
        username: username.trim(),
        email: email.trim(),
        password,
      })

      setSuccessMessage(
        'Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...'
      )

      const registeredUser: UserResponse = response.result || {
        username: username.trim(),
        email: email.trim(),
        role: 'USER',
      }

      setTimeout(() => {
        onSuccess(registeredUser)
      }, 1500)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Đăng ký không thành công. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="roundbox" id="register-card">
      <div className="caption titled">
        <span>
          <span className="caption-arrow">→</span> Đăng ký tài khoản LotusOJ
        </span>
      </div>

      <div className="roundbox-body">
        {errorMessage && (
          <div className="cf-notice cf-notice-error" role="alert">
            <strong>Lỗi: </strong> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="cf-notice cf-notice-success" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <table className="cf-form-table">
            <tbody>
              {/* Handle / Username */}
              <tr>
                <td className="field-name">
                  <label htmlFor="reg-username">
                    Tên đăng nhập<span className="required-star">*</span>
                  </label>
                </td>
                <td className="field-value">
                  <input
                    id="reg-username"
                    type="text"
                    className={`cf-input ${fieldErrors.username ? 'input-error' : ''}`}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => ({ ...prev, username: undefined }))
                      }
                    }}
                    placeholder="vd: manh_nguyen"
                    autoComplete="username"
                    disabled={loading}
                    autoFocus
                  />
                  {fieldErrors.username && (
                    <span className="shift-error">{fieldErrors.username}</span>
                  )}
                  <span className="field-hint">
                    Từ 3 đến 30 ký tự (chữ cái, chữ số và dấu _)
                  </span>
                </td>
              </tr>

              {/* Email */}
              <tr>
                <td className="field-name">
                  <label htmlFor="reg-email">
                    Địa chỉ Email<span className="required-star">*</span>
                  </label>
                </td>
                <td className="field-value">
                  <input
                    id="reg-email"
                    type="email"
                    className={`cf-input ${fieldErrors.email ? 'input-error' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }))
                      }
                    }}
                    placeholder="vd: name@example.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                  {fieldErrors.email && (
                    <span className="shift-error">{fieldErrors.email}</span>
                  )}
                  <span className="field-hint">
                    Dùng để đăng nhập và nhận thông báo kết quả
                  </span>
                </td>
              </tr>

              {/* Password */}
              <tr>
                <td className="field-name">
                  <label htmlFor="reg-password">
                    Mật khẩu<span className="required-star">*</span>
                  </label>
                </td>
                <td className="field-value">
                  <input
                    id="reg-password"
                    type="password"
                    className={`cf-input ${fieldErrors.password ? 'input-error' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }))
                      }
                    }}
                    placeholder="Tối thiểu 6 ký tự"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {fieldErrors.password && (
                    <span className="shift-error">{fieldErrors.password}</span>
                  )}
                </td>
              </tr>

              {/* Confirm Password */}
              <tr>
                <td className="field-name">
                  <label htmlFor="reg-confirm-password">
                    Xác nhận mật khẩu<span className="required-star">*</span>
                  </label>
                </td>
                <td className="field-value">
                  <input
                    id="reg-confirm-password"
                    type="password"
                    className={`cf-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                      }
                    }}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  {fieldErrors.confirmPassword && (
                    <span className="shift-error">{fieldErrors.confirmPassword}</span>
                  )}
                </td>
              </tr>

              {/* Submit & Switch Links */}
              <tr>
                <td className="field-name"></td>
                <td className="field-value">
                  <div className="form-actions-row" style={{ padding: '6px 0' }}>
                    <button
                      type="submit"
                      className="btn-cf btn-cf-primary"
                      disabled={loading}
                    >
                      {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>

                    <span style={{ fontSize: '12px', color: '#555' }}>
                      Đã có tài khoản?{' '}
                      <a
                        href="#login"
                        onClick={(e) => {
                          e.preventDefault()
                          onSwitchToLogin()
                        }}
                      >
                        Đăng nhập ngay
                      </a>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </div>
  )
}
