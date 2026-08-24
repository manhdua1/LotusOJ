import React, { useEffect, useState, useCallback } from 'react'
import type { ProblemDifficulty, ProblemFilterRequest, ProblemSummaryResponse } from '../types/problem'
import { problemService } from '../services/problemService'

interface ProblemListProps {
  onSelectProblem: (slug: string) => void
  initialTag?: string
  initialKeyword?: string
}

const POPULAR_TAGS = [
  'Array',
  'String',
  'Hash Table',
  'Dynamic Programming',
  'Two Pointers',
  'Greedy',
  'Math',
  'Sorting',
  'Graph',
  'Binary Search',
  'Tree',
]

export const ProblemList: React.FC<ProblemListProps> = ({
  onSelectProblem,
  initialTag = '',
  initialKeyword = '',
}) => {
  const [problems, setProblems] = useState<ProblemSummaryResponse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [keyword, setKeyword] = useState<string>(initialKeyword)
  const [difficulty, setDifficulty] = useState<ProblemDifficulty | ''>('')
  const [selectedTag, setSelectedTag] = useState<string>(initialTag)
  const [solvedFilter, setSolvedFilter] = useState<string>('ALL') // 'ALL', 'SOLVED', 'UNSOLVED'

  // Pagination state
  const [page, setPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const pageSize = 20

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filter: ProblemFilterRequest = {
        keyword: keyword.trim() || undefined,
        difficulty: difficulty || undefined,
        tag: selectedTag || undefined,
        solved: solvedFilter === 'SOLVED' ? true : solvedFilter === 'UNSOLVED' ? false : undefined,
      }

      const res = await problemService.getProblems(filter, page, pageSize)
      setProblems(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không thể tải danh sách bài tập. Vui lòng thử lại!')
      }
    } finally {
      setLoading(false)
    }
  }, [keyword, difficulty, selectedTag, solvedFilter, page])

  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  // Reset to first page when changing filters
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchProblems()
  }

  const handleResetFilters = () => {
    setKeyword('')
    setDifficulty('')
    setSelectedTag('')
    setSolvedFilter('ALL')
    setPage(0)
  }

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedTag(tag === selectedTag ? '' : tag)
    setPage(0)
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

  return (
    <div className="problemset-container">
      {/* Top Header Box */}
      <div className="roundbox">
        <div className="caption titled">
          <span>
            <span className="caption-arrow">→</span> Kho bài tập (Problemset)
          </span>
          <span className="problem-count-badge">
            {totalElements} bài tập
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="roundbox-body filter-bar-body">
          <form className="problem-filter-form" onSubmit={handleSearchSubmit}>
            <div className="filter-group">
              <label htmlFor="filter-search" className="filter-label">Tìm kiếm:</label>
              <input
                id="filter-search"
                type="text"
                className="cf-input filter-input"
                placeholder="Tên bài tập, mã bài..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="filter-diff" className="filter-label">Độ khó:</label>
              <select
                id="filter-diff"
                className="cf-input filter-select"
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value as ProblemDifficulty | '')
                  setPage(0)
                }}
              >
                <option value="">Tất cả độ khó</option>
                <option value="EASY">Dễ (Easy)</option>
                <option value="MEDIUM">Trung bình (Medium)</option>
                <option value="HARD">Khó (Hard)</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-status" className="filter-label">Trạng thái:</label>
              <select
                id="filter-status"
                className="cf-input filter-select"
                value={solvedFilter}
                onChange={(e) => {
                  setSolvedFilter(e.target.value)
                  setPage(0)
                }}
              >
                <option value="ALL">Tất cả bài</option>
                <option value="SOLVED">Đã giải</option>
                <option value="UNSOLVED">Chưa giải</option>
              </select>
            </div>

            <div className="filter-actions">
              <button type="submit" className="btn-cf btn-cf-primary">
                Áp dụng
              </button>
              {(keyword || difficulty || selectedTag || solvedFilter !== 'ALL') && (
                <button
                  type="button"
                  className="btn-cf"
                  onClick={handleResetFilters}
                  title="Xóa toàn bộ bộ lọc"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </form>

          {/* Popular Tag Filters */}
          <div className="popular-tags-row">
            <span className="tags-label">Tags phổ biến:</span>
            <div className="tags-cloud">
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-pill ${selectedTag.toLowerCase() === tag.toLowerCase() ? 'active' : ''}`}
                  onClick={(e) => handleTagClick(tag, e)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Problems Table */}
      <div className="roundbox">
        {loading ? (
          <div className="roundbox-body loading-box">
            <div className="cf-spinner"></div>
            <span>Đang tải danh sách bài tập từ hệ thống...</span>
          </div>
        ) : error ? (
          <div className="roundbox-body">
            <div className="cf-notice cf-notice-error">{error}</div>
            <button type="button" className="btn-cf" onClick={fetchProblems}>
              Thử lại
            </button>
          </div>
        ) : problems.length === 0 ? (
          <div className="roundbox-body empty-state-box">
            <h4>Không tìm thấy bài tập nào phù hợp</h4>
            <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lại các tiêu chí lọc.</p>
            <button type="button" className="btn-cf" onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="problem-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>#</th>
                  <th>Tên bài tập</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Độ khó</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Tỷ lệ AC</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((prob, idx) => {
                  const itemIndex = page * pageSize + idx + 1
                  const codeLetter = String.fromCharCode(65 + (idx % 26))

                  return (
                    <tr
                      key={prob.id || prob.slug}
                      className="problem-row"
                      onClick={() => onSelectProblem(prob.slug)}
                    >
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#555' }}>
                        {itemIndex}
                      </td>
                      <td>
                        <div className="problem-name-cell">
                          <a
                            href={`#problem/${prob.slug}`}
                            className="problem-title-link"
                            onClick={(e) => {
                              e.preventDefault()
                              onSelectProblem(prob.slug)
                            }}
                          >
                            <span className="problem-code-badge">{codeLetter}</span> {prob.title}
                          </a>
                          {prob.tags && prob.tags.length > 0 && (
                            <div className="problem-tags-row">
                              {prob.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`mini-tag ${selectedTag.toLowerCase() === tag.toLowerCase() ? 'active' : ''}`}
                                  onClick={(e) => handleTagClick(tag, e)}
                                  title={`Lọc bài tập theo tag: ${tag}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getDifficultyBadge(prob.difficulty)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="ac-rate-wrapper">
                          <span className="ac-rate-text">
                            {prob.acceptanceRate !== null && prob.acceptanceRate !== undefined
                              ? `${prob.acceptanceRate.toFixed(1)}%`
                              : '—'}
                          </span>
                          {prob.acceptanceRate !== null && prob.acceptanceRate !== undefined && (
                            <div className="ac-rate-bar-bg">
                              <div
                                className="ac-rate-bar-fill"
                                style={{ width: `${Math.min(100, prob.acceptanceRate)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {prob.solvedByCurrentUser === true ? (
                          <span className="solved-badge solved-yes" title="Đã giải bài này">
                            Đã giải
                          </span>
                        ) : prob.solvedByCurrentUser === false ? (
                          <span className="solved-badge solved-attempted" title="Đã nộp nhưng chưa AC">
                            Chưa đạt
                          </span>
                        ) : (
                          <span className="solved-badge solved-none">—</span>
                        )}
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
    </div>
  )
}
