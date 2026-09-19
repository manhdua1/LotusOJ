import React, { useEffect, useState, useRef } from 'react'
import type { ProblemDetailResponse, ProblemDifficulty } from '../types/problem'
import type { Language, SubmissionResponse, Verdict } from '../types/submission'
import { problemService } from '../services/problemService'
import { submissionService } from '../services/submissionService'
import { authService } from '../services/authService'
import { CodeEditor } from './CodeEditor'
import { CODE_TEMPLATES } from '../constants/editorTemplates'
import {
  IconArrowLeft,
  IconClock,
  IconMemory,
  IconCopy,
  IconCheck,
  IconSend,
  IconExpand,
  IconCompress,
  IconTerminal,
  IconFileText,
  IconCode,
  IconAlertCircle,
  IconSpinner,
} from './Icons'

interface ProblemDetailProps {
  slug: string
  onBack: () => void
  onSelectTag?: (tag: string) => void
}

type ProblemTab = 'description' | 'testcases' | 'info'
type ConsoleTab = 'result' | 'sampletests'

export const ProblemDetail: React.FC<ProblemDetailProps> = ({
  slug,
  onBack,
  onSelectTag,
}) => {
  const [problem, setProblem] = useState<ProblemDetailResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Tabs state
  const [activeProblemTab, setActiveProblemTab] = useState<ProblemTab>('description')
  const [activeConsoleTab, setActiveConsoleTab] = useState<ConsoleTab>('result')
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0)

  // Submit code state
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('CPP')
  const [sourceCode, setSourceCode] = useState<string>(() => {
    return CODE_TEMPLATES['CPP'] || ''
  })
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [currentSubmission, setCurrentSubmission] = useState<SubmissionResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

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

  // Escape key to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  const handleLanguageChange = (newLang: Language) => {
    const currentTemplate = CODE_TEMPLATES[selectedLanguage]
    setSelectedLanguage(newLang)
    if (!sourceCode.trim() || sourceCode.trim() === currentTemplate?.trim()) {
      setSourceCode(CODE_TEMPLATES[newLang] || '')
    }
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

  const handleSubmitSolution = async () => {
    if (submitting) return
    setSubmitError(null)

    if (!authService.isAuthenticated()) {
      setSubmitError('Bạn cần đăng nhập tài khoản để nộp bài chấm điểm!')
      setActiveConsoleTab('result')
      return
    }

    if (!sourceCode.trim()) {
      setSubmitError('Vui lòng nhập mã nguồn bài giải trước khi nộp.')
      setActiveConsoleTab('result')
      return
    }

    if (!problem?.id) {
      setSubmitError('Không tìm thấy thông tin bài tập để nộp.')
      setActiveConsoleTab('result')
      return
    }

    setSubmitting(true)
    setCurrentSubmission(null)
    setActiveConsoleTab('result')

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
        return <span className="leetcode-diff-badge leetcode-diff-easy">Dễ</span>
      case 'MEDIUM':
        return <span className="leetcode-diff-badge leetcode-diff-medium">Trung bình</span>
      case 'HARD':
        return <span className="leetcode-diff-badge leetcode-diff-hard">Khó</span>
      default:
        return <span className="leetcode-diff-badge">{diff}</span>
    }
  }

  const getVerdictDisplay = (verdict: Verdict | null, status: string) => {
    if (status === 'PENDING') {
      return (
        <div className="verdict-banner verdict-pending">
          <IconSpinner size={16} />
          <span>Đang xếp hàng chờ chấm...</span>
        </div>
      )
    }
    if (status === 'JUDGING') {
      return (
        <div className="verdict-banner verdict-judging">
          <IconSpinner size={16} />
          <span>Đang chấm bài trên máy chủ...</span>
        </div>
      )
    }

    if (!verdict) {
      return <div className="verdict-banner">{status}</div>
    }

    switch (verdict) {
      case 'ACCEPTED':
        return (
          <div className="verdict-banner verdict-accepted">
            <IconCheck size={18} />
            <div className="verdict-headline">
              <span className="verdict-title">Chấp nhận (Accepted)</span>
            </div>
          </div>
        )
      case 'WRONG_ANSWER':
        return (
          <div className="verdict-banner verdict-rejected">
            <span className="verdict-mark">[X]</span>
            <div className="verdict-headline">
              <span className="verdict-title">Sai kết quả (Wrong Answer)</span>
            </div>
          </div>
        )
      case 'TIME_LIMIT_EXCEEDED':
        return (
          <div className="verdict-banner verdict-warning">
            <IconClock size={16} />
            <div className="verdict-headline">
              <span className="verdict-title">Quá thời gian (Time Limit Exceeded)</span>
            </div>
          </div>
        )
      case 'MEMORY_LIMIT_EXCEEDED':
        return (
          <div className="verdict-banner verdict-warning">
            <IconMemory size={16} />
            <div className="verdict-headline">
              <span className="verdict-title">Quá dung lượng bộ nhớ (Memory Limit Exceeded)</span>
            </div>
          </div>
        )
      case 'COMPILATION_ERROR':
        return (
          <div className="verdict-banner verdict-compile-err">
            <IconAlertCircle size={16} />
            <div className="verdict-headline">
              <span className="verdict-title">Lỗi biên dịch (Compilation Error)</span>
            </div>
          </div>
        )
      case 'RUNTIME_ERROR':
        return (
          <div className="verdict-banner verdict-rejected">
            <IconAlertCircle size={16} />
            <div className="verdict-headline">
              <span className="verdict-title">Lỗi thực thi (Runtime Error)</span>
            </div>
          </div>
        )
      case 'OUTPUT_LIMIT_EXCEEDED':
        return (
          <div className="verdict-banner verdict-warning">
            <IconFileText size={16} />
            <div className="verdict-headline">
              <span className="verdict-title">Quá dung lượng đầu ra (Output Limit Exceeded)</span>
            </div>
          </div>
        )
      case 'INTERNAL_ERROR':
        return (
          <div className="verdict-banner verdict-rejected">
            <IconAlertCircle size={16} />
            <div className="verdict-headline">
              <span className="verdict-title">Lỗi hệ thống máy chấm (Internal Error)</span>
            </div>
          </div>
        )
      default:
        return <div className="verdict-banner">{verdict}</div>
    }
  }

  const formatMemory = (kb?: number | null) => {
    if (!kb) return '—'
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(1)} MB`
    }
    return `${kb} KB`
  }

  const formatTime = (ms?: number | null) => {
    if (ms === null || ms === undefined) return '—'
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)} s`
    }
    return `${ms} ms`
  }

  if (loading) {
    return (
      <div className="leetcode-loading-container">
        <div className="cf-spinner"></div>
        <span>Đang nạp đề bài và môi trường lập trình...</span>
      </div>
    )
  }

  if (error || !problem) {
    return (
      <div className="leetcode-error-container">
        <IconAlertCircle size={32} color="#ef4444" />
        <div className="leetcode-error-text">{error || 'Không tìm thấy bài tập yêu cầu.'}</div>
        <button type="button" className="leetcode-btn-secondary" onClick={onBack}>
          <IconArrowLeft size={14} />
          <span>Quay lại Kho bài tập</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`leetcode-workspace ${isFullscreen ? 'is-fullscreen-mode' : ''}`}>
      {/* Top Bar Navigation */}
      <div className="leetcode-navbar">
        <div className="leetcode-navbar-left">
          <button type="button" className="leetcode-back-btn" onClick={onBack} title="Quay lại Kho bài tập">
            <IconArrowLeft size={14} />
            <span>Kho bài tập</span>
          </button>
          <span className="leetcode-nav-sep">/</span>
          <span className="leetcode-problem-title">{problem.title}</span>
          {getDifficultyBadge(problem.difficulty)}
        </div>

        <div className="leetcode-navbar-right">
          <button
            type="button"
            className="leetcode-nav-btn leetcode-btn-submit"
            onClick={handleSubmitSolution}
            disabled={submitting}
            title="Nộp bài giải lên hệ thống chấm điểm (Ctrl + Enter)"
          >
            {submitting ? <IconSpinner size={14} /> : <IconSend size={13} />}
            <span>{submitting ? 'Đang chấm...' : 'Nộp bài'}</span>
          </button>

          <button
            type="button"
            className="leetcode-nav-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Thu nhỏ giao diện' : 'Toàn màn hình'}
          >
            {isFullscreen ? <IconCompress size={14} /> : <IconExpand size={14} />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace Body */}
      <div className="leetcode-split-body">
        {/* Left Pane: Problem Description & Testcases */}
        <div className="leetcode-problem-pane">
          {/* Pane Header Tabs */}
          <div className="leetcode-pane-tabs">
            <button
              type="button"
              className={`leetcode-tab-btn ${activeProblemTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveProblemTab('description')}
            >
              <IconFileText size={13} />
              <span>Đề bài</span>
            </button>

            <button
              type="button"
              className={`leetcode-tab-btn ${activeProblemTab === 'testcases' ? 'active' : ''}`}
              onClick={() => setActiveProblemTab('testcases')}
            >
              <IconCode size={13} />
              <span>Ví dụ mẫu ({problem.sampleTestCases ? problem.sampleTestCases.length : 0})</span>
            </button>

            <button
              type="button"
              className={`leetcode-tab-btn ${activeProblemTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveProblemTab('info')}
            >
              <IconClock size={13} />
              <span>Thông tin bài</span>
            </button>
          </div>

          {/* Pane Content Area */}
          <div className="leetcode-pane-content">
            {activeProblemTab === 'description' && (
              <div className="leetcode-statement-area">
                <div className="leetcode-title-block">
                  <h1 className="leetcode-main-title">{problem.title}</h1>
                  <div className="leetcode-meta-row">
                    <span className="leetcode-meta-pill">
                      <IconClock size={12} />
                      <span>{formatTime(problem.timeLimitMs)}</span>
                    </span>
                    <span className="leetcode-meta-pill">
                      <IconMemory size={12} />
                      <span>{formatMemory(problem.memoryLimitKb)}</span>
                    </span>
                    <span className="leetcode-meta-pill">Đầu vào: standard input</span>
                    <span className="leetcode-meta-pill">Đầu ra: standard output</span>
                  </div>
                </div>

                {/* Problem Statement */}
                {problem.statement && (
                  <div className="leetcode-content-section">
                    <div className="leetcode-text-content">
                      {problem.statement.split('\n').map((para, i) => (
                        para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Format */}
                {problem.inputFormat && (
                  <div className="leetcode-content-section">
                    <h3 className="leetcode-section-heading">Định dạng đầu vào (Input)</h3>
                    <div className="leetcode-text-content">
                      {problem.inputFormat.split('\n').map((para, i) => (
                        para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Output Format */}
                {problem.outputFormat && (
                  <div className="leetcode-content-section">
                    <h3 className="leetcode-section-heading">Định dạng đầu ra (Output)</h3>
                    <div className="leetcode-text-content">
                      {problem.outputFormat.split('\n').map((para, i) => (
                        para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && (
                  <div className="leetcode-content-section">
                    <h3 className="leetcode-section-heading">Ràng buộc dữ liệu (Constraints)</h3>
                    <div className="leetcode-constraints-box">
                      {problem.constraints.split('\n').map((line, i) => (
                        line.trim() ? <div key={i} className="leetcode-constraint-item">{line}</div> : null
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Test Cases in Description */}
                {problem.sampleTestCases && problem.sampleTestCases.length > 0 && (
                  <div className="leetcode-content-section">
                    <h3 className="leetcode-section-heading">Ví dụ mẫu</h3>
                    {problem.sampleTestCases.map((tc, idx) => (
                      <div key={tc.id || idx} className="leetcode-sample-card">
                        <div className="leetcode-sample-head">Ví dụ {idx + 1}</div>
                        <div className="leetcode-sample-body">
                          <div className="leetcode-sample-col">
                            <div className="leetcode-sample-label">
                              <span>Đầu vào (Input):</span>
                              <button
                                type="button"
                                className="leetcode-copy-icon-btn"
                                onClick={() => handleCopy(tc.input, `in-${idx}`)}
                                title="Sao chép đầu vào"
                              >
                                {copiedId === `in-${idx}` ? <IconCheck size={12} color="#22c55e" /> : <IconCopy size={12} />}
                                <span>{copiedId === `in-${idx}` ? 'Đã chép' : 'Chép'}</span>
                              </button>
                            </div>
                            <pre className="leetcode-code-snippet">{tc.input}</pre>
                          </div>

                          <div className="leetcode-sample-col">
                            <div className="leetcode-sample-label">
                              <span>Đầu ra (Output):</span>
                              <button
                                type="button"
                                className="leetcode-copy-icon-btn"
                                onClick={() => handleCopy(tc.expectedOutput, `out-${idx}`)}
                                title="Sao chép đầu ra"
                              >
                                {copiedId === `out-${idx}` ? <IconCheck size={12} color="#22c55e" /> : <IconCopy size={12} />}
                                <span>{copiedId === `out-${idx}` ? 'Đã chép' : 'Chép'}</span>
                              </button>
                            </div>
                            <pre className="leetcode-code-snippet">{tc.expectedOutput}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {problem.explanationNote && (
                  <div className="leetcode-content-section">
                    <h3 className="leetcode-section-heading">Giải thích</h3>
                    <div className="leetcode-text-content">
                      {problem.explanationNote.split('\n').map((para, i) => (
                        para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Testcases Tab */}
            {activeProblemTab === 'testcases' && (
              <div className="leetcode-testcases-area">
                {problem.sampleTestCases && problem.sampleTestCases.length > 0 ? (
                  <>
                    <div className="leetcode-case-pills">
                      {problem.sampleTestCases.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`leetcode-case-pill ${selectedTestCaseIdx === idx ? 'active' : ''}`}
                          onClick={() => setSelectedTestCaseIdx(idx)}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {problem.sampleTestCases[selectedTestCaseIdx] && (
                      <div className="leetcode-case-detail">
                        <div className="leetcode-case-block">
                          <div className="leetcode-case-block-header">
                            <span>Input</span>
                            <button
                              type="button"
                              className="leetcode-copy-icon-btn"
                              onClick={() =>
                                handleCopy(
                                  problem.sampleTestCases![selectedTestCaseIdx].input,
                                  `case-in-${selectedTestCaseIdx}`
                                )
                              }
                            >
                              {copiedId === `case-in-${selectedTestCaseIdx}` ? (
                                <IconCheck size={12} color="#22c55e" />
                              ) : (
                                <IconCopy size={12} />
                              )}
                              <span>
                                {copiedId === `case-in-${selectedTestCaseIdx}` ? 'Đã chép' : 'Sao chép'}
                              </span>
                            </button>
                          </div>
                          <pre className="leetcode-code-snippet">
                            {problem.sampleTestCases[selectedTestCaseIdx].input}
                          </pre>
                        </div>

                        <div className="leetcode-case-block">
                          <div className="leetcode-case-block-header">
                            <span>Expected Output</span>
                            <button
                              type="button"
                              className="leetcode-copy-icon-btn"
                              onClick={() =>
                                handleCopy(
                                  problem.sampleTestCases![selectedTestCaseIdx].expectedOutput,
                                  `case-out-${selectedTestCaseIdx}`
                                )
                              }
                            >
                              {copiedId === `case-out-${selectedTestCaseIdx}` ? (
                                <IconCheck size={12} color="#22c55e" />
                              ) : (
                                <IconCopy size={12} />
                              )}
                              <span>
                                {copiedId === `case-out-${selectedTestCaseIdx}` ? 'Đã chép' : 'Sao chép'}
                              </span>
                            </button>
                          </div>
                          <pre className="leetcode-code-snippet">
                            {problem.sampleTestCases[selectedTestCaseIdx].expectedOutput}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="leetcode-empty-state">Bài tập này chưa có dữ liệu test mẫu.</div>
                )}
              </div>
            )}

            {/* Info Tab */}
            {activeProblemTab === 'info' && (
              <div className="leetcode-info-area">
                <div className="leetcode-info-row">
                  <span className="leetcode-info-label">Mã bài (Slug):</span>
                  <code className="leetcode-slug-badge">{problem.slug}</code>
                </div>
                <div className="leetcode-info-row">
                  <span className="leetcode-info-label">Độ khó:</span>
                  <div>{getDifficultyBadge(problem.difficulty)}</div>
                </div>
                <div className="leetcode-info-row">
                  <span className="leetcode-info-label">Tỷ lệ AC:</span>
                  <span className="leetcode-info-strong">
                    {problem.acceptanceRate !== undefined && problem.acceptanceRate !== null
                      ? `${problem.acceptanceRate.toFixed(1)}%`
                      : '—'}
                  </span>
                </div>
                {problem.tags && problem.tags.length > 0 && (
                  <div className="leetcode-info-tags">
                    <span className="leetcode-info-label">Chủ đề liên quan:</span>
                    <div className="tags-cloud" style={{ marginTop: '8px' }}>
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
            )}
          </div>
        </div>

        {/* Right Pane: Code Editor & Console */}
        <div className="leetcode-editor-pane">
          {/* Language Selector Bar */}
          <div className="leetcode-lang-header">
            <div className="leetcode-lang-selector-group">
              <span className="leetcode-lang-title">Ngôn ngữ:</span>
              <select
                id="select-lang"
                className="leetcode-lang-dropdown"
                value={selectedLanguage}
                disabled={submitting}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
              >
                <option value="CPP">C++ (GCC 13.2)</option>
                <option value="JAVA">Java 17 (OpenJDK)</option>
                <option value="PYTHON">Python 3.11</option>
                <option value="C">C (GCC 13.2)</option>
                <option value="CSHARP">C# (.NET 8)</option>
              </select>
            </div>

            <div className="leetcode-lang-shortcut-hint">
              <span>Ctrl + Enter để nộp bài</span>
            </div>
          </div>

          {/* Monaco Live Code Editor Area */}
          <div className="leetcode-monaco-wrapper">
            <CodeEditor
              language={selectedLanguage}
              value={sourceCode}
              onChange={setSourceCode}
              disabled={submitting}
              height="100%"
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              onSubmit={handleSubmitSolution}
            />
          </div>

          {/* Bottom Console Drawer (LeetCode style) */}
          <div className="leetcode-console-drawer">
            {/* Drawer Tabs */}
            <div className="leetcode-console-nav">
              <div className="leetcode-console-tabs-left">
                <button
                  type="button"
                  className={`leetcode-console-tab-btn ${activeConsoleTab === 'result' ? 'active' : ''}`}
                  onClick={() => setActiveConsoleTab('result')}
                >
                  <IconTerminal size={13} />
                  <span>Kết quả nộp bài</span>
                  {currentSubmission && (
                    <span
                      className={`leetcode-status-dot ${
                        currentSubmission.status === 'DONE' && currentSubmission.verdict === 'ACCEPTED'
                          ? 'dot-success'
                          : currentSubmission.status === 'DONE'
                          ? 'dot-danger'
                          : 'dot-pending'
                      }`}
                    />
                  )}
                </button>

                <button
                  type="button"
                  className={`leetcode-console-tab-btn ${activeConsoleTab === 'sampletests' ? 'active' : ''}`}
                  onClick={() => setActiveConsoleTab('sampletests')}
                >
                  <IconCode size={13} />
                  <span>Testcase ví dụ</span>
                </button>
              </div>

              <div className="leetcode-console-actions-right">
                <button
                  type="button"
                  className="leetcode-btn-submit-main"
                  onClick={handleSubmitSolution}
                  disabled={submitting}
                  title="Gửi bài nộp chấm điểm (Ctrl + Enter)"
                >
                  {submitting ? <IconSpinner size={14} /> : <IconSend size={13} />}
                  <span>{submitting ? 'Đang chấm điểm...' : 'Nộp bài'}</span>
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="leetcode-console-body">
              {activeConsoleTab === 'result' && (
                <div className="leetcode-result-view">
                  {submitError && (
                    <div className="leetcode-alert-error">
                      <IconAlertCircle size={15} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {currentSubmission ? (
                    <div className="leetcode-submission-result">
                      {/* Verdict Header */}
                      {getVerdictDisplay(currentSubmission.verdict, currentSubmission.status)}

                      {/* Stats Grid */}
                      <div className="leetcode-stats-row">
                        <div className="leetcode-stat-box">
                          <span className="leetcode-stat-label">Thời gian chạy</span>
                          <span className="leetcode-stat-val">
                            {currentSubmission.runtimeMs !== null && currentSubmission.runtimeMs !== undefined
                              ? `${currentSubmission.runtimeMs} ms`
                              : '—'}
                          </span>
                        </div>

                        <div className="leetcode-stat-box">
                          <span className="leetcode-stat-label">Bộ nhớ sử dụng</span>
                          <span className="leetcode-stat-val">
                            {formatMemory(currentSubmission.memoryKb)}
                          </span>
                        </div>

                        {currentSubmission.passTestCount !== null &&
                          currentSubmission.passTestCount !== undefined &&
                          currentSubmission.totalTestCount && (
                            <div className="leetcode-stat-box">
                              <span className="leetcode-stat-label">Test cases vượt qua</span>
                              <span className="leetcode-stat-val stat-green">
                                {currentSubmission.passTestCount} / {currentSubmission.totalTestCount}
                              </span>
                            </div>
                          )}
                      </div>

                      {/* Compiler Error Log */}
                      {currentSubmission.compileErrorLog && (
                        <div className="leetcode-compile-log-box">
                          <div className="leetcode-compile-log-title">Chi tiết lỗi biên dịch:</div>
                          <pre className="leetcode-compile-log-pre">
                            {currentSubmission.compileErrorLog}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    !submitError && (
                      <div className="leetcode-empty-console">
                        <IconTerminal size={22} color="#6b7280" />
                        <span>Chưa có kết quả bài nộp trong phiên này. Hãy soạn thảo mã nguồn và nhấn <strong>Nộp bài</strong> (Ctrl + Enter) để chấm điểm trực tiếp.</span>
                      </div>
                    )
                  )}
                </div>
              )}

              {activeConsoleTab === 'sampletests' && (
                <div className="leetcode-tests-view">
                  {problem.sampleTestCases && problem.sampleTestCases.length > 0 ? (
                    <div className="leetcode-tests-grid">
                      {problem.sampleTestCases.map((tc, idx) => (
                        <div key={idx} className="leetcode-quick-case">
                          <div className="leetcode-quick-case-title">Ví dụ {idx + 1}</div>
                          <div className="leetcode-quick-case-block">
                            <span className="leetcode-quick-label">Input:</span>
                            <pre className="leetcode-code-snippet">{tc.input}</pre>
                          </div>
                          <div className="leetcode-quick-case-block">
                            <span className="leetcode-quick-label">Expected Output:</span>
                            <pre className="leetcode-code-snippet">{tc.expectedOutput}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="leetcode-empty-console">Không có dữ liệu testcase mẫu.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
