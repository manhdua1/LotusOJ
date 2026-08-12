import React, { useState } from 'react'
import { authService } from '../services/authService'
import type { UserResponse } from '../types/auth'

interface LoginFormProps {
  onSuccess: (user: UserResponse, token: string) => void
  onSwitchToRegister: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập tên đăng nhập (handle) hoặc email.'
    }
    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.'
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
      const response = await authService.login({
        email: email.trim(),
        password,
      })

      setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...')
      const user = authService.getUser() || {
        username: email.split('@')[0],
        email: email.trim(),
        role: 'USER',
      }

      setTimeout(() => {
        onSuccess(user, response.result || '')
      }, 500)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('Đăng nhập không thành công. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setFieldErrors({})
    setErrorMessage(null)
  }

  return (
    <div className="roundbox" id="login-card">
      <div className="caption titled">
        <span>
          <span className="caption-arrow">→</span> Đăng nhập vào LotusOJ
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
              {/* Handle / Email Field */}
              <tr>
                <td className="field-name">
                  <label htmlFor="login-email">
                    Tên đăng nhập / Email<span className="required-star">*</span>
                  </label>
                </td>
                <td className="field-value">
                  <input
                    id="login-email"
                    type="text"
                    className={`cf-input ${fieldErrors.email ? 'input-error' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }))
                      }
                    }}
                    placeholder="vd: manh_nguyen hoặc user@example.com"
                    autoComplete="username"
                    disabled={loading}
                    autoFocus
                  />
                  {fieldErrors.email && (
                    <span className="shift-error">{fieldErrors.email}</span>
                  )}
                </td>
              </tr>

              {/* Password Field */}
              <tr>
                <td className="field-name">
                  <label htmlFor="login-password">
                    Mật khẩu<span className="required-star">*</span>
                  </label>
                </td>
                <td className="field-value">
                  <input
                    id="login-password"
                    type="password"
                    className={`cf-input ${fieldErrors.password ? 'input-error' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }))
                      }
                    }}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  {fieldErrors.password && (
                    <span className="shift-error">{fieldErrors.password}</span>
                  )}
                  <div style={{ marginTop: '5px' }}>
                    <a
                      href="#forgot"
                      className="link-alt"
                      onClick={(e) => {
                        e.preventDefault()
                        alert('Chức năng khôi phục mật khẩu đang được cập nhật.')
                      }}
                    >
                      Quên mật khẩu?
                    </a>
                  </div>
                </td>
              </tr>

              {/* Remember Me Checkbox */}
              <tr>
                <td className="field-name"></td>
                <td className="field-value">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    Ghi nhớ đăng nhập trong 1 tháng
                  </label>
                </td>
              </tr>

              {/* Submit & Switch Links */}
              <tr>
                <td className="field-name"></td>
                <td className="field-value">
                  <div className="form-actions-row" style={{ padding: '4px 0' }}>
                    <button
                      type="submit"
                      className="btn-cf btn-cf-primary"
                      disabled={loading}
                    >
                      {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>

                    <span style={{ fontSize: '12px', color: '#555' }}>
                      Chưa có tài khoản?{' '}
                      <a
                        href="#register"
                        onClick={(e) => {
                          e.preventDefault()
                          onSwitchToRegister()
                        }}
                      >
                        Đăng ký ngay
                      </a>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </form>

        {/* Quick helper for testing */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '12px',
            borderTop: '1px dotted #ccc',
            fontSize: '11.5px',
            color: '#666',
          }}
        >
          <span>Gợi ý thử nhanh: </span>
          <a
            href="#demo"
            onClick={(e) => {
              e.preventDefault()
              handleFillDemo('admin@lotusoj.com', '123456')
            }}
            style={{ marginRight: '8px' }}
          >
            Điền tài khoản Admin mẫu
          </a>
          |
          <a
            href="#demo2"
            onClick={(e) => {
              e.preventDefault()
              handleFillDemo('user@lotusoj.com', '123456')
            }}
            style={{ marginLeft: '8px' }}
          >
            Điền tài khoản User mẫu
          </a>
        </div>
      </div>
    </div>
  )
}
