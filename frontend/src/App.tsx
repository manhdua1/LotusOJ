import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { Sidebar } from './components/Sidebar'
import { Footer } from './components/Footer'
import { authService } from './services/authService'
import type { UserResponse } from './types/auth'
import './App.css'

function App() {
  const [currentTab, setCurrentTab] = useState<'login' | 'register' | 'home'>('login')
  const [user, setUser] = useState<UserResponse | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // Initialize auth state and hash routing
  useEffect(() => {
    const savedUser = authService.getUser()
    if (savedUser) {
      setUser(savedUser)
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'register' || hash === 'dang-ky') {
        setCurrentTab('register')
      } else if (hash === 'login' || hash === 'enter' || hash === 'dang-nhap') {
        setCurrentTab('login')
      } else if (hash === 'home' || hash === 'trang-chu') {
        setCurrentTab('home')
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleNavigate = (tab: 'login' | 'register' | 'home') => {
    setCurrentTab(tab)
    window.location.hash = tab
    setActionNotice(null)
  }

  const handleLoginSuccess = (loggedInUser: UserResponse, _token: string) => {
    setUser(loggedInUser)
    setActionNotice(`Chào mừng ${loggedInUser.username} đã quay trở lại hệ thống LotusOJ!`)
    setCurrentTab('home')
  }

  const handleRegisterSuccess = (registeredUser: UserResponse) => {
    setActionNotice(`Đăng ký thành công tài khoản "${registeredUser.username}". Vui lòng đăng nhập vào hệ thống!`)
    setCurrentTab('login')
    window.location.hash = 'login'
  }

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
    setActionNotice('Bạn đã đăng xuất khỏi hệ thống thành công.')
    setCurrentTab('login')
    window.location.hash = 'login'
  }

  return (
    <div className="page-container">
      {/* Codeforces Header */}
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="main-content">
        {actionNotice && (
          <div className="cf-notice cf-notice-info" style={{ marginBottom: '14px' }}>
            {actionNotice}
          </div>
        )}

        <div className="content-layout">
          {/* Left Column: Form or Content */}
          <div className="main-form-column">
            {/* Tab switch bar */}
            {!user && (
              <div className="auth-switch-bar">
                <button
                  type="button"
                  className={`auth-tab-btn ${currentTab === 'login' ? 'active' : ''}`}
                  onClick={() => handleNavigate('login')}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${currentTab === 'register' ? 'active' : ''}`}
                  onClick={() => handleNavigate('register')}
                >
                  Đăng ký tài khoản
                </button>
              </div>
            )}

            {/* View Switching */}
            {user && currentTab === 'home' ? (
              <div className="roundbox">
                <div className="caption titled">
                  <span>
                    <span className="caption-arrow">→</span> Bảng điều khiển cá nhân
                  </span>
                </div>
                <div className="roundbox-body welcome-user-card">
                  <h3>Xin chào, <span className="user-handle specialist">{user.username}</span>!</h3>
                  <div className="user-badge">
                    Điểm Rating: {user.rating || 1500} ({user.rank || 'Chuyên viên'})
                  </div>
                  <p style={{ color: '#666', marginTop: '10px', fontSize: '13px' }}>
                    Email tài khoản: <strong>{user.email}</strong>
                  </p>
                  <p style={{ color: '#888', marginTop: '6px', fontSize: '12px' }}>
                    Bạn đã đăng nhập thành công vào LotusOJ. Hãy bắt đầu giải các bài toán tại mục <strong>KHO BÀI TẬP</strong> hoặc thử thách bản thân trong các <strong>KỲ THI</strong> sắp tới.
                  </p>

                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn-cf btn-cf-primary"
                      onClick={() => alert('Mục Kho bài tập đang được cập nhật.')}
                    >
                      Xem kho bài tập
                    </button>
                    <button
                      type="button"
                      className="btn-cf"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : currentTab === 'register' ? (
              <RegisterForm
                onSuccess={handleRegisterSuccess}
                onSwitchToLogin={() => handleNavigate('login')}
              />
            ) : (
              <LoginForm
                onSuccess={handleLoginSuccess}
                onSwitchToRegister={() => handleNavigate('register')}
              />
            )}
          </div>

          {/* Right Column: Codeforces Info Sidebar */}
          <Sidebar />
        </div>
      </main>

      {/* Codeforces Footer */}
      <Footer />
    </div>
  )
}

export default App
