import React, { useEffect, useState } from 'react'
import type { UserResponse } from '../types/auth'
import { authService } from '../services/authService'

interface UserProfileProps {
  initialUser: UserResponse | null
  onNavigate: (tab: any) => void
  onLogout: () => void
}

export const UserProfile: React.FC<UserProfileProps> = ({
  initialUser,
  onNavigate,
  onLogout,
}) => {
  const [profile, setProfile] = useState<UserResponse | null>(initialUser)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'account'>('overview')

  useEffect(() => {
    const fetchLatestProfile = async () => {
      setLoading(true)
      try {
        const fresh = await authService.getProfile()
        setProfile(fresh)
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLatestProfile()
  }, [])

  const user = profile || initialUser

  if (!user) {
    return (
      <div className="roundbox" style={{ maxWidth: '680px', margin: '30px auto', textAlign: 'center' }}>
        <div className="caption titled">
          <span>
            <span className="caption-arrow">→</span> Hồ sơ người dùng
          </span>
        </div>
        <div className="roundbox-body" style={{ padding: '30px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin hồ sơ cá nhân.
          </p>
          <button
            type="button"
            className="btn-cf btn-cf-primary"
            onClick={() => onNavigate('login')}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    )
  }

  const totalSolved = user.totalSolved ?? 0
  const totalSubmissions = user.totalSubmissions ?? 0
  const accuracyRate =
    totalSubmissions > 0
      ? ((totalSolved / totalSubmissions) * 100).toFixed(1)
      : '0.0'

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Không rõ'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return { text: 'Quản trị viên (ADMIN)', color: '#d32f2f', bg: '#ffebee' }
      case 'PROBLEM_SETTER':
        return { text: 'Người tạo đề (SETTER)', color: '#1976d2', bg: '#e3f2fd' }
      case 'CONTEST_MANAGER':
        return { text: 'Quản lý kỳ thi (MANAGER)', color: '#7b1fa2', bg: '#f3e5f5' }
      default:
        return { text: 'Thí sinh (USER)', color: '#2e7d32', bg: '#e8f5e9' }
    }
  }

  const roleInfo = getRoleLabel(user.role)

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      {error && (
        <div className="cf-notice cf-notice-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Main Profile Header Box */}
      <div className="roundbox highlight">
        <div className="caption titled">
          <span>
            <span className="caption-arrow">→</span> Hồ sơ cá nhân: {user.username}
          </span>
          {loading && <span style={{ fontSize: '11px', color: '#666' }}>Đang đồng bộ...</span>}
        </div>

        <div className="roundbox-body">
          <div className="profile-header-layout">
            {/* Avatar block */}
            <div className="profile-avatar-wrapper">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Main user summary */}
            <div className="profile-main-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 className="user-handle specialist" style={{ margin: 0, fontSize: '24px' }}>
                  {user.username}
                </h2>
                <span
                  style={{
                    backgroundColor: roleInfo.bg,
                    color: roleInfo.color,
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: `1px solid ${roleInfo.color}40`,
                  }}
                >
                  {roleInfo.text}
                </span>
                <span
                  style={{
                    backgroundColor: user.status === 'BANNED' ? '#ffebee' : '#e8f5e9',
                    color: user.status === 'BANNED' ? '#c62828' : '#2e7d32',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  {user.status || 'ACTIVE'}
                </span>
              </div>

              <div style={{ color: '#555', fontSize: '13px', marginTop: '6px' }}>
                Email: <strong>{user.email}</strong>
              </div>

              <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                Ngày tham gia: <strong>{formatDate(user.createdAt)}</strong>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="profile-header-actions">
              {(user.role === 'ADMIN' || user.role === 'PROBLEM_SETTER') && (
                <button
                  type="button"
                  className="btn-cf btn-cf-primary"
                  onClick={() => onNavigate('admin')}
                  style={{ width: '100%' }}
                >
                  Trang Quản trị
                </button>
              )}
              <button
                type="button"
                className="btn-cf"
                onClick={onLogout}
                style={{ width: '100%' }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#2e7d32' }}>
            {totalSolved}
          </div>
          <div className="stat-label">Bài giải thành công (AC)</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#1755a6' }}>
            {totalSubmissions}
          </div>
          <div className="stat-label">Tổng lượt nộp bài</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#e65100' }}>
            {accuracyRate}%
          </div>
          <div className="stat-label">Tỷ lệ chính xác (Accuracy)</div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="roundbox" style={{ marginTop: '20px' }}>
        <div className="caption" style={{ padding: 0 }}>
          <div style={{ display: 'flex' }}>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan năng lực
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Thông tin chi tiết
            </button>
          </div>
        </div>

        <div className="roundbox-body" style={{ padding: '20px' }}>
          {activeTab === 'overview' ? (
            <div>
              <h4 style={{ margin: '0 0 14px 0', color: '#1755a6', fontSize: '14px' }}>
                Hành trình giải thuật toán tại LotusOJ
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '4px', padding: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333', fontSize: '13px' }}>
                    Tiến độ hoàn thành bài tập
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#666', lineHeight: '1.6' }}>
                    Bạn đã giải quyết thành công <strong>{totalSolved}</strong> bài toán. Hãy tiếp tục giải thêm các bài tập trong kho đề để nâng cao kỹ năng tư duy thuật toán!
                  </div>
                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      className="btn-cf btn-cf-primary"
                      onClick={() => onNavigate('problemset')}
                    >
                      Đến kho bài tập ngay
                    </button>
                  </div>
                </div>

                <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '4px', padding: '16px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333', fontSize: '13px' }}>
                    Thông số kỹ năng & thuật toán
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {['Array', 'String', 'Dynamic Programming', 'Math', 'Sorting', 'Graph', 'Two Pointers'].map((tag) => (
                      <span key={tag} className="mini-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#777', marginTop: '12px' }}>
                    Hệ thống sẽ tự động cập nhật thống kê chi tiết theo từng chủ đề khi bạn nộp bài giải.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h4 style={{ margin: '0 0 14px 0', color: '#1755a6', fontSize: '14px' }}>
                Dữ liệu tài khoản trên hệ thống
              </h4>

              <table className="cf-form-table" style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td className="field-name">Mã định danh (ID):</td>
                    <td className="field-value">
                      <code className="slug-code">{user.id || 'N/A'}</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="field-name">Tên tài khoản (Username):</td>
                    <td className="field-value">
                      <strong>{user.username}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="field-name">Địa chỉ Email:</td>
                    <td className="field-value">{user.email}</td>
                  </tr>
                  <tr>
                    <td className="field-name">Vai trò hệ thống:</td>
                    <td className="field-value">
                      <span
                        style={{
                          backgroundColor: roleInfo.bg,
                          color: roleInfo.color,
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontSize: '11.5px',
                          fontWeight: 'bold',
                        }}
                      >
                        {roleInfo.text}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="field-name">Trạng thái hoạt động:</td>
                    <td className="field-value">
                      <span style={{ color: user.status === 'BANNED' ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}>
                        {user.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="field-name">Ngày tạo tài khoản:</td>
                    <td className="field-value">{formatDate(user.createdAt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
