import { useEffect, useState } from 'react'
import { Header, type NavTab } from './components/Header'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'
import { Footer } from './components/Footer'
import { ProblemList } from './components/ProblemList'
import { ProblemDetail } from './components/ProblemDetail'
import { AdminPanel } from './components/AdminPanel'
import { authService } from './services/authService'
import type { UserResponse } from './types/auth'
import './App.css'

function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('problemset')
  const [user, setUser] = useState<UserResponse | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string>('two-sum')
  const [activeTagFilter, setActiveTagFilter] = useState<string>('')

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
      } else if (hash === 'admin' || hash === 'quan-tri') {
        setCurrentTab('admin')
      } else if (hash === 'home' || hash === 'trang-chu') {
        setCurrentTab('problemset')
      } else if (hash.startsWith('problem/')) {
        const slug = hash.replace('problem/', '')
        if (slug) {
          setSelectedSlug(slug)
          setCurrentTab('problem-detail')
        }
      } else if (hash === 'problemset' || hash === 'problems' || hash === 'kho-bai-tap') {
        setCurrentTab('problemset')
      } else if (hash === '') {
        // Default landing page
        setCurrentTab('problemset')
      }
    }

    const handleAuthExpired = () => {
      setUser(null)
      setActionNotice('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      setCurrentTab('login')
      window.location.hash = 'login'
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('lotusoj_auth_expired', handleAuthExpired)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('lotusoj_auth_expired', handleAuthExpired)
    }
  }, [])

  const handleNavigate = (tab: NavTab) => {
    setCurrentTab(tab)
    if (tab === 'problemset') {
      window.location.hash = 'problemset'
    } else if (tab === 'problem-detail') {
      window.location.hash = `problem/${selectedSlug}`
    } else {
      window.location.hash = tab
    }
    setActionNotice(null)
  }

  const handleSelectProblem = (slug: string) => {
    setSelectedSlug(slug)
    setCurrentTab('problem-detail')
    window.location.hash = `problem/${slug}`
  }

  const handleSelectTag = (tag: string) => {
    setActiveTagFilter(tag)
    setCurrentTab('problemset')
    window.location.hash = 'problemset'
  }

  const handleLoginSuccess = (loggedInUser: UserResponse, _token: string) => {
    setUser(loggedInUser)
    setActionNotice(`Chào mừng ${loggedInUser.username} đã quay trở lại hệ thống LotusOJ!`)
    setCurrentTab('problemset')
    window.location.hash = 'problemset'
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

        {currentTab === 'problemset' ? (
          <ProblemList
            onSelectProblem={handleSelectProblem}
            initialTag={activeTagFilter}
          />
        ) : currentTab === 'problem-detail' ? (
          <ProblemDetail
            slug={selectedSlug}
            onBack={() => handleNavigate('problemset')}
            onSelectTag={handleSelectTag}
          />
        ) : currentTab === 'admin' ? (
          user?.role === 'ADMIN' || user?.role === 'PROBLEM_SETTER' ? (
            <AdminPanel onViewProblem={handleSelectProblem} />
          ) : (
            <div className="roundbox">
              <div className="caption titled">
                <span>
                  <span className="caption-arrow">→</span> Quyền truy cập bị từ chối
                </span>
              </div>
              <div className="roundbox-body" style={{ textAlign: 'center', padding: '30px' }}>
                <h3 style={{ color: '#d32f2f', marginBottom: '8px' }}>Bạn không có quyền truy cập khu vực Quản trị</h3>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Khu vực này chỉ dành cho tài khoản có quyền <strong>Quản trị viên (ADMIN)</strong> hoặc <strong>Người tạo đề (PROBLEM_SETTER)</strong>.
                </p>
                <button
                  type="button"
                  className="btn-cf btn-cf-primary"
                  onClick={() => handleNavigate('login')}
                >
                  Đăng nhập tài khoản Quản trị
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="auth-view-wrapper" style={{ maxWidth: '680px', margin: '0 auto' }}>
            {/* Tab switch bar when not logged in */}
            {!user && (currentTab === 'login' || currentTab === 'register') && (
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
                      onClick={() => handleNavigate('problemset')}
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
        )}
      </main>

      {/* Codeforces Footer */}
      <Footer />
    </div>
  )
}

export default App

