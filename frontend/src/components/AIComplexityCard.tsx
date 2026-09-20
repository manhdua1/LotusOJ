import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { Language } from '../types/submission'
import {
  aiComplexityService,
  type ComplexityAnalysisResult,
} from '../services/aiComplexityService'
import {
  IconSparkles,
  IconCpu,
  IconMemory,
  IconZap,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconReset,
} from './Icons'

interface AIComplexityCardProps {
  language: Language
  sourceCode: string
  problemTitle?: string
  autoAnalyze?: boolean
}

export const AIComplexityCard: React.FC<AIComplexityCardProps> = ({
  language,
  sourceCode,
  problemTitle,
  autoAnalyze = true,
}) => {
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [analysis, setAnalysis] = useState<ComplexityAnalysisResult | null>(null)
  const lastAnalyzedRef = useRef<string>('')

  const performAnalysis = useCallback(async (codeToAnalyze: string) => {
    if (!codeToAnalyze.trim()) return
    setAnalyzing(true)
    try {
      const res = await aiComplexityService.analyzeCode(
        language,
        codeToAnalyze,
        problemTitle
      )
      setAnalysis(res)
      lastAnalyzedRef.current = codeToAnalyze
    } catch {
      // Keep previous analysis if error
    } finally {
      setAnalyzing(false)
    }
  }, [language, problemTitle])

  useEffect(() => {
    if (autoAnalyze && sourceCode.trim() && sourceCode !== lastAnalyzedRef.current) {
      performAnalysis(sourceCode)
    }
  }, [sourceCode, autoAnalyze, performAnalysis])

  const getVerdictBadge = (verdict: 'OPTIMAL' | 'ACCEPTABLE' | 'SUBOPTIMAL') => {
    switch (verdict) {
      case 'OPTIMAL':
        return (
          <span className="complexity-badge badge-optimal">
            <IconCheck size={11} /> Tối ưu
          </span>
        )
      case 'ACCEPTABLE':
        return (
          <span className="complexity-badge badge-acceptable">
            <IconZap size={11} /> Chấp nhận được
          </span>
        )
      case 'SUBOPTIMAL':
        return (
          <span className="complexity-badge badge-suboptimal">
            <IconAlertCircle size={11} /> Cần tối ưu (Nguy cơ TLE)
          </span>
        )
    }
  }

  if (analyzing) {
    return (
      <div className="ai-complexity-container ai-analyzing-state">
        <div className="ai-scanning-pulse">
          <IconSparkles size={24} className="ai-pulse-icon" />
          <div className="ai-scanning-texts">
            <div className="ai-scanning-title">Google Gemini 2.5 Flash đang thẩm định mã nguồn...</div>
            <div className="ai-scanning-subtitle">
              Đang phân tích cấu trúc vòng lặp, cây đệ quy và mức độ chiếm dụng bộ nhớ ({language})...
            </div>
          </div>
        </div>
        <div className="ai-scanning-bar">
          <div className="ai-scanning-progress" />
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="ai-complexity-container ai-empty-state">
        <div className="ai-empty-content">
          <IconSparkles size={28} color="#6366f1" />
          <div className="ai-empty-title">Phân tích Thuật toán bằng Google Gemini AI</div>
          <p className="ai-empty-desc">
            Sử dụng mô hình ngôn ngữ lớn tiên tiến kết hợp kỹ thuật Prompt Engineering chuyên sâu
            để trích xuất độ phức tạp thời gian (Time Complexity), bộ nhớ (Space Complexity) và chiến lược giải thuật.
          </p>
          <button
            type="button"
            className="ai-btn-analyze"
            onClick={() => performAnalysis(sourceCode)}
            disabled={!sourceCode.trim()}
          >
            <IconSparkles size={14} />
            <span>Phân tích độ phức tạp ngay</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ai-complexity-container">
      {/* Header Bar */}
      <div className="ai-complexity-header">
        <div className="ai-header-left">
          <div className="ai-badge-ai">
            <IconSparkles size={13} />
            <span>{analysis.aiModel && analysis.aiModel.includes('gemini') ? 'Google Gemini 2.5 Flash' : 'Gemini AI Engine'}</span>
          </div>
          <span className="ai-confidence-tag">
            Độ tin cậy: <strong>{analysis.confidenceScore}%</strong>
          </span>
        </div>

        <div className="ai-header-right">
          <button
            type="button"
            className="ai-btn-reanalyze"
            onClick={() => performAnalysis(sourceCode)}
            title="Phân tích lại mã nguồn hiện tại"
          >
            <IconReset size={12} />
            <span>Phân tích lại</span>
          </button>
        </div>
      </div>

      {/* Main Big-O Metrics Grid */}
      <div className="ai-metrics-grid">
        {/* Time Complexity Card */}
        <div className="ai-metric-card ai-time-card">
          <div className="ai-metric-card-header">
            <div className="ai-metric-type">
              <IconClock size={15} />
              <span>Thời gian (Time)</span>
            </div>
            {getVerdictBadge(analysis.timeComplexity.verdict)}
          </div>

          <div className="ai-bigo-display">
            <span className="ai-bigo-formula">{analysis.timeComplexity.bigO}</span>
            <span className="ai-bigo-name">{analysis.timeComplexity.name}</span>
          </div>

          <div className="ai-metric-desc">
            <strong>Yếu tố chính:</strong> {analysis.timeComplexity.keyFactor}
          </div>
        </div>

        {/* Space Complexity Card */}
        <div className="ai-metric-card ai-space-card">
          <div className="ai-metric-card-header">
            <div className="ai-metric-type">
              <IconMemory size={15} />
              <span>Bộ nhớ phụ trợ (Space)</span>
            </div>
            {getVerdictBadge(analysis.spaceComplexity.verdict)}
          </div>

          <div className="ai-bigo-display">
            <span className="ai-bigo-formula">{analysis.spaceComplexity.bigO}</span>
            <span className="ai-bigo-name">{analysis.spaceComplexity.name}</span>
          </div>

          <div className="ai-metric-desc">
            <strong>Chiếm dụng:</strong>{' '}
            {analysis.spaceComplexity.memoryBreakdown.join('; ')}
          </div>
        </div>
      </div>

      {/* Algorithm Paradigm Badge */}
      <div className="ai-paradigm-row">
        <span className="ai-paradigm-label">Mẫu thuật toán nhận diện:</span>
        <span className="ai-paradigm-pill">
          <IconCpu size={13} />
          {analysis.algorithmParadigm}
        </span>
      </div>

      {/* Code Insights Breakdown */}
      <div className="ai-insights-section">
        <div className="ai-section-title">Chi tiết phân tích mã nguồn:</div>
        <div className="ai-insights-list">
          {analysis.codeInsights.map((insight, idx) => (
            <div key={idx} className="ai-insight-item">
              <div className="ai-insight-bullet" />
              <div className="ai-insight-body">
                <span className="ai-insight-title">{insight.title}: </span>
                <span className="ai-insight-text">{insight.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Advice Box */}
      {analysis.optimizationAdvice && (
        <div className="ai-advice-box">
          <div className="ai-advice-header">
            <IconZap size={14} color="#f59e0b" />
            <span>Nhận xét & Hướng tối ưu hóa:</span>
          </div>
          <div className="ai-advice-content">{analysis.optimizationAdvice}</div>
        </div>
      )}
    </div>
  )
}
