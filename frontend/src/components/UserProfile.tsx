import React, { useEffect, useState } from 'react'
import type { UserResponse } from '../types/auth'
import type { SubmissionResponse } from '../types/submission'
import { authService } from '../services/authService'
import { submissionService } from '../services/submissionService'

interface UserProfileProps {
  initialUser: UserResponse | null
  onNavigate: (tab: any) => void
  onSelectProblem?: (slug: string) => void
  onLogout: () => void
}

export const UserProfile: React.FC<UserProfileProps> = ({
  initialUser,
  onNavigate,
  onSelectProblem,
  onLogout,
}) => {
  const [profile, setProfile] = useState<UserResponse | null>(initialUser)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'account'>('overview')
  const [recentSubmissions, setRecentSubmissions] = useState<SubmissionResponse[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false)

  const fetchProfileAndSubmissions = async () => {
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

    setLoadingSubmissions(true)
    try {
      const res = await submissionService.getMySubmissions({ size: 10, page: 0 })
      setRecentSubmissions(res.content || [])
    } catch {
      // ignore
    } finally {
      setLoadingSubmissions(false)
    }
  }

  useEffect(() => {
    fetchProfileAndSubmissions()
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

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const formatRuntime = (ms?: number | null) => {
    if (ms === null || ms === undefined) return '—'
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)} s`
    }
    return `${ms} ms`
  }

  const formatMemory = (kb?: number | null) => {
    if (kb === null || kb === undefined) return '—'
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(1)} MB`
    }
    return `${kb} KB`
  }

  const renderVerdictBadge = (sub: SubmissionResponse) => {
    if (sub.status === 'PENDING' || sub.status === 'JUDGING') {
      return (
        <span className="verdict-pending" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
          Đang chấm...
        </span>
      )
    }

    switch (sub.verdict) {
      case 'ACCEPTED':
        return (
          <span className="verdict-accepted" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            Accepted
          </span>
        )
      case 'WRONG_ANSWER':
        return (
          <span className="verdict-rejected" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            Wrong Answer
          </span>
        )
      case 'TIME_LIMIT_EXCEEDED':
        return (
          <span className="verdict-warning" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            Time Limit Exceeded
          </span>
        )
      case 'MEMORY_LIMIT_EXCEEDED':
        return (
          <span className="verdict-warning" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            Memory Limit Exceeded
          </span>
        )
      case 'COMPILATION_ERROR':
        return (
          <span className="verdict-compile-err" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            Compilation Error
          </span>
        )
      case 'RUNTIME_ERROR':
        return (
          <span className="verdict-rejected" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            Runtime Error
          </span>
        )
      default:
        return (
          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', background: '#f1f5f9', color: '#475569' }}>
            {sub.verdict || sub.status}
          </span>
        )
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

              {/* Recent Submissions Section */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#1755a6', fontSize: '14px' }}>
                    Lịch sử nộp bài gần đây
                  </h4>
                  <button
                    type="button"
                    className="btn-cf"
                    onClick={fetchProfileAndSubmissions}
                    disabled={loadingSubmissions}
                    style={{ fontSize: '11.5px', padding: '3px 10px' }}
                  >
                    {loadingSubmissions ? 'Đang tải...' : 'Làm mới'}
                  </button>
                </div>

                {loadingSubmissions ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Đang nạp lịch sử nộp bài...
                  </div>
                ) : recentSubmissions.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', background: '#f8f9fa', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ color: '#475569', fontWeight: 600, marginBottom: '6px' }}>Chưa có bài nộp nào</div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '12px' }}>
                      Bạn chưa nộp bài giải nào. Hãy bắt đầu thử sức với các bài tập thuật toán ngay hôm nay!
                    </div>
                    <button
                      type="button"
                      className="btn-cf btn-cf-primary"
                      onClick={() => onNavigate('problemset')}
                    >
                      Khám phá kho bài tập
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="problem-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '90px' }}>Mã nộp</th>
                          <th>Bài tập</th>
                          <th style={{ width: '150px', textAlign: 'center' }}>Kết quả</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Ngôn ngữ</th>
                          <th style={{ width: '110px', textAlign: 'center' }}>Thời gian</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Bộ nhớ</th>
                          <th style={{ width: '150px', textAlign: 'right' }}>Thời điểm nộp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSubmissions.map((sub) => {
                          const shortId = sub.id ? sub.id.substring(0, 8) : '—'
                          return (
                            <tr key={sub.id}>
                              <td style={{ fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#64748b' }}>
                                #{shortId}
                              </td>
                              <td>
                                {sub.problemSlug ? (
                                  <a
                                    href={`#problem/${sub.problemSlug}`}
                                    className="problem-title-link"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      if (onSelectProblem && sub.problemSlug) {
                                        onSelectProblem(sub.problemSlug)
                                      } else if (sub.problemSlug) {
                                        window.location.hash = `problem/${sub.problemSlug}`
                                      }
                                    }}
                                    style={{ fontWeight: 600 }}
                                  >
                                    {sub.problemTitle || sub.problemSlug}
                                  </a>
                                ) : (
                                  <span>{sub.problemTitle || 'Bài tập'}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {renderVerdictBadge(sub)}
                              </td>
                              <td style={{ textAlign: 'center', fontFamily: 'Consolas, monospace', fontSize: '12px' }}>
                                {sub.language}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: '12px', color: '#475569' }}>
                                {formatRuntime(sub.runtimeMs)}
                              </td>
                              <td style={{ textAlign: 'center', fontSize: '12px', color: '#475569' }}>
                                {formatMemory(sub.memoryKb)}
                              </td>
                              <td style={{ textAlign: 'right', fontSize: '11.5px', color: '#64748b' }}>
                                {formatDateTime(sub.submittedAt)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
