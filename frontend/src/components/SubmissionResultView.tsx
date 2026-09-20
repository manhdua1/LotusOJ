import React from 'react'
import type { SubmissionResponse } from '../types/submission'
import {
  IconCheckCircle,
  IconXCircle,
  IconClock,
  IconMemory,
  IconAlertCircle,
  IconSparkles,
  IconCopy,
  IconCheck,
} from './Icons'

interface SubmissionResultViewProps {
  submission: SubmissionResponse
  onOpenAIAnalysis?: () => void
}

export const SubmissionResultView: React.FC<SubmissionResultViewProps> = ({
  submission,
  onOpenAIAnalysis,
}) => {
  const [copiedLog, setCopiedLog] = React.useState(false)

  const formatMemory = (kb: number | null | undefined): string => {
    if (kb === null || kb === undefined) return '—'
    if (kb === 0) return '< 1 MB'
    if (kb < 1024) return `${kb} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const handleCopyErrorLog = () => {
    if (submission.compileErrorLog) {
      navigator.clipboard.writeText(submission.compileErrorLog)
      setCopiedLog(true)
      setTimeout(() => setCopiedLog(false), 2000)
    }
  }

  const isAccepted =
    submission.status === 'DONE' && submission.verdict === 'ACCEPTED'
  const isPending =
    submission.status === 'PENDING' || submission.status === 'JUDGING'

  const passCount = submission.passTestCount ?? 0
  const totalCount = submission.totalTestCount ?? 0
  const passPercent = totalCount > 0 ? (passCount / totalCount) * 100 : 0

  return (
    <div className="leetcode-submission-view">
      {/* 1. Hero Verdict Banner */}
      <div
        className={`leetcode-verdict-hero ${
          isAccepted
            ? 'hero-accepted'
            : isPending
            ? 'hero-pending'
            : 'hero-rejected'
        }`}
      >
        <div className="leetcode-hero-main">
          <div className="leetcode-hero-icon-title">
            {isAccepted ? (
              <IconCheckCircle size={28} className="hero-status-icon icon-green" />
            ) : isPending ? (
              <IconClock size={28} className="hero-status-icon icon-blue" />
            ) : (
              <IconXCircle size={28} className="hero-status-icon icon-red" />
            )}

            <div className="leetcode-hero-text-col">
              <div className="leetcode-hero-verdict-title">
                {submission.verdict === 'ACCEPTED' && 'Chấp nhận (Accepted)'}
                {submission.verdict === 'WRONG_ANSWER' && 'Sai kết quả (Wrong Answer)'}
                {submission.verdict === 'TIME_LIMIT_EXCEEDED' && 'Quá thời gian (Time Limit Exceeded)'}
                {submission.verdict === 'MEMORY_LIMIT_EXCEEDED' && 'Quá bộ nhớ (Memory Limit Exceeded)'}
                {submission.verdict === 'COMPILATION_ERROR' && 'Lỗi biên dịch (Compilation Error)'}
                {submission.verdict === 'RUNTIME_ERROR' && 'Lỗi thực thi (Runtime Error)'}
                {submission.verdict === 'OUTPUT_LIMIT_EXCEEDED' && 'Quá kích thước đầu ra'}
                {submission.verdict === 'INTERNAL_ERROR' && 'Lỗi máy chủ chấm bài'}
                {isPending && 'Đang xếp hàng chấm điểm...'}
              </div>

              <div className="leetcode-hero-meta-row">
                <span className="leetcode-hero-meta-badge">
                  {submission.language}
                </span>
                {totalCount > 0 && (
                  <span className="leetcode-hero-testcase-text">
                    Đã vượt qua <strong>{passCount} / {totalCount}</strong> test cases
                  </span>
                )}
                {submission.judgedAt && (
                  <span className="leetcode-hero-time-text">
                    {new Date(submission.judgedAt).toLocaleTimeString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onOpenAIAnalysis && isAccepted && (
            <button
              type="button"
              className="leetcode-btn-ai-cta"
              onClick={onOpenAIAnalysis}
              title="Phân tích độ phức tạp thời gian và không gian Big-O của bài nộp này"
            >
              <IconSparkles size={14} />
              <span>Phân tích AI</span>
            </button>
          )}
        </div>

        {/* Testcases Segmented Progress Bar */}
        {totalCount > 0 && (
          <div className="leetcode-testcase-progress-wrap">
            <div className="leetcode-progress-track">
              <div
                className={`leetcode-progress-fill ${
                  isAccepted ? 'fill-green' : 'fill-red'
                }`}
                style={{ width: `${Math.max(passPercent, 4)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Clean Performance Metrics Grid (Zero Comparison with Others) */}
      {submission.status === 'DONE' && (
        <div className="leetcode-beats-grid">
          {/* Runtime Card */}
          <div className="leetcode-beats-card">
            <div className="leetcode-beats-card-header">
              <div className="leetcode-metric-title">
                <IconClock size={15} />
                <span>Thời gian chạy (Runtime)</span>
              </div>
              <div className="leetcode-metric-val">
                {submission.runtimeMs !== null && submission.runtimeMs !== undefined
                  ? `${submission.runtimeMs} ms`
                  : '—'}
              </div>
            </div>

            <div className="leetcode-metric-footer">
              <span className={`leetcode-metric-tag ${isAccepted ? 'tag-optimal' : 'tag-neutral'}`}>
                {isAccepted ? 'Đạt chuẩn thời gian' : 'Thời gian thực thi'}
              </span>
              <span className="leetcode-metric-hint">Đo lường trên CPU Sandbox</span>
            </div>
          </div>

          {/* Memory Card */}
          <div className="leetcode-beats-card">
            <div className="leetcode-beats-card-header">
              <div className="leetcode-metric-title">
                <IconMemory size={15} />
                <span>Bộ nhớ sử dụng (Memory)</span>
              </div>
              <div className="leetcode-metric-val">
                {formatMemory(submission.memoryKb)}
              </div>
            </div>

            <div className="leetcode-metric-footer">
              <span className={`leetcode-metric-tag ${isAccepted ? 'tag-optimal' : 'tag-neutral'}`}>
                {isAccepted ? 'Đạt chuẩn bộ nhớ' : 'Bộ nhớ RAM'}
              </span>
              <span className="leetcode-metric-hint">Dung lượng trong container</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Compilation Error Display */}
      {submission.compileErrorLog && (
        <div className="leetcode-compile-error-section">
          <div className="leetcode-compile-header">
            <div className="leetcode-compile-title">
              <IconAlertCircle size={14} color="#dc2626" />
              <span>Chi tiết lỗi biên dịch (Compilation Error Output):</span>
            </div>
            <button
              type="button"
              className="leetcode-copy-icon-btn"
              onClick={handleCopyErrorLog}
              title="Sao chép toàn bộ thông báo lỗi"
            >
              {copiedLog ? (
                <IconCheck size={12} color="#22c55e" />
              ) : (
                <IconCopy size={12} />
              )}
              <span>{copiedLog ? 'Đã sao chép' : 'Sao chép lỗi'}</span>
            </button>
          </div>

          <pre className="leetcode-compile-pre">
            <code>{submission.compileErrorLog}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
