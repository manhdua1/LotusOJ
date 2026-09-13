import React, { useEffect, useState, useCallback } from 'react'
import type { Language, SubmissionResponse, Verdict } from '../types/submission'
import type { UserResponse } from '../types/auth'
import { submissionService } from '../services/submissionService'

interface SubmissionListProps {
  onSelectProblem: (slug: string) => void
  user: UserResponse | null
  onRequireLogin: () => void
  initialProblemSlug?: string
}

export const SubmissionList: React.FC<SubmissionListProps> = ({
  onSelectProblem,
  user,
  onRequireLogin,
  initialProblemSlug = '',
}) => {
  // Scope: 'my' (Bài nộp của tôi) or 'all' (Tất cả bài nộp)
  const [scope, setScope] = useState<'my' | 'all'>(user ? 'my' : 'all')

  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [problemSlug, setProblemSlug] = useState<string>(initialProblemSlug)
  const [selectedLanguage, setSelectedLanguage] = useState<Language | ''>('')
  const [selectedVerdict, setSelectedVerdict] = useState<Verdict | ''>('')

  // Pagination state
  const [page, setPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const pageSize = 20

  // Modal for view compile error log
  const [selectedErrorLog, setSelectedErrorLog] = useState<{ id: string; log: string } | null>(null)
  const [copiedLog, setCopiedLog] = useState<boolean>(false)

  const fetchSubmissions = useCallback(async () => {
    // If scope is 'my' but not logged in, stop loading
    if (scope === 'my' && !user) {
      setLoading(false)
      setSubmissions([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        size: pageSize,
        problemSlug: problemSlug.trim() || undefined,
        language: selectedLanguage || undefined,
        verdict: selectedVerdict || undefined,
      }

      const res = scope === 'my'
        ? await submissionService.getMySubmissions(params)
        : await submissionService.getAllSubmissions(params)

      setSubmissions(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không thể tải danh sách bài nộp. Vui lòng thử lại!')
      }
    } finally {
      setLoading(false)
    }
  }, [scope, user, page, problemSlug, selectedLanguage, selectedVerdict])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchSubmissions()
  }

  const handleResetFilter = () => {
    setProblemSlug('')
    setSelectedLanguage('')
    setSelectedVerdict('')
    setPage(0)
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

  const formatMemory = (kb?: number | null) => {
    if (!kb) return '—'
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(1)} MB`
    }
    return `${kb} KB`
  }

  const getVerdictBadge = (sub: SubmissionResponse) => {
    const { status, verdict } = sub
    if (status === 'PENDING') {
      return <span style={{ color: '#888', fontWeight: 'bold' }}>Đang chờ chấm...</span>
    }
    if (status === 'JUDGING') {
      return <span style={{ color: '#0066cc', fontWeight: 'bold' }}>Đang chấm bài...</span>
    }

    if (!verdict) {
      return <span style={{ color: '#777' }}>{status}</span>
    }

    switch (verdict) {
      case 'ACCEPTED':
        return (
          <span style={{ color: '#0a8020', fontWeight: 'bold' }} title="Accepted">
            Accepted
          </span>
        )
      case 'WRONG_ANSWER':
        return (
          <span style={{ color: '#d32f2f', fontWeight: 'bold' }} title="Wrong Answer">
            Wrong Answer
          </span>
        )
      case 'TIME_LIMIT_EXCEEDED':
        return (
          <span style={{ color: '#ed6c02', fontWeight: 'bold' }} title="Time Limit Exceeded">
            Time Limit Exceeded
          </span>
        )
      case 'MEMORY_LIMIT_EXCEEDED':
        return (
          <span style={{ color: '#ed6c02', fontWeight: 'bold' }} title="Memory Limit Exceeded">
            Memory Limit Exceeded
          </span>
        )
      case 'COMPILATION_ERROR':
        return (
          <button
            type="button"
            style={{
              background: '#f3e5f5',
              border: '1px solid #ce93d8',
              color: '#7b1fa2',
              fontWeight: 'bold',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: sub.compileErrorLog ? 'pointer' : 'default',
              fontSize: '11.5px',
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (sub.compileErrorLog) {
                setSelectedErrorLog({ id: sub.id, log: sub.compileErrorLog })
              }
            }}
            title={sub.compileErrorLog ? 'Nhấn để xem chi tiết log lỗi biên dịch' : 'Compilation Error'}
          >
            Compilation Error {sub.compileErrorLog && '🔍'}
          </button>
        )
      case 'RUNTIME_ERROR':
        return (
          <span style={{ color: '#d32f2f', fontWeight: 'bold' }} title="Runtime Error">
            Runtime Error
          </span>
        )
      case 'OUTPUT_LIMIT_EXCEEDED':
        return (
          <span style={{ color: '#ed6c02', fontWeight: 'bold' }} title="Output Limit Exceeded">
            Output Limit Exceeded
          </span>
        )
      case 'INTERNAL_ERROR':
        return (
          <span style={{ color: '#d32f2f', fontWeight: 'bold' }} title="Internal Error">
            Internal Error
          </span>
        )
      default:
        return <span>{verdict}</span>
    }
  }

  const handleCopyErrorLog = () => {
    if (selectedErrorLog?.log) {
      navigator.clipboard.writeText(selectedErrorLog.log)
      setCopiedLog(true)
      setTimeout(() => setCopiedLog(false), 2000)
    }
  }

  return (
    <div className="problemset-container">
      {/* Top Controls & Scope Switcher */}
      <div className="roundbox" style={{ marginBottom: '14px' }}>
        <div className="caption titled" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <span className="caption-arrow">→</span> Danh sách bài nộp ({totalElements} bài)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn-cf ${scope === 'my' ? 'btn-cf-primary' : ''}`}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
              onClick={() => {
                setScope('my')
                setPage(0)
              }}
            >
              Bài nộp của tôi
            </button>
            <button
              type="button"
              className={`btn-cf ${scope === 'all' ? 'btn-cf-primary' : ''}`}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
              onClick={() => {
                setScope('all')
                setPage(0)
              }}
            >
              Tất cả bài nộp
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar-body">
          <form className="problem-filter-form" onSubmit={handleFilterSubmit}>
            <div className="filter-group">
              <label htmlFor="filter-problem-slug" className="filter-label">
                Mã bài tập (slug):
              </label>
              <input
                id="filter-problem-slug"
                type="text"
                className="cf-input filter-input"
                placeholder="VD: binary-search..."
                value={problemSlug}
                onChange={(e) => setProblemSlug(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="filter-language" className="filter-label">
                Ngôn ngữ:
              </label>
              <select
                id="filter-language"
                className="cf-input filter-select"
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value as Language | '')
                  setPage(0)
                }}
              >
                <option value="">Tất cả ngôn ngữ</option>
                <option value="CPP">C++</option>
                <option value="JAVA">Java</option>
                <option value="PYTHON">Python</option>
                <option value="C">C</option>
                <option value="CSHARP">C#</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-verdict" className="filter-label">
                Kết quả (Verdict):
              </label>
              <select
                id="filter-verdict"
                className="cf-input filter-select"
                style={{ width: '160px' }}
                value={selectedVerdict}
                onChange={(e) => {
                  setSelectedVerdict(e.target.value as Verdict | '')
                  setPage(0)
                }}
              >
                <option value="">Tất cả kết quả</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="WRONG_ANSWER">Wrong Answer</option>
                <option value="TIME_LIMIT_EXCEEDED">Time Limit Exceeded</option>
                <option value="MEMORY_LIMIT_EXCEEDED">Memory Limit Exceeded</option>
                <option value="COMPILATION_ERROR">Compilation Error</option>
                <option value="RUNTIME_ERROR">Runtime Error</option>
              </select>
            </div>

            <div className="filter-actions">
              <button type="submit" className="btn-cf btn-cf-primary">
                Lọc
              </button>
              {(problemSlug || selectedLanguage || selectedVerdict) && (
                <button type="button" className="btn-cf" onClick={handleResetFilter}>
                  Xóa lọc
                </button>
              )}
              <button
                type="button"
                className="btn-cf"
                onClick={fetchSubmissions}
                title="Làm mới danh sách"
              >
                ↻ Làm mới
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Submissions Table */}
      <div className="roundbox">
        {scope === 'my' && !user ? (
          <div className="roundbox-body empty-state-box" style={{ padding: '30px', textAlign: 'center' }}>
            <h4 style={{ marginBottom: '10px' }}>Yêu cầu đăng nhập</h4>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Bạn cần đăng nhập tài khoản để xem lại các bài nộp cá nhân của mình.
            </p>
            <button type="button" className="btn-cf btn-cf-primary" onClick={onRequireLogin}>
              Đăng nhập ngay
            </button>
          </div>
        ) : loading ? (
          <div className="roundbox-body loading-box">
            <div className="cf-spinner"></div>
            <span>Đang tải lịch sử bài nộp từ hệ thống...</span>
          </div>
        ) : error ? (
          <div className="roundbox-body">
            <div className="cf-notice cf-notice-error">{error}</div>
            <button type="button" className="btn-cf" onClick={fetchSubmissions}>
              Thử lại
            </button>
          </div>
        ) : submissions.length === 0 ? (
          <div className="roundbox-body empty-state-box">
            <h4>Chưa có bài nộp nào phù hợp</h4>
            <p>
              {scope === 'my'
                ? 'Bạn chưa nộp bài giải nào cho bộ lọc này. Hãy vào Kho bài tập để làm bài!'
                : 'Hệ thống chưa ghi nhận bài nộp nào cho tiêu chí tìm kiếm này.'}
            </p>
            {(problemSlug || selectedLanguage || selectedVerdict) && (
              <button type="button" className="btn-cf" onClick={handleResetFilter}>
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="problem-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>#ID</th>
                  <th style={{ width: '150px' }}>Thời gian nộp</th>
                  {scope === 'all' && <th style={{ width: '130px' }}>Thí sinh</th>}
                  <th>Bài tập</th>
                  <th style={{ width: '85px', textAlign: 'center' }}>Ngôn ngữ</th>
                  <th style={{ width: '165px' }}>Kết quả</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Số test</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Thời gian</th>
                  <th style={{ width: '85px', textAlign: 'right' }}>Bộ nhớ</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const shortId = sub.id ? sub.id.substring(0, 8) : '—'

                  return (
                    <tr key={sub.id} className="problem-row">
                      <td style={{ textAlign: 'center', fontFamily: 'monospace', color: '#666' }} title={sub.id}>
                        {shortId}
                      </td>
                      <td style={{ fontSize: '11.5px', color: '#555' }}>
                        {formatDateTime(sub.submittedAt)}
                      </td>
                      {scope === 'all' && (
                        <td>
                          <span className="user-handle specialist" style={{ fontWeight: 'bold' }}>
                            {sub.username || '—'}
                          </span>
                        </td>
                      )}
                      <td>
                        <a
                          href={`#problem/${sub.problemSlug || sub.problemId}`}
                          style={{ fontWeight: 'bold', color: '#1755a6' }}
                          onClick={(e) => {
                            e.preventDefault()
                            if (sub.problemSlug) {
                              onSelectProblem(sub.problemSlug)
                            }
                          }}
                          title={`Xem đề bài: ${sub.problemTitle || sub.problemSlug}`}
                        >
                          {sub.problemTitle || sub.problemSlug || sub.problemId}
                        </a>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', color: '#444' }}>
                        {sub.language}
                      </td>
                      <td>
                        {getVerdictBadge(sub)}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#444' }}>
                        {sub.totalTestCount !== null && sub.totalTestCount !== undefined && sub.totalTestCount > 0
                          ? `${sub.passTestCount || 0}/${sub.totalTestCount}`
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '12px', color: '#555' }}>
                        {sub.runtimeMs !== null && sub.runtimeMs !== undefined ? `${sub.runtimeMs} ms` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '12px', color: '#555' }}>
                        {formatMemory(sub.memoryKb)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button
              type="button"
              className="pagination-btn"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Trang trước
            </button>

            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => i).map((pIndex) => (
                <button
                  key={pIndex}
                  type="button"
                  className={`pagination-number ${page === pIndex ? 'active' : ''}`}
                  onClick={() => setPage(pIndex)}
                >
                  {pIndex + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pagination-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>

      {/* Modal: View Compilation Error Log */}
      {selectedErrorLog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedErrorLog(null)}
        >
          <div
            className="roundbox"
            style={{
              width: '750px',
              maxWidth: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="caption titled"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
              }}
            >
              <span>
                <span className="caption-arrow">→</span> Chi tiết lỗi biên dịch (Compilation Error)
              </span>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#666',
                }}
                onClick={() => setSelectedErrorLog(null)}
              >
                ✕
              </button>
            </div>
            <div
              className="roundbox-body"
              style={{
                padding: '14px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              <pre
                style={{
                  background: '#1e1e1e',
                  color: '#f8f8f2',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  margin: 0,
                  maxHeight: '55vh',
                  overflowY: 'auto',
                }}
              >
                {selectedErrorLog.log || 'Không có thông tin chi tiết.'}
              </pre>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '12px',
                }}
              >
                <button
                  type="button"
                  className="btn-cf"
                  onClick={handleCopyErrorLog}
                >
                  {copiedLog ? '✓ Đã sao chép' : 'Sao chép log lỗi'}
                </button>
                <button
                  type="button"
                  className="btn-cf btn-cf-primary"
                  onClick={() => setSelectedErrorLog(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
