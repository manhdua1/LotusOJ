import React, { useEffect, useState } from 'react'
import type { ProblemDetailResponse, ProblemDifficulty } from '../types/problem'
import { problemService } from '../services/problemService'

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

  // Submit code mockup state
  const [selectedLanguage, setSelectedLanguage] = useState<string>('cpp20')
  const [sourceCode, setSourceCode] = useState<string>('')
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

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
            setError('Không thể tải thông tin đề bài.')
          }
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDetail()
    return () => {
      isMounted = false
    }
  }, [slug])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  const handleSubmitSolution = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceCode.trim()) {
      setSubmitStatus('Vui lòng nhập mã nguồn bài giải trước khi nộp.')
      return
    }

    setSubmitStatus('Đang gửi bài nộp đến hệ thống chấm bài (Judge Server)...')
    setTimeout(() => {
      setSubmitStatus('Bài nộp đã được tiếp nhận! Tính năng chấm tự động đang được kết nối.')
    }, 1200)
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

  const formatMemory = (kb: number) => {
    if (kb >= 1024) {
      return `${Math.round(kb / 1024)} MB`
    }
    return `${kb} KB`
  }

  const formatTime = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)} giây`
    }
    return `${ms} ms`
  }

  if (loading) {
    return (
      <div className="roundbox">
        <div className="roundbox-body loading-box">
          <div className="cf-spinner"></div>
          <span>Đang tải nội dung đề bài...</span>
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
            <div className="problem-section statement-section">
              <h3 className="section-title">Mô tả bài toán</h3>
              <div className="section-content text-formatted">
                {problem.statement.split('\n').map((para, i) => (
                  para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                ))}
              </div>
            </div>

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
                            {copiedId === `in-${idx}` ? '✓ Đã chép' : 'Sao chép'}
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
                            {copiedId === `out-${idx}` ? '✓ Đã chép' : 'Sao chép'}
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
                  {problem.acceptanceRate !== undefined ? `${problem.acceptanceRate}%` : '50%'}
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

          {/* Quick Submit Solution Card */}
          <div className="roundbox highlight">
            <div className="caption titled">
              <span>
                <span className="caption-arrow">→</span> Nộp bài giải (Submit)
              </span>
            </div>
            <div className="roundbox-body">
              <form onSubmit={handleSubmitSolution}>
                <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="select-lang" style={{ display: 'block', fontWeight: 'bold', fontSize: '11.5px', marginBottom: '4px' }}>
                    Ngôn ngữ lập trình:
                  </label>
                  <select
                    id="select-lang"
                    className="cf-input"
                    style={{ width: '100%' }}
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="cpp20">GNU C++20 (GCC 13.2)</option>
                    <option value="cpp17">GNU C++17 (GCC 11.2)</option>
                    <option value="java17">Java 17 (OpenJDK 17)</option>
                    <option value="python3">Python 3.11</option>
                    <option value="csharp">C# (.NET 8)</option>
                    <option value="pypy3">PyPy 3.9</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label htmlFor="source-code" style={{ display: 'block', fontWeight: 'bold', fontSize: '11.5px', marginBottom: '4px' }}>
                    Mã nguồn (Source code):
                  </label>
                  <textarea
                    id="source-code"
                    className="cf-input source-textarea"
                    placeholder="// Nhập hoặc dán mã nguồn bài giải tại đây..."
                    rows={8}
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                  />
                </div>

                {submitStatus && (
                  <div className="cf-notice cf-notice-info" style={{ fontSize: '11.5px', padding: '6px 8px' }}>
                    {submitStatus}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-cf btn-cf-primary"
                  style={{ width: '100%' }}
                >
                  Nộp bài chấm điểm
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
