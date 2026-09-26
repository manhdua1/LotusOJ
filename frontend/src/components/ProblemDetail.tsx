import React, { useEffect, useState, useRef } from 'react'
import type { ProblemDetailResponse, ProblemDifficulty } from '../types/problem'
import type { Language, RunCodeResponse, SubmissionResponse } from '../types/submission'
import { problemService } from '../services/problemService'
import { submissionService } from '../services/submissionService'
import { authService } from '../services/authService'
import { CodeEditor } from './CodeEditor'
import { CODE_TEMPLATES } from '../constants/editorTemplates'
import { SubmissionResultView } from './SubmissionResultView'
import { AIComplexityCard } from './AIComplexityCard'
import { MarkdownRenderer } from './MarkdownRenderer'
import {
  IconArrowLeft,
  IconClock,
  IconMemory,
  IconCopy,
  IconCheck,
  IconSend,
  IconPlay,
  IconExpand,
  IconCompress,
  IconTerminal,
  IconFileText,
  IconCode,
  IconAlertCircle,
  IconSpinner,
  IconSparkles,
  IconMaximize,
  IconMinimize,
} from './Icons'

interface ProblemDetailProps {
  slug: string
  onBack: () => void
  onSelectTag?: (tag: string) => void
}

type ProblemTab = 'description' | 'testcases' | 'info'
type ConsoleTab = 'testcase' | 'runresult' | 'result' | 'ai'
type DrawerSize = 'compact' | 'normal' | 'expanded'

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
  const [activeConsoleTab, setActiveConsoleTab] = useState<ConsoleTab>('testcase')
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0)
  const [drawerSize, setDrawerSize] = useState<DrawerSize>('normal')

  // Run code state (chạy thử chỉ trên testcase mẫu)
  const [runningCode, setRunningCode] = useState<boolean>(false)
  const [runResult, setRunResult] = useState<RunCodeResponse | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [selectedSampleIdx, setSelectedSampleIdx] = useState<number>(0)
  const [selectedResultSampleIdx, setSelectedResultSampleIdx] = useState<number>(0)

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
          setSelectedSampleIdx(0)
          setSelectedResultSampleIdx(0)
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

  const handleRunCode = async () => {
    if (runningCode || submitting) return
    setRunError(null)

    if (!authService.isAuthenticated()) {
      setRunError('Bạn cần đăng nhập tài khoản để chạy thử code!')
      setActiveConsoleTab('runresult')
      if (drawerSize === 'compact') setDrawerSize('normal')
      return
    }

    if (!problem?.id) {
      setRunError('Không tìm thấy thông tin bài tập.')
      setActiveConsoleTab('runresult')
      if (drawerSize === 'compact') setDrawerSize('normal')
      return
    }

    if (!problem.sampleTestCases || problem.sampleTestCases.length === 0) {
      setRunError('Bài tập này hiện chưa có testcase mẫu để chạy thử.')
      setActiveConsoleTab('runresult')
      if (drawerSize === 'compact') setDrawerSize('normal')
      return
    }

    if (!sourceCode.trim()) {
      setRunError('Vui lòng nhập mã nguồn trước khi chạy thử.')
      setActiveConsoleTab('runresult')
      if (drawerSize === 'compact') setDrawerSize('normal')
      return
    }

    setRunningCode(true)
    setActiveConsoleTab('runresult')
    if (drawerSize === 'compact') setDrawerSize('normal')

    try {
      const res = await submissionService.runCode({
        problemId: problem.id,
        language: selectedLanguage,
        sourceCode: sourceCode.trim(),
      })
      setRunResult(res)
      setSelectedResultSampleIdx(0)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRunError(err.message)
      } else {
        setRunError('Lỗi kết nối khi chạy thử code.')
      }
    } finally {
      setRunningCode(false)
    }
  }

  // Keyboard shortcuts: Escape (fullscreen), Ctrl + ' (run code), Ctrl + Enter (submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault()
        handleRunCode()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmitSolution()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, runningCode, submitting, sourceCode, selectedLanguage, problem])

  const getVerdictLabel = (
    verdict: string,
    _passed?: boolean | null,
    passCount?: number | null,
    totalCount?: number | null
  ) => {
    if (verdict === 'ACCEPTED') {
      if (totalCount && totalCount > 0) {
        return `Chấp nhận toàn bộ testcase mẫu (${passCount}/${totalCount})`
      }
      return 'Chấp nhận (Passed)'
    }
    if (verdict === 'WRONG_ANSWER') {
      if (totalCount && totalCount > 0) {
        return `Sai kết quả (${passCount ?? 0}/${totalCount} đạt)`
      }
      return 'Sai kết quả (Wrong Answer)'
    }
    switch (verdict) {
      case 'TIME_LIMIT_EXCEEDED':
        return 'Quá giới hạn thời gian (Time Limit Exceeded)'
      case 'MEMORY_LIMIT_EXCEEDED':
        return 'Quá giới hạn bộ nhớ (Memory Limit Exceeded)'
      case 'COMPILATION_ERROR':
        return 'Lỗi biên dịch (Compilation Error)'
      case 'RUNTIME_ERROR':
        return 'Lỗi thực thi (Runtime Error)'
      case 'OUTPUT_LIMIT_EXCEEDED':
        return 'Vượt quá giới hạn đầu ra (Output Limit Exceeded)'
      case 'INTERNAL_ERROR':
        return 'Lỗi hệ thống máy chấm (Internal Error)'
      default:
        return verdict
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
            className="leetcode-nav-btn leetcode-btn-run"
            onClick={handleRunCode}
            disabled={runningCode || submitting}
            title="Chạy thử code với input hiện tại (Ctrl + ')"
          >
            {runningCode ? <IconSpinner size={14} /> : <IconPlay size={13} />}
            <span>{runningCode ? 'Đang chạy...' : 'Chạy thử'}</span>
          </button>

          <button
            type="button"
            className="leetcode-nav-btn leetcode-btn-submit"
            onClick={handleSubmitSolution}
            disabled={submitting || runningCode}
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
                    <MarkdownRenderer content={problem.statement} />
                  </div>
                )}

                {/* Input Format */}
                {problem.inputFormat && (
                  <div className="leetcode-content-section">
                    <h3 className="leetcode-section-heading">Định dạng đầu vào (Input)</h3>
                    <MarkdownRenderer content={problem.inputFormat} />
                  </div>
                )}

                {/* Output Format */}
                {problem.outputFormat && (
                  <div className="leetcode-content-section">
                    <h3 className="leetcode-section-heading">Định dạng đầu ra (Output)</h3>
                    <MarkdownRenderer content={problem.outputFormat} />
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && (
                  <div className="leetcode-content-section">
                    <h3 className="leetcode-section-heading">Ràng buộc dữ liệu (Constraints)</h3>
                    <div className="leetcode-constraints-box">
                      <MarkdownRenderer content={problem.constraints} />
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
                    <MarkdownRenderer content={problem.explanationNote} />
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
              <span>Ctrl + ' để chạy thử | Ctrl + Enter để nộp bài</span>
            </div>
          </div>

          {/* Monaco Live Code Editor Area */}
          <div className="leetcode-monaco-wrapper">
            <CodeEditor
              language={selectedLanguage}
              value={sourceCode}
              onChange={setSourceCode}
              disabled={submitting || runningCode}
              height="100%"
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              onSubmit={handleSubmitSolution}
              onRun={handleRunCode}
            />
          </div>

          {/* Bottom Console Drawer (LeetCode style) */}
          <div className={`leetcode-console-drawer drawer-${drawerSize}`}>
            {/* Drawer Tabs */}
            <div className="leetcode-console-nav">
              <div className="leetcode-console-tabs-left">
                <button
                  type="button"
                  className={`leetcode-console-tab-btn ${activeConsoleTab === 'testcase' ? 'active' : ''}`}
                  onClick={() => setActiveConsoleTab('testcase')}
                  title="Dữ liệu đầu vào thử nghiệm"
                >
                  <IconCode size={13} />
                  <span>Testcase</span>
                </button>

                <button
                  type="button"
                  className={`leetcode-console-tab-btn ${activeConsoleTab === 'runresult' ? 'active' : ''}`}
                  onClick={() => setActiveConsoleTab('runresult')}
                  title="Kết quả chạy thử"
                >
                  <IconTerminal size={13} />
                  <span>Kết quả chạy</span>
                  {runResult && (
                    <span
                      className={`leetcode-status-dot ${
                        runResult.verdict === 'ACCEPTED'
                          ? 'dot-success'
                          : runResult.verdict === 'COMPILATION_ERROR'
                          ? 'dot-pending'
                          : 'dot-danger'
                      }`}
                    />
                  )}
                </button>

                <button
                  type="button"
                  className={`leetcode-console-tab-btn ${activeConsoleTab === 'result' ? 'active' : ''}`}
                  onClick={() => setActiveConsoleTab('result')}
                  title="Kết quả chấm bài chính thức"
                >
                  <IconSend size={13} />
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
                  className={`leetcode-console-tab-btn ${activeConsoleTab === 'ai' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveConsoleTab('ai')
                    if (drawerSize === 'compact') setDrawerSize('normal')
                  }}
                  title="Phân tích độ phức tạp Big-O"
                >
                  <IconSparkles size={13} color="#8b5cf6" />
                  <span>Phân tích AI</span>
                  <span className="ai-nav-badge">Big-O</span>
                </button>
              </div>

              <div className="leetcode-console-actions-right">
                <button
                  type="button"
                  className="leetcode-btn-drawer-toggle"
                  onClick={() =>
                    setDrawerSize((prev) =>
                      prev === 'normal' ? 'expanded' : prev === 'expanded' ? 'compact' : 'normal'
                    )
                  }
                  title={
                    drawerSize === 'expanded'
                      ? 'Thu gọn ngăn kéo (Compact)'
                      : drawerSize === 'compact'
                      ? 'Kích thước chuẩn (Normal)'
                      : 'Mở rộng tối đa (Expanded)'
                  }
                >
                  {drawerSize === 'expanded' ? (
                    <IconMinimize size={13} />
                  ) : (
                    <IconMaximize size={13} />
                  )}
                </button>

                <button
                  type="button"
                  className="leetcode-btn-run-main"
                  onClick={handleRunCode}
                  disabled={runningCode || submitting}
                  title="Chạy thử code với input hiện tại (Ctrl + ')"
                >
                  {runningCode ? <IconSpinner size={14} /> : <IconPlay size={13} />}
                  <span>{runningCode ? 'Đang chạy...' : 'Chạy thử'}</span>
                </button>

                <button
                  type="button"
                  className="leetcode-btn-submit-main"
                  onClick={handleSubmitSolution}
                  disabled={submitting || runningCode}
                  title="Gửi bài nộp chấm điểm (Ctrl + Enter)"
                >
                  {submitting ? <IconSpinner size={14} /> : <IconSend size={13} />}
                  <span>{submitting ? 'Đang chấm điểm...' : 'Nộp bài'}</span>
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="leetcode-console-body">
              {/* Tab 1: Sample Testcases (Read-only) */}
              {activeConsoleTab === 'testcase' && (
                <div className="leetcode-testcase-container">
                  {problem?.sampleTestCases && problem.sampleTestCases.length > 0 ? (
                    <>
                      <div className="leetcode-case-pills">
                        {problem.sampleTestCases.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`leetcode-case-pill ${selectedSampleIdx === idx ? 'active' : ''}`}
                            onClick={() => setSelectedSampleIdx(idx)}
                          >
                            Ví dụ {idx + 1}
                          </button>
                        ))}
                      </div>

                      {problem.sampleTestCases[selectedSampleIdx] && (
                        <div className="leetcode-testcase-viewer">
                          <div className="leetcode-run-block">
                            <div className="leetcode-run-block-title">Dữ liệu đầu vào (Input):</div>
                            <pre className="leetcode-run-pre">
                              {problem.sampleTestCases[selectedSampleIdx].input || '(stdin trống)'}
                            </pre>
                          </div>

                          <div className="leetcode-run-block">
                            <div className="leetcode-run-block-title">Output kỳ vọng (Expected Output):</div>
                            <pre className="leetcode-run-pre run-pre-expected">
                              {problem.sampleTestCases[selectedSampleIdx].expectedOutput || '(output trống)'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="leetcode-empty-console">
                      <IconCode size={22} color="#6b7280" />
                      <span>Bài tập này hiện chưa có testcase mẫu.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Run Result on Sample Tests */}
              {activeConsoleTab === 'runresult' && (
                <div className="leetcode-run-result-view">
                  {runError && (
                    <div className="leetcode-alert-error">
                      <IconAlertCircle size={15} />
                      <span>{runError}</span>
                    </div>
                  )}

                  {runningCode ? (
                    <div className="leetcode-run-loading">
                      <IconSpinner size={24} />
                      <div className="leetcode-run-loading-title">Đang biên dịch và chạy thử trên các testcase mẫu...</div>
                      <div className="leetcode-run-loading-sub">Hệ thống đang kiểm tra mã nguồn trong Docker sandbox với dữ liệu ví dụ của bài tập.</div>
                    </div>
                  ) : runResult ? (
                    <div className="leetcode-run-result-card">
                      <div className="leetcode-run-result-header">
                        <div className={`leetcode-run-verdict-badge verdict-${runResult.verdict.toLowerCase()}`}>
                          {getVerdictLabel(runResult.verdict, runResult.passed, runResult.passCount, runResult.totalCount)}
                        </div>

                        <div className="leetcode-run-meta">
                          <span className="leetcode-run-meta-item">
                            Thời gian: <strong>{formatTime(runResult.runtimeMs)}</strong>
                          </span>
                          <span className="leetcode-run-meta-item">
                            Bộ nhớ: <strong>{formatMemory(runResult.memoryKb)}</strong>
                          </span>
                        </div>
                      </div>

                      {runResult.errorLog && (
                        <div className="leetcode-run-block block-error">
                          <div className="leetcode-run-block-title">
                            {runResult.verdict === 'COMPILATION_ERROR' ? 'Chi tiết lỗi biên dịch:' : 'Thông báo lỗi thực thi (stderr):'}
                          </div>
                          <pre className="leetcode-run-pre run-pre-error">{runResult.errorLog}</pre>
                        </div>
                      )}

                      {/* Pills for each sample testcase result */}
                      {runResult.sampleResults && runResult.sampleResults.length > 0 && (
                        <div className="leetcode-case-pills">
                          {runResult.sampleResults.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`leetcode-case-pill ${selectedResultSampleIdx === idx ? 'active' : ''}`}
                              onClick={() => setSelectedResultSampleIdx(idx)}
                            >
                              <span>Ví dụ {idx + 1}</span>
                              <span
                                className={`leetcode-status-dot ${item.passed ? 'dot-success' : 'dot-danger'}`}
                                style={{ marginLeft: 6 }}
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Active sample result detail */}
                      {runResult.sampleResults && runResult.sampleResults[selectedResultSampleIdx] ? (
                        <>
                          <div className="leetcode-run-block">
                            <div className="leetcode-run-block-title">Đầu vào (Input):</div>
                            <pre className="leetcode-run-pre">
                              {runResult.sampleResults[selectedResultSampleIdx].input || '(stdin trống)'}
                            </pre>
                          </div>

                          <div className="leetcode-run-block">
                            <div className="leetcode-run-block-title">Đầu ra thực tế của bạn (Output):</div>
                            <pre className="leetcode-run-pre run-pre-output">
                              {runResult.sampleResults[selectedResultSampleIdx].actualOutput !== undefined &&
                              runResult.sampleResults[selectedResultSampleIdx].actualOutput !== null &&
                              runResult.sampleResults[selectedResultSampleIdx].actualOutput !== ''
                                ? runResult.sampleResults[selectedResultSampleIdx].actualOutput
                                : '(không có output)'}
                            </pre>
                          </div>

                          <div className="leetcode-run-block">
                            <div className="leetcode-run-block-title">Đầu ra kỳ vọng (Expected Output):</div>
                            <pre className="leetcode-run-pre run-pre-expected">
                              {runResult.sampleResults[selectedResultSampleIdx].expectedOutput || '(không có output kỳ vọng)'}
                            </pre>
                          </div>

                          {runResult.sampleResults[selectedResultSampleIdx].errorLog && (
                            <div className="leetcode-run-block block-error">
                              <div className="leetcode-run-block-title">Chi tiết lỗi testcase:</div>
                              <pre className="leetcode-run-pre run-pre-error">
                                {runResult.sampleResults[selectedResultSampleIdx].errorLog}
                              </pre>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Fallback if single result */
                        runResult.input !== undefined && (
                          <>
                            <div className="leetcode-run-block">
                              <div className="leetcode-run-block-title">Đầu vào (Input):</div>
                              <pre className="leetcode-run-pre">{runResult.input || '(stdin trống)'}</pre>
                            </div>
                            <div className="leetcode-run-block">
                              <div className="leetcode-run-block-title">Đầu ra thực tế của bạn (Output):</div>
                              <pre className="leetcode-run-pre run-pre-output">{runResult.output || '(không có output)'}</pre>
                            </div>
                            {runResult.expectedOutput && (
                              <div className="leetcode-run-block">
                                <div className="leetcode-run-block-title">Đầu ra kỳ vọng (Expected Output):</div>
                                <pre className="leetcode-run-pre run-pre-expected">{runResult.expectedOutput}</pre>
                              </div>
                            )}
                          </>
                        )
                      )}
                    </div>
                  ) : (
                    !runError && (
                      <div className="leetcode-empty-console">
                        <IconPlay size={24} color="#6b7280" />
                        <span>Chưa chạy thử mã nguồn. Nhấn <strong>Chạy thử</strong> (Ctrl + ') để kiểm tra code với các testcase mẫu của bài tập.</span>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Tab 3: Submission Result */}
              {activeConsoleTab === 'result' && (
                <div className="leetcode-result-view">
                  {submitError && (
                    <div className="leetcode-alert-error">
                      <IconAlertCircle size={15} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {currentSubmission ? (
                    <SubmissionResultView
                      submission={currentSubmission}
                      onOpenAIAnalysis={() => {
                        setActiveConsoleTab('ai')
                        if (drawerSize === 'compact') setDrawerSize('normal')
                      }}
                    />
                  ) : (
                    !submitError && (
                      <div className="leetcode-empty-console">
                        <IconTerminal size={22} color="#6b7280" />
                        <span>Chưa có kết quả bài nộp trong phiên này. Nhấn <strong>Nộp bài</strong> (Ctrl + Enter) để chấm điểm toàn bộ bài tập.</span>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Tab 4: AI Complexity Analysis */}
              {activeConsoleTab === 'ai' && (
                <div className="leetcode-ai-view">
                  <AIComplexityCard
                    language={selectedLanguage}
                    sourceCode={sourceCode}
                    problemTitle={problem?.title}
                    autoAnalyze={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
