import React, { useCallback, useEffect, useState } from 'react'
import type {
  CreateProblemRequest,
  ProblemDifficulty,
  ProblemFilterRequest,
  ProblemStatus,
  ProblemSummaryResponse,
  UpdateProblemRequest,
} from '../types/problem'
import type {
  CreateTestCaseRequest,
  TestCaseResponse,
  UpdateTestCaseRequest,
} from '../types/testCase'
import { problemService } from '../services/problemService'
import { testCaseService } from '../services/testCaseService'

interface AdminPanelProps {
  onViewProblem?: (slug: string) => void
}

type AdminTab = 'LIST' | 'CREATE'

const AVAILABLE_TAGS = [
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
  'Depth-First Search',
  'Breadth-First Search',
  'Recursion',
  'Backtracking',
  'Matrix',
  'Bit Manipulation',
  'Stack',
  'Queue',
]

export const AdminPanel: React.FC<AdminPanelProps> = ({ onViewProblem }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('LIST')

  // List & Filter States
  const [problems, setProblems] = useState<ProblemSummaryResponse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filter Inputs State (controlled form inputs)
  const [inputKeyword, setInputKeyword] = useState<string>('')
  const [inputDifficulty, setInputDifficulty] = useState<ProblemDifficulty | ''>('')
  const [inputStatus, setInputStatus] = useState<ProblemStatus | ''>('')

  // Applied Filter State (triggers API call only when user submits filter)
  const [appliedFilters, setAppliedFilters] = useState<{
    keyword: string
    difficulty: ProblemDifficulty | ''
    status: ProblemStatus | ''
  }>({
    keyword: '',
    difficulty: '',
    status: '',
  })

  const [page, setPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const pageSize = 15

  // Form State (for Create)
  const [formTitle, setFormTitle] = useState('')
  const [formDifficulty, setFormDifficulty] = useState<ProblemDifficulty>('EASY')
  const [formTimeLimit, setFormTimeLimit] = useState<number>(1000)
  const [formMemoryLimit, setFormMemoryLimit] = useState<number>(262144)
  const [formTags, setFormTags] = useState<string[]>([])
  const [formTagInput, setFormTagInput] = useState('')
  const [formStatement, setFormStatement] = useState('')
  const [formInputFormat, setFormInputFormat] = useState('')
  const [formOutputFormat, setFormOutputFormat] = useState('')
  const [formConstraints, setFormConstraints] = useState('')
  const [formExplanation, setFormExplanation] = useState('')
  const [submittingForm, setSubmittingForm] = useState(false)

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDifficulty, setEditDifficulty] = useState<ProblemDifficulty>('EASY')
  const [editTimeLimit, setEditTimeLimit] = useState<number>(1000)
  const [editMemoryLimit, setEditMemoryLimit] = useState<number>(262144)
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState('')
  const [editStatement, setEditStatement] = useState('')
  const [editInputFormat, setEditInputFormat] = useState('')
  const [editOutputFormat, setEditOutputFormat] = useState('')
  const [editConstraints, setEditConstraints] = useState('')
  const [editExplanation, setEditExplanation] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState<string | null>(null)

  // Test Case Manager Modal State
  const [testCaseModalOpen, setTestCaseModalOpen] = useState(false)
  const [activeTestCaseProblem, setActiveTestCaseProblem] = useState<ProblemSummaryResponse | null>(null)
  const [testCasesList, setTestCasesList] = useState<TestCaseResponse[]>([])
  const [loadingTestCases, setLoadingTestCases] = useState(false)
  const [testCaseError, setTestCaseError] = useState<string | null>(null)
  const [testCaseSuccessMsg, setTestCaseSuccessMsg] = useState<string | null>(null)
  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(null)
  const [tcInput, setTcInput] = useState('')
  const [tcExpectedOutput, setTcExpectedOutput] = useState('')
  const [tcIsSample, setTcIsSample] = useState(false)
  const [tcOrderIndex, setTcOrderIndex] = useState<number | ''>('')
  const [submittingTestCase, setSubmittingTestCase] = useState(false)
  const [deleteTestCaseConfirmId, setDeleteTestCaseConfirmId] = useState<string | null>(null)

  const loadTestCasesForProblem = async (problemId: string) => {
    setLoadingTestCases(true)
    setTestCaseError(null)
    try {
      const list = await testCaseService.getProblemTestCases(problemId)
      setTestCasesList(list)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTestCaseError(err.message)
      } else {
        setTestCaseError('Không thể tải danh sách test case!')
      }
    } finally {
      setLoadingTestCases(false)
    }
  }

  const handleOpenTestCases = async (prob: ProblemSummaryResponse) => {
    setActiveTestCaseProblem(prob)
    setTestCaseModalOpen(true)
    setTestCaseError(null)
    setTestCaseSuccessMsg(null)
    handleCancelEditTestCase()
    await loadTestCasesForProblem(prob.id)
  }

  const handleEditTestCaseClick = (tc: TestCaseResponse) => {
    setEditingTestCaseId(tc.id)
    setTcInput(tc.input || '')
    setTcExpectedOutput(tc.expectedOutput || '')
    setTcIsSample(tc.isSample)
    setTcOrderIndex(tc.orderIndex)
    setTestCaseError(null)
  }

  const handleCancelEditTestCase = () => {
    setEditingTestCaseId(null)
    setTcInput('')
    setTcExpectedOutput('')
    setTcIsSample(false)
    setTcOrderIndex('')
  }

  const handleSaveTestCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTestCaseProblem) return
    setTestCaseError(null)

    if (tcInput.trim() === '' && tcExpectedOutput.trim() === '') {
      setTestCaseError('Vui lòng nhập dữ liệu đầu vào hoặc đầu ra mong muốn!')
      return
    }

    setSubmittingTestCase(true)
    try {
      if (editingTestCaseId) {
        const req: UpdateTestCaseRequest = {
          input: tcInput,
          expectedOutput: tcExpectedOutput,
          isSample: tcIsSample,
          orderIndex: typeof tcOrderIndex === 'number' ? tcOrderIndex : undefined,
        }
        await testCaseService.updateTestCase(editingTestCaseId, req)
        setTestCaseSuccessMsg('Cập nhật test case thành công!')
      } else {
        const req: CreateTestCaseRequest = {
          input: tcInput,
          expectedOutput: tcExpectedOutput,
          isSample: tcIsSample,
          orderIndex: typeof tcOrderIndex === 'number' ? tcOrderIndex : undefined,
        }
        await testCaseService.createTestCase(activeTestCaseProblem.id, req)
        setTestCaseSuccessMsg('Thêm test case mới thành công!')
      }
      handleCancelEditTestCase()
      await loadTestCasesForProblem(activeTestCaseProblem.id)
      setTimeout(() => setTestCaseSuccessMsg(null), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTestCaseError(err.message)
      } else {
        setTestCaseError('Lỗi khi lưu test case!')
      }
    } finally {
      setSubmittingTestCase(false)
    }
  }

  const handleDeleteTestCase = async (testCaseId: string) => {
    if (!activeTestCaseProblem) return
    setTestCaseError(null)
    try {
      await testCaseService.deleteTestCase(testCaseId)
      setDeleteTestCaseConfirmId(null)
      setTestCaseSuccessMsg('Đã xóa test case thành công!')
      await loadTestCasesForProblem(activeTestCaseProblem.id)
      setTimeout(() => setTestCaseSuccessMsg(null), 3000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTestCaseError(err.message)
      } else {
        setTestCaseError('Lỗi khi xóa test case!')
      }
    }
  }

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filter: ProblemFilterRequest = {
        keyword: appliedFilters.keyword.trim() || undefined,
        difficulty: appliedFilters.difficulty || undefined,
        status: appliedFilters.status || undefined,
      }
      const res = await problemService.getProblems(filter, page, pageSize)
      setProblems(res.content || [])
      setTotalPages(res.totalPages || 1)
      setTotalElements(res.totalElements || 0)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không thể tải danh sách bài tập!')
      }
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page])

  useEffect(() => {
    if (activeTab === 'LIST') {
      fetchProblems()
    }
  }, [fetchProblems, activeTab])

  const showNotification = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => {
      setSuccessMsg(null)
    }, 4000)
  }

  // Handle Quick Status Change
  const handleStatusChange = async (id: string, newStatus: ProblemStatus) => {
    // 1. Optimistic update: instantly update status without re-sorting or jumping to top
    setProblems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    )

    try {
      await problemService.updateProblemStatus(id, newStatus)
      const statusLabel =
        newStatus === 'PUBLISHED' ? 'Công khai (PUBLISHED)' : newStatus === 'DRAFT' ? 'Bản nháp (DRAFT)' : 'Lưu trữ (ARCHIVED)'
      showNotification(`Đã cập nhật trạng thái bài tập sang: ${statusLabel}`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Lỗi khi cập nhật trạng thái bài tập!')
      }
      fetchProblems()
    }
  }

  // Handle Delete
  const handleDeleteProblem = async () => {
    if (!deleteConfirmId) return
    try {
      await problemService.deleteProblem(deleteConfirmId)
      showNotification('Xóa bài tập thành công!')
      setDeleteConfirmId(null)
      setDeleteConfirmTitle(null)
      fetchProblems()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Lỗi khi xóa bài tập!')
      }
    }
  }

  // Open Edit Modal
  const handleOpenEdit = async (prob: ProblemSummaryResponse) => {
    setLoading(true)
    try {
      const detail = await problemService.getProblemById(prob.id)
      setEditingId(detail.id)
      setEditTitle(detail.title)
      setEditDifficulty(detail.difficulty)
      setEditTimeLimit(detail.timeLimitMs || 1000)
      setEditMemoryLimit(detail.memoryLimitKb || 262144)
      setEditTags(detail.tags || [])
      setEditStatement(detail.statement || '')
      setEditInputFormat(detail.inputFormat || '')
      setEditOutputFormat(detail.outputFormat || '')
      setEditConstraints(detail.constraints || '')
      setEditExplanation(detail.explanationNote || '')
      setEditModalOpen(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không thể lấy chi tiết bài tập để chỉnh sửa!')
      }
    } finally {
      setLoading(false)
    }
  }

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    if (!editTitle.trim() || !editStatement.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung mô tả bài toán!')
      return
    }

    setSubmittingEdit(true)
    try {
      const req: UpdateProblemRequest = {
        title: editTitle.trim(),
        difficulty: editDifficulty,
        timeLimitMs: Number(editTimeLimit),
        memoryLimitKb: Number(editMemoryLimit),
        tagNames: editTags,
        statement: editStatement.trim(),
        inputFormat: editInputFormat.trim() || undefined,
        outputFormat: editOutputFormat.trim() || undefined,
        constraints: editConstraints.trim() || undefined,
        explanationNote: editExplanation.trim() || undefined,
      }

      await problemService.updateProblem(editingId, req)
      setEditModalOpen(false)
      showNotification(`Cập nhật bài tập "${editTitle}" thành công!`)
      fetchProblems()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Lỗi khi cập nhật bài tập!')
      }
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Handle Create Form Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formTitle.trim()) {
      setError('Tiêu đề bài tập không được để trống!')
      return
    }
    if (!formStatement.trim()) {
      setError('Mô tả bài toán không được để trống!')
      return
    }

    setSubmittingForm(true)
    try {
      const req: CreateProblemRequest = {
        title: formTitle.trim(),
        difficulty: formDifficulty,
        timeLimitMs: Number(formTimeLimit),
        memoryLimitKb: Number(formMemoryLimit),
        tagNames: formTags,
        statement: formStatement.trim(),
        inputFormat: formInputFormat.trim() || undefined,
        outputFormat: formOutputFormat.trim() || undefined,
        constraints: formConstraints.trim() || undefined,
        explanationNote: formExplanation.trim() || undefined,
      }

      const created = await problemService.createProblem(req)
      showNotification(`Tạo bài tập "${created.title}" thành công (Trạng thái: DRAFT)!`)

      // Reset form
      setFormTitle('')
      setFormDifficulty('EASY')
      setFormTimeLimit(1000)
      setFormMemoryLimit(262144)
      setFormTags([])
      setFormTagInput('')
      setFormStatement('')
      setFormInputFormat('')
      setFormOutputFormat('')
      setFormConstraints('')
      setFormExplanation('')

      // Switch to list tab
      setActiveTab('LIST')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Lỗi khi tạo bài tập mới!')
      }
    } finally {
      setSubmittingForm(false)
    }
  }

  // Tag Helpers for Create
  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !formTags.includes(trimmed)) {
      setFormTags([...formTags, trimmed])
    }
    setFormTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter((t) => t !== tagToRemove))
  }

  // Tag Helpers for Edit
  const handleAddEditTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed])
    }
    setEditTagInput('')
  }

  const handleRemoveEditTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((t) => t !== tagToRemove))
  }

  const getDifficultyBadge = (diff: ProblemDifficulty) => {
    switch (diff) {
      case 'EASY':
        return <span className="diff-badge diff-easy">Dễ</span>
      case 'MEDIUM':
        return <span className="diff-badge diff-medium">Trung bình</span>
      case 'HARD':
        return <span className="diff-badge diff-hard">Khó</span>
      default:
        return <span className="diff-badge">{diff}</span>
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="status-badge status-published">PUBLISHED (Công khai)</span>
      case 'ARCHIVED':
        return <span className="status-badge status-archived">ARCHIVED (Lưu trữ)</span>
      case 'DRAFT':
      default:
        return <span className="status-badge status-draft">DRAFT (Bản nháp)</span>
    }
  }

  return (
    <div className="admin-container">
      {/* Top Banner */}
      <div className="roundbox" style={{ marginBottom: '14px' }}>
        <div className="caption titled">
          <span>
            <span className="caption-arrow">→</span> Trung tâm Quản trị Hệ thống (Admin Portal)
          </span>
        </div>
        <div className="roundbox-body">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-title">Tổng số bài tập</div>
              <div className="admin-stat-number">{totalElements}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-title">Quyền truy cập</div>
              <div className="admin-stat-number" style={{ fontSize: '18px', color: '#1755a6' }}>
                ADMIN / SETTER
              </div>
            </div>
          </div>

          <div className="admin-subnav">
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'LIST' ? 'active' : ''}`}
              onClick={() => setActiveTab('LIST')}
            >
              Danh sách quản lý bài tập
            </button>
            <button
              type="button"
              className={`admin-nav-btn ${activeTab === 'CREATE' ? 'active' : ''}`}
              onClick={() => setActiveTab('CREATE')}
            >
              Thêm bài tập mới
            </button>
          </div>

          {successMsg && (
            <div className="cf-notice cf-notice-success" style={{ marginBottom: '12px' }}>
              {successMsg}
            </div>
          )}

          {error && (
            <div className="cf-notice cf-notice-error" style={{ marginBottom: '12px' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* View 1: List & Manage Problems */}
      {activeTab === 'LIST' && (
        <div className="roundbox">
          <div className="caption titled">
            <span>
              <span className="caption-arrow">→</span> Danh sách bài tập hệ thống ({totalElements} bài)
            </span>
          </div>

          <div className="roundbox-body">
            {/* Filter Bar */}
            <form
              className="problem-filter-form"
              style={{ marginBottom: '14px' }}
              onSubmit={(e) => {
                e.preventDefault()
                setPage(0)
                setAppliedFilters({
                  keyword: inputKeyword,
                  difficulty: inputDifficulty,
                  status: inputStatus,
                })
              }}
            >
              <div className="filter-group">
                <label className="filter-label">Tìm kiếm:</label>
                <input
                  type="text"
                  className="cf-input filter-input"
                  placeholder="Tiêu đề, mã slug..."
                  value={inputKeyword}
                  onChange={(e) => setInputKeyword(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Độ khó:</label>
                <select
                  className="cf-input filter-select"
                  value={inputDifficulty}
                  onChange={(e) => setInputDifficulty(e.target.value as ProblemDifficulty | '')}
                >
                  <option value="">Tất cả độ khó</option>
                  <option value="EASY">Dễ (Easy)</option>
                  <option value="MEDIUM">Trung bình (Medium)</option>
                  <option value="HARD">Khó (Hard)</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Trạng thái:</label>
                <select
                  className="cf-input filter-select"
                  value={inputStatus}
                  onChange={(e) => setInputStatus(e.target.value as ProblemStatus | '')}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PUBLISHED">Công khai (PUBLISHED)</option>
                  <option value="DRAFT">Bản nháp (DRAFT)</option>
                  <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                </select>
              </div>

              <div className="filter-actions">
                <button type="submit" className="btn-cf btn-cf-primary">
                  Lọc
                </button>
                {(inputKeyword || inputDifficulty || inputStatus || appliedFilters.keyword || appliedFilters.difficulty || appliedFilters.status) && (
                  <button
                    type="button"
                    className="btn-cf"
                    onClick={() => {
                      setInputKeyword('')
                      setInputDifficulty('')
                      setInputStatus('')
                      setPage(0)
                      setAppliedFilters({
                        keyword: '',
                        difficulty: '',
                        status: '',
                      })
                    }}
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </form>

            {/* Table */}
            {loading ? (
              <div className="loading-box" style={{ padding: '30px', textAlign: 'center' }}>
                <div className="cf-spinner"></div>
                <span>Đang tải dữ liệu bài tập...</span>
              </div>
            ) : problems.length === 0 ? (
              <div className="empty-state-box" style={{ padding: '30px', textAlign: 'center' }}>
                <p>Không tìm thấy bài tập nào.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="problem-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                      <th>Tiêu đề & Slug</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Độ khó</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Trạng thái</th>
                      <th style={{ width: '220px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((p, idx) => {
                      const itemIdx = page * pageSize + idx + 1
                      return (
                        <tr key={p.id}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#666' }}>
                            {itemIdx}
                          </td>
                          <td>
                            <div style={{ fontWeight: 'bold', color: '#1755a6', fontSize: '13px' }}>
                              {p.title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                              Slug: <code className="slug-code">{p.slug}</code>
                            </div>
                            {p.tags && p.tags.length > 0 && (
                              <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {p.tags.map((t) => (
                                  <span key={t} className="mini-tag">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>{getDifficultyBadge(p.difficulty)}</td>
                          <td style={{ textAlign: 'center' }}>{getStatusBadge(p.status)}</td>
                          <td>
                            <div className="admin-actions-cell">
                              {onViewProblem && (
                                <button
                                  type="button"
                                  className="btn-action"
                                  title="Xem giao diện bài giải"
                                  onClick={() => onViewProblem(p.slug)}
                                >
                                  Xem
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-action btn-action-edit"
                                title="Chỉnh sửa thông tin bài tập"
                                onClick={() => handleOpenEdit(p)}
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                className="btn-action btn-action-testcase"
                                title="Quản lý bộ test case của bài tập"
                                onClick={() => handleOpenTestCases(p)}
                              >
                                Bộ Test
                              </button>
                              <select
                                className="cf-input"
                                style={{ fontSize: '11px', padding: '2px 4px', height: '24px' }}
                                value={p.status || 'PUBLISHED'}
                                onChange={(e) => handleStatusChange(p.id, e.target.value as ProblemStatus)}
                              >
                                <option value="PUBLISHED">Công khai</option>
                                <option value="DRAFT">Nháp</option>
                                <option value="ARCHIVED">Lưu trữ</option>
                              </select>
                              <button
                                type="button"
                                className="btn-action btn-action-delete"
                                title="Xóa bài tập"
                                onClick={() => {
                                  setDeleteConfirmId(p.id)
                                  setDeleteConfirmTitle(p.title)
                                }}
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-bar" style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  ← Trước
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i).map((pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      className={`pagination-number ${page === pIdx ? 'active' : ''}`}
                      onClick={() => setPage(pIdx)}
                    >
                      {pIdx + 1}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  Sau →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 2: Create New Problem Form */}
      {activeTab === 'CREATE' && (
        <div className="roundbox">
          <div className="caption titled">
            <span>
              <span className="caption-arrow">→</span> Biểu mẫu tạo bài tập mới
            </span>
          </div>
          <div className="roundbox-body">
            <form onSubmit={handleCreateSubmit}>
              <div className="admin-form-grid">
                <div className="form-group-full">
                  <label className="admin-form-label">
                    Tiêu đề bài tập <span style={{ color: '#d32f2f' }}>*</span>:
                  </label>
                  <input
                    type="text"
                    className="cf-input admin-form-input"
                    placeholder="Ví dụ: Hai số tổng (Two Sum)"
                    value={formTitle}
                    required
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="admin-form-label">Độ khó:</label>
                  <select
                    className="cf-input admin-form-input"
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as ProblemDifficulty)}
                  >
                    <option value="EASY">Dễ (EASY)</option>
                    <option value="MEDIUM">Trung bình (MEDIUM)</option>
                    <option value="HARD">Khó (HARD)</option>
                  </select>
                </div>

                <div>
                  <label className="admin-form-label">Giới hạn thời gian (ms):</label>
                  <input
                    type="number"
                    className="cf-input admin-form-input"
                    min={100}
                    step={100}
                    value={formTimeLimit}
                    onChange={(e) => setFormTimeLimit(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="admin-form-label">Giới hạn bộ nhớ (KB):</label>
                  <input
                    type="number"
                    className="cf-input admin-form-input"
                    min={16384}
                    step={1024}
                    value={formMemoryLimit}
                    onChange={(e) => setFormMemoryLimit(Number(e.target.value))}
                  />
                </div>

                <div className="form-group-full">
                  <label className="admin-form-label">Chủ đề & Thẻ (Tags):</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      className="cf-input"
                      style={{ flex: 1 }}
                      placeholder="Nhập tên tag rồi ấn Thêm..."
                      value={formTagInput}
                      onChange={(e) => setFormTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag(formTagInput)
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-cf"
                      onClick={() => handleAddTag(formTagInput)}
                    >
                      Thêm tag
                    </button>
                  </div>

                  {/* Selected Tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {formTags.map((t) => (
                      <span key={t} className="tag-pill active" style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)}>
                        {t} [X]
                      </span>
                    ))}
                  </div>

                  {/* Tag Quick Select */}
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Gợi ý nhanh:{' '}
                    {AVAILABLE_TAGS.slice(0, 10).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="tag-pill"
                        style={{ margin: '2px', fontSize: '10.5px' }}
                        onClick={() => handleAddTag(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-full">
                  <label className="admin-form-label">
                    Mô tả bài toán (Statement - Hỗ trợ Markdown) <span style={{ color: '#d32f2f' }}>*</span>:
                  </label>
                  <textarea
                    className="cf-input source-textarea"
                    rows={8}
                    placeholder="Mô tả chi tiết bài toán, bối cảnh, yêu cầu..."
                    value={formStatement}
                    required
                    onChange={(e) => setFormStatement(e.target.value)}
                  />
                </div>

                <div>
                  <label className="admin-form-label">Định dạng đầu vào (Input Format):</label>
                  <textarea
                    className="cf-input source-textarea"
                    rows={4}
                    placeholder="Dòng 1 chứa N... Dòng 2 chứa mảng..."
                    value={formInputFormat}
                    onChange={(e) => setFormInputFormat(e.target.value)}
                  />
                </div>

                <div>
                  <label className="admin-form-label">Định dạng đầu ra (Output Format):</label>
                  <textarea
                    className="cf-input source-textarea"
                    rows={4}
                    placeholder="In ra kết quả trên 1 dòng..."
                    value={formOutputFormat}
                    onChange={(e) => setFormOutputFormat(e.target.value)}
                  />
                </div>

                <div>
                  <label className="admin-form-label">Ràng buộc dữ liệu (Constraints):</label>
                  <textarea
                    className="cf-input source-textarea"
                    rows={3}
                    placeholder="1 <= N <= 10^5..."
                    value={formConstraints}
                    onChange={(e) => setFormConstraints(e.target.value)}
                  />
                </div>

                <div>
                  <label className="admin-form-label">Ghi chú & Giải thích ví dụ (Explanation):</label>
                  <textarea
                    className="cf-input source-textarea"
                    rows={3}
                    placeholder="Giải thích các test mẫu..."
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="submit"
                  className="btn-cf btn-cf-primary"
                  disabled={submittingForm}
                  style={{ minWidth: '150px' }}
                >
                  {submittingForm ? 'Đang lưu bài tập...' : 'Lưu bài tập mới'}
                </button>
                <button
                  type="button"
                  className="btn-cf"
                  onClick={() => setActiveTab('LIST')}
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Problem Modal */}
      {editModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="admin-modal-header">
              <div className="admin-modal-title">Chỉnh sửa bài tập</div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setEditModalOpen(false)}
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  <div className="form-group-full">
                    <label className="admin-form-label">Tiêu đề bài tập:</label>
                    <input
                      type="text"
                      className="cf-input admin-form-input"
                      value={editTitle}
                      required
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Độ khó:</label>
                    <select
                      className="cf-input admin-form-input"
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(e.target.value as ProblemDifficulty)}
                    >
                      <option value="EASY">Dễ (EASY)</option>
                      <option value="MEDIUM">Trung bình (MEDIUM)</option>
                      <option value="HARD">Khó (HARD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="admin-form-label">Giới hạn thời gian (ms):</label>
                    <input
                      type="number"
                      className="cf-input admin-form-input"
                      min={100}
                      step={100}
                      value={editTimeLimit}
                      onChange={(e) => setEditTimeLimit(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Giới hạn bộ nhớ (KB):</label>
                    <input
                      type="number"
                      className="cf-input admin-form-input"
                      min={16384}
                      step={1024}
                      value={editMemoryLimit}
                      onChange={(e) => setEditMemoryLimit(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group-full">
                    <label className="admin-form-label">Chủ đề & Tags:</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input
                        type="text"
                        className="cf-input"
                        style={{ flex: 1 }}
                        placeholder="Thêm tag..."
                        value={editTagInput}
                        onChange={(e) => setEditTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddEditTag(editTagInput)
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-cf"
                        onClick={() => handleAddEditTag(editTagInput)}
                      >
                        Thêm
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {editTags.map((t) => (
                        <span
                          key={t}
                          className="tag-pill active"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveEditTag(t)}
                        >
                          {t} [X]
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-group-full">
                    <label className="admin-form-label">Mô tả bài toán:</label>
                    <textarea
                      className="cf-input source-textarea"
                      rows={6}
                      value={editStatement}
                      required
                      onChange={(e) => setEditStatement(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Đầu vào (Input):</label>
                    <textarea
                      className="cf-input source-textarea"
                      rows={3}
                      value={editInputFormat}
                      onChange={(e) => setEditInputFormat(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Đầu ra (Output):</label>
                    <textarea
                      className="cf-input source-textarea"
                      rows={3}
                      value={editOutputFormat}
                      onChange={(e) => setEditOutputFormat(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Ràng buộc (Constraints):</label>
                    <textarea
                      className="cf-input source-textarea"
                      rows={3}
                      value={editConstraints}
                      onChange={(e) => setEditConstraints(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="admin-form-label">Ghi chú & Giải thích:</label>
                    <textarea
                      className="cf-input source-textarea"
                      rows={3}
                      value={editExplanation}
                      onChange={(e) => setEditExplanation(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-cf"
                  onClick={() => setEditModalOpen(false)}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn-cf btn-cf-primary"
                  disabled={submittingEdit}
                >
                  {submittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '440px' }}>
            <div className="admin-modal-header">
              <div className="admin-modal-title" style={{ color: '#d32f2f' }}>
                Xác nhận xóa bài tập
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDeleteConfirmId(null)}
              >
                Đóng
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '13px', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn xóa bài tập{' '}
                <strong>"{deleteConfirmTitle}"</strong> khỏi hệ thống không?
              </p>
              <p style={{ color: '#888', fontSize: '12px', marginTop: '6px' }}>
                Hành động này sẽ đánh dấu xóa bài tập này và chỉ quản trị viên mới có thể phục hồi.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-cf"
                onClick={() => setDeleteConfirmId(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-cf btn-cf-danger"
                onClick={handleDeleteProblem}
              >
                Xóa bài tập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Case Manager Modal */}
      {testCaseModalOpen && activeTestCaseProblem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '840px' }}>
            <div className="admin-modal-header">
              <div>
                <div className="admin-modal-title">
                  Quản lý Bộ Test: {activeTestCaseProblem.title}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  Mã bài: <code className="slug-code">{activeTestCaseProblem.slug}</code> | Tổng số test: <strong>{testCasesList.length}</strong>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setTestCaseModalOpen(false)
                  setActiveTestCaseProblem(null)
                  handleCancelEditTestCase()
                }}
              >
                Đóng
              </button>
            </div>

            <div className="admin-modal-body">
              {testCaseSuccessMsg && (
                <div className="cf-notice cf-notice-success" style={{ marginBottom: '12px' }}>
                  {testCaseSuccessMsg}
                </div>
              )}

              {testCaseError && (
                <div className="cf-notice cf-notice-error" style={{ marginBottom: '12px' }}>
                  {testCaseError}
                </div>
              )}

              {/* Section 1: Existing Test Cases List */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#333' }}>
                  Danh sách Test Cases hiện có ({testCasesList.length} test):
                </h4>

                {loadingTestCases ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#666' }}>
                    Đang tải bộ test...
                  </div>
                ) : testCasesList.length === 0 ? (
                  <div style={{ padding: '12px', background: '#f9f9f9', border: '1px dashed #ccc', textAlign: 'center', color: '#666' }}>
                    Bài tập này chưa có test case nào. Hãy thêm test case bên dưới!
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    <table className="testcase-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                          <th style={{ width: '130px', textAlign: 'center' }}>Loại test</th>
                          <th>Đầu vào (Input)</th>
                          <th>Đầu ra mong muốn (Expected Output)</th>
                          <th style={{ width: '110px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testCasesList.map((tc) => (
                          <tr key={tc.id} style={{ backgroundColor: editingTestCaseId === tc.id ? '#eef6ff' : undefined }}>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#555' }}>
                              {tc.orderIndex}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {tc.isSample ? (
                                <span className="badge-sample">Ví dụ (Sample)</span>
                              ) : (
                                <span className="badge-hidden">Ẩn (Hidden)</span>
                              )}
                            </td>
                            <td>
                              <pre className="testcase-code-preview">{tc.input || '(trống)'}</pre>
                            </td>
                            <td>
                              <pre className="testcase-code-preview">{tc.expectedOutput || '(trống)'}</pre>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-action btn-action-edit"
                                  onClick={() => handleEditTestCaseClick(tc)}
                                  title="Chỉnh sửa test case này"
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className="btn-action btn-action-delete"
                                  onClick={() => setDeleteTestCaseConfirmId(tc.id)}
                                  title="Xóa test case này"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 2: Form to Add / Edit Test Case */}
              <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: editingTestCaseId ? '#1976d2' : '#2e7d32' }}>
                  {editingTestCaseId ? `Chỉnh sửa Test Case #${tcOrderIndex}` : 'Thêm Test Case mới:'}
                </h4>

                <form onSubmit={handleSaveTestCase}>
                  <div className="admin-form-grid">
                    <div>
                      <label className="admin-form-label">
                        Đầu vào (Input Data):
                      </label>
                      <textarea
                        className="cf-input source-textarea"
                        rows={4}
                        placeholder="Nhập input của test case (ví dụ: 4 9\n2 7 11 15)..."
                        value={tcInput}
                        onChange={(e) => setTcInput(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="admin-form-label">
                        Đầu ra mong muốn (Expected Output Data):
                      </label>
                      <textarea
                        className="cf-input source-textarea"
                        rows={4}
                        placeholder="Nhập output mong muốn (ví dụ: 0 1)..."
                        value={tcExpectedOutput}
                        onChange={(e) => setTcExpectedOutput(e.target.value)}
                      />
                    </div>

                    <div className="form-group-full" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <label className="checkbox-row" style={{ fontWeight: 'bold' }}>
                        <input
                          type="checkbox"
                          checked={tcIsSample}
                          onChange={(e) => setTcIsSample(e.target.checked)}
                        />
                        Đặt làm test ví dụ (Sample Case - Hiển thị công khai trên đề bài)
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label className="admin-form-label" style={{ margin: 0 }}>Thứ tự (#):</label>
                        <input
                          type="number"
                          className="cf-input"
                          style={{ width: '70px', padding: '3px 6px' }}
                          min={1}
                          placeholder="Tự động"
                          value={tcOrderIndex}
                          onChange={(e) => setTcOrderIndex(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="submit"
                      className="btn-cf btn-cf-primary"
                      disabled={submittingTestCase}
                    >
                      {submittingTestCase
                        ? 'Đang lưu...'
                        : editingTestCaseId
                        ? 'Lưu thay đổi Test Case'
                        : 'Lưu Test Case này'}
                    </button>

                    {editingTestCaseId && (
                      <button
                        type="button"
                        className="btn-cf"
                        onClick={handleCancelEditTestCase}
                      >
                        Hủy chế độ sửa
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-cf"
                onClick={() => {
                  setTestCaseModalOpen(false)
                  setActiveTestCaseProblem(null)
                  handleCancelEditTestCase()
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Test Case Confirmation Modal */}
      {deleteTestCaseConfirmId && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="admin-modal-box" style={{ maxWidth: '400px' }}>
            <div className="admin-modal-header">
              <div className="admin-modal-title" style={{ color: '#d32f2f' }}>
                Xác nhận xóa Test Case
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDeleteTestCaseConfirmId(null)}
              >
                Đóng
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '13px', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn xóa test case này khỏi bộ test của bài tập không?
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-cf"
                onClick={() => setDeleteTestCaseConfirmId(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn-cf btn-cf-danger"
                onClick={() => handleDeleteTestCase(deleteTestCaseConfirmId)}
              >
                Xóa Test Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
