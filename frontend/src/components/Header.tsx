import React, { useState } from 'react'
import type { UserResponse } from '../types/auth'

export type NavTab = 'login' | 'register' | 'home' | 'problemset' | 'problem-detail' | 'admin'

interface HeaderProps {
  currentTab: NavTab | string
  onNavigate: (tab: NavTab) => void
  user: UserResponse | null
  onLogout: () => void
  onSearchProblem?: (keyword: string) => void
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  user,
  onLogout,
  onSearchProblem,
}) => {
  const [headerSearch, setHeaderSearch] = useState('')

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (onSearchProblem) {
        onSearchProblem(headerSearch)
      }
      onNavigate('problemset')
    }
  }

  return (
    <header className="site-header">
      {/* Top Bar */}
      <div className="header-top">
        <a
          href="#problemset"
          className="logo-area"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('problemset')
          }}
          title="LotusOJ Problemset"
        >
          <div className="logo-icon-wrap" aria-hidden="true">
            <div className="cf-bar cf-bar-1"></div>
            <div className="cf-bar cf-bar-2"></div>
            <div className="cf-bar cf-bar-3"></div>
          </div>
          <div>
            <div className="lotus-brand">
              <span className="brand-part1">Lotus</span>
              <span className="brand-part2">OJ</span>
            </div>
            <span className="brand-subtitle">
              Nền tảng thi đấu lập trình trực tuyến
            </span>
          </div>
        </a>

        <div className="header-meta">
          <div className="header-lang">
            <span style={{ color: '#555' }}>Ngôn ngữ: </span>
            <span style={{ fontWeight: 'bold', color: '#111' }}>Tiếng Việt</span>
          </div>

          <div className="header-auth">
            {user ? (
              <div className="header-user-info">
                <span>Xin chào,</span>
                <span className="user-handle specialist">{user.username}</span>
                <span>|</span>
                <button
                  type="button"
                  className="logout-btn"
                  onClick={onLogout}
                  title="Đăng xuất khỏi hệ thống"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div>
                <a
                  href="#login"
                  style={{
                    fontWeight: currentTab === 'login' ? 'bold' : 'normal',
                    color: currentTab === 'login' ? '#111' : '#1755a6',
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate('login')
                  }}
                >
                  Đăng nhập
                </a>
                {' | '}
                <a
                  href="#register"
                  style={{
                    fontWeight: currentTab === 'register' ? 'bold' : 'normal',
                    color: currentTab === 'register' ? '#111' : '#1755a6',
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate('register')
                  }}
                >
                  Đăng ký
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="main-nav" aria-label="Điều hướng chính">
        <ul className="nav-links">
          <li className={`nav-item ${currentTab === 'problemset' || currentTab === 'problem-detail' ? 'active' : ''}`}>
            <button type="button" onClick={() => onNavigate('problemset')}>
              KHO BÀI TẬP
            </button>
          </li>
          <li className="nav-item">
            <button type="button" onClick={(e) => e.preventDefault()}>
              KỲ THI
            </button>
          </li>
          {(user?.role === 'ADMIN' || user?.role === 'PROBLEM_SETTER') && (
            <li className={`nav-item ${currentTab === 'admin' ? 'active' : ''}`}>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
              >
                QUẢN TRỊ
              </button>
            </li>
          )}
        </ul>

        <div className="nav-search">
          <input
            type="text"
            placeholder="Tìm kiếm bài tập..."
            aria-label="Tìm kiếm bài tập"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            onKeyDown={handleSearchSubmit}
          />
        </div>
      </nav>
    </header>
  )
}

