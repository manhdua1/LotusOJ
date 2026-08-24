import React, { useEffect, useState, useRef } from 'react'
import type { ProblemDetailResponse, ProblemDifficulty } from '../types/problem'
import type { Language, SubmissionResponse, Verdict } from '../types/submission'
import { problemService } from '../services/problemService'
import { submissionService } from '../services/submissionService'
import { authService } from '../services/authService'

interface ProblemDetailProps {
  slug: string
  onBack: () => void
  onSelectTag?: (tag: string) => void
}

export const ProblemDetail: React.FC<ProblemDetailProps> = ({
  slug,
  onBack,
  onSelectTag,
}) => {
  const [problem, setProblem] = useState<ProblemDetailResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Submit code state
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('CPP')
  const [sourceCode, setSourceCode] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [currentSubmission, setCurrentSubmission] = useState<SubmissionResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const pollIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await problemService.getProblemBySlug(slug)
        if (isMounted) {
          setProblem(data)
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError('Không thể tải thông tin bài tập.')
          }
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDetail()
    return () => {
      isMounted = false
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [slug])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  const startPollingSubmission = (submissionId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    let pollAttempts = 0
    const maxAttempts = 30

    pollIntervalRef.current = window.setInterval(async () => {
      pollAttempts++
      try {
        const sub = await submissionService.getSubmission(submissionId)
        setCurrentSubmission(sub)

        if (sub.status === 'DONE' || sub.status === 'FAILED' || pollAttempts >= maxAttempts) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setSubmitting(false)
        }
      } catch {
        if (pollAttempts >= maxAttempts && pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
          setSubmitting(false)
        }
      }
    }, 1000)
  }

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!authService.isAuthenticated()) {
      setSubmitError('Bạn cần đăng nhập tài khoản để nộp bài chấm điểm!')
      return
    }

    if (!sourceCode.trim()) {
      setSubmitError('Vui lòng nhập mã nguồn bài giải trước khi nộp.')
      return
    }

    if (!problem?.id) {
      setSubmitError('Không tìm thấy thông tin bài tập để nộp.')
      return
    }

    setSubmitting(true)
    setCurrentSubmission(null)

    try {
      const sub = await submissionService.submitSolution({
        problemId: problem.id,
        language: selectedLanguage,
        sourceCode: sourceCode.trim(),
      })
      setCurrentSubmission(sub)

      if (sub.status === 'DONE' || sub.status === 'FAILED') {
        setSubmitting(false)
      } else {
        startPollingSubmission(sub.id)
      }
    } catch (err: unknown) {
      setSubmitting(false)
      if (err instanceof Error) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Lỗi kết nối khi gửi bài nộp.')
      }
    }
  }

  const getDifficultyBadge = (diff: ProblemDifficulty) => {
    switch (diff) {
      case 'EASY':
        return <span className="diff-badge diff-easy">Dễ (Easy)</span>
      case 'MEDIUM':
        return <span className="diff-badge diff-medium">Trung bình (Medium)</span>
      case 'HARD':
        return <span className="diff-badge diff-hard">Khó (Hard)</span>
      default:
        return <span className="diff-badge">{diff}</span>
    }
  }

  const getVerdictBadge = (verdict: Verdict | null, status: string) => {
    if (status === 'PENDING') {
      return <span style={{ color: '#888', fontWeight: 'bold' }}>Đang xếp hàng chờ chấm...</span>
    }
    if (status === 'JUDGING') {
      return <span style={{ color: '#0066cc', fontWeight: 'bold' }}>Đang chấm bài...</span>
    }

    if (!verdict) {
      return <span style={{ color: '#888' }}>{status}</span>
    }

    switch (verdict) {
      case 'ACCEPTED':
        return <span style={{ color: '#0a8020', fontWeight: 'bold', fontSize: '13px' }}>Chấp nhận (Accepted)</span>
      case 'WRONG_ANSWER':
        return <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '13px' }}>Sai kết quả (Wrong Answer)</span>
      case 'TIME_LIMIT_EXCEEDED':
        return <span style={{ color: '#ed6c02', fontWeight: 'bold', fontSize: '13px' }}>Quá thời gian (Time Limit Exceeded)</span>
      case 'MEMORY_LIMIT_EXCEEDED':
        return <span style={{ color: '#ed6c02', fontWeight: 'bold', fontSize: '13px' }}>Quá bộ nhớ (Memory Limit Exceeded)</span>
      case 'COMPILATION_ERROR':
        return <span style={{ color: '#9c27b0', fontWeight: 'bold', fontSize: '13px' }}>Lỗi biên dịch (Compilation Error)</span>
      case 'RUNTIME_ERROR':
        return <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '13px' }}>Lỗi thực thi (Runtime Error)</span>
      case 'OUTPUT_LIMIT_EXCEEDED':
        return <span style={{ color: '#ed6c02', fontWeight: 'bold', fontSize: '13px' }}>Quá dung lượng đầu ra (Output Limit)</span>
      case 'INTERNAL_ERROR':
        return <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '13px' }}>Lỗi hệ thống máy chấm (Internal Error)</span>
      default:
        return <span style={{ fontWeight: 'bold' }}>{verdict}</span>
    }
  }

  const formatMemory = (kb?: number | null) => {
    if (!kb) return '—'
    if (kb >= 1024) {
      return `${Math.round(kb / 1024)} MB`
    }
    return `${kb} KB`
  }

  const formatTime = (ms?: number | null) => {
    if (ms === null || ms === undefined) return '—'
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)} s`
    }
    return `${ms} ms`
  }

  if (loading) {
    return (
      <div className="roundbox">
        <div className="roundbox-body loading-box">
          <div className="cf-spinner"></div>
          <span>Đang tải nội dung đề bài từ hệ thống...</span>
        </div>
      </div>
    )
  }

  if (error || !problem) {
    return (
      <div className="roundbox">
        <div className="caption titled">
          <span>
            <span className="caption-arrow">→</span> Thông báo lỗi
          </span>
        </div>
        <div className="roundbox-body">
          <div className="cf-notice cf-notice-error">
            {error || 'Không tìm thấy bài tập yêu cầu.'}
          </div>
          <button type="button" className="btn-cf" onClick={onBack}>
            ← Quay lại Kho bài tập
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="problem-detail-layout">
      {/* Navigation Breadcrumb */}
      <div className="problem-breadcrumb">
        <button type="button" className="back-link-btn" onClick={onBack}>
          ← Quay lại Kho bài tập
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{problem.title}</span>
      </div>

      <div className="problem-columns-grid">
        {/* Left Column: Problem Statement */}
        <div className="problem-statement-column">
          <div className="roundbox problem-statement-card">
            {/* Header: Title & Limits */}
            <div className="problem-header-block">
              <h1 className="problem-title">{problem.title}</h1>
              <div className="problem-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Giới hạn thời gian:</span>
                  <span className="meta-value">{formatTime(problem.timeLimitMs)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Giới hạn bộ nhớ:</span>
                  <span className="meta-value">{formatMemory(problem.memoryLimitKb)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Đầu vào:</span>
                  <span className="meta-value">standard input</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Đầu ra:</span>
                  <span className="meta-value">standard output</span>
                </div>
              </div>
            </div>

            {/* Statement Text */}
            {problem.statement && (
              <div className="problem-section statement-section">
                <h3 className="section-title">Mô tả bài toán</h3>
                <div className="section-content text-formatted">
                  {problem.statement.split('\n').map((para, i) => (
                    para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Input Format */}
            {problem.inputFormat && (
              <div className="problem-section">
                <h3 className="section-title">Định dạng đầu vào (Input)</h3>
                <div className="section-content text-formatted">
                  {problem.inputFormat.split('\n').map((para, i) => (
                    para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Output Format */}
            {problem.outputFormat && (
              <div className="problem-section">
                <h3 className="section-title">Định dạng đầu ra (Output)</h3>
                <div className="section-content text-formatted">
                  {problem.outputFormat.split('\n').map((para, i) => (
                    para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && (
              <div className="problem-section">
                <h3 className="section-title">Ràng buộc dữ liệu (Constraints)</h3>
                <div className="section-content constraints-box">
                  {problem.constraints.split('\n').map((line, i) => (
                    line.trim() ? <div key={i} className="constraint-line">{line}</div> : null
                  ))}
                </div>
              </div>
            )}

            {/* Sample Test Cases */}
            {problem.sampleTestCases && problem.sampleTestCases.length > 0 && (
              <div className="problem-section sample-tests-section">
                <h3 className="section-title">Ví dụ mẫu (Sample Tests)</h3>
                {problem.sampleTestCases.map((tc, idx) => (
                  <div key={tc.id || idx} className="sample-case-container">
                    <div className="sample-case-header">Ví dụ {idx + 1}</div>
                    <div className="sample-case-grid">
                      {/* Input Block */}
                      <div className="sample-block">
                        <div className="sample-block-title">
                          <span>Đầu vào (Input)</span>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() => handleCopy(tc.input, `in-${idx}`)}
                            title="Sao chép đầu vào"
                          >
                            {copiedId === `in-${idx}` ? 'Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                        <pre className="sample-code">{tc.input}</pre>
                      </div>

                      {/* Output Block */}
                      <div className="sample-block">
                        <div className="sample-block-title">
                          <span>Đầu ra (Output)</span>
                          <button
                            type="button"
                            className="copy-btn"
                            onClick={() => handleCopy(tc.expectedOutput, `out-${idx}`)}
                            title="Sao chép đầu ra"
                          >
                            {copiedId === `out-${idx}` ? 'Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                        <pre className="sample-code">{tc.expectedOutput}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Explanation Note */}
            {problem.explanationNote && (
              <div className="problem-section explanation-section">
                <h3 className="section-title">Ghi chú & Giải thích</h3>
                <div className="section-content text-formatted">
                  {problem.explanationNote.split('\n').map((para, i) => (
                    para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Problem Sidebar & Submit */}
        <div className="problem-sidebar-column">
          {/* Problem Info Card */}
          <div className="roundbox">
            <div className="caption titled">
              <span>
                <span className="caption-arrow">→</span> Thông tin bài tập
              </span>
            </div>
            <div className="roundbox-body problem-info-body">
              <div className="sidebar-info-row">
                <span className="info-label">Độ khó:</span>
                <div>{getDifficultyBadge(problem.difficulty)}</div>
              </div>
              <div className="sidebar-info-row">
                <span className="info-label">Tỷ lệ AC:</span>
                <span className="info-val-strong">
                  {problem.acceptanceRate !== undefined && problem.acceptanceRate !== null
                    ? `${problem.acceptanceRate.toFixed(1)}%`
                    : '—'}
                </span>
              </div>
              <div className="sidebar-info-row">
                <span className="info-label">Mã bài (Slug):</span>
                <code className="slug-code">{problem.slug}</code>
              </div>

              {problem.tags && problem.tags.length > 0 && (
                <div className="sidebar-tags-section">
                  <span className="info-label">Chủ đề (Tags):</span>
                  <div className="tags-cloud" style={{ marginTop: '6px' }}>
                    {problem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="tag-pill"
                        style={{ cursor: onSelectTag ? 'pointer' : 'default' }}
                        onClick={() => onSelectTag && onSelectTag(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Solution Submit Card */}
          <div className="roundbox highlight">
            <div className="caption titled">
              <span>
                <span className="caption-arrow">→</span> Nộp bài giải (Submit)
              </span>
            </div>
            <div className="roundbox-body">
              <form onSubmit={handleSubmitSolution}>
                <div style={{ marginBottom: '10px' }}>
                  <label
                    htmlFor="select-lang"
                    style={{ display: 'block', fontWeight: 'bold', fontSize: '11.5px', marginBottom: '4px' }}
                  >
                    Ngôn ngữ lập trình:
                  </label>
                  <select
                    id="select-lang"
                    className="cf-input"
                    style={{ width: '100%' }}
                    value={selectedLanguage}
                    disabled={submitting}
                    onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                  >
                    <option value="CPP">C++ (GCC 13.2)</option>
                    <option value="JAVA">Java 17 (OpenJDK)</option>
                    <option value="PYTHON">Python 3.11</option>
                    <option value="C">C (GCC 13.2)</option>
                    <option value="CSHARP">C# (.NET 8)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label
                    htmlFor="source-code"
                    style={{ display: 'block', fontWeight: 'bold', fontSize: '11.5px', marginBottom: '4px' }}
                  >
                    Mã nguồn (Source code):
                  </label>
                  <textarea
                    id="source-code"
                    className="cf-input source-textarea"
                    placeholder="// Nhập hoặc dán mã nguồn bài giải tại đây..."
                    rows={8}
                    value={sourceCode}
                    disabled={submitting}
                    onChange={(e) => setSourceCode(e.target.value)}
                  />
                </div>

                {submitError && (
                  <div
                    className="cf-notice cf-notice-error"
                    style={{ fontSize: '11.5px', padding: '6px 8px', marginBottom: '10px' }}
                  >
                    {submitError}
                  </div>
                )}

                {currentSubmission && (
                  <div
                    className="roundbox"
                    style={{
                      marginBottom: '12px',
                      background: '#fafafa',
                      border: '1px solid #ddd',
                    }}
                  >
                    <div className="caption" style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>
                      Kết quả chấm bài
                    </div>
                    <div style={{ padding: '8px', fontSize: '12px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        Trạng thái: {getVerdictBadge(currentSubmission.verdict, currentSubmission.status)}
                      </div>
                      {currentSubmission.runtimeMs !== null && currentSubmission.runtimeMs !== undefined && (
                        <div style={{ color: '#555' }}>Thời gian: {currentSubmission.runtimeMs} ms</div>
                      )}
                      {currentSubmission.memoryKb !== null && currentSubmission.memoryKb !== undefined && (
                        <div style={{ color: '#555' }}>Bộ nhớ: {formatMemory(currentSubmission.memoryKb)}</div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-cf btn-cf-primary"
                  style={{ width: '100%' }}
                  disabled={submitting}
                >
                  {submitting ? 'Đang chấm điểm...' : 'Nộp bài chấm điểm'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
