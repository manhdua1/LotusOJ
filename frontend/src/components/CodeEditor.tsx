import React, { useState, useRef, useEffect } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import type { Language } from '../types/submission'
import type { editor } from 'monaco-editor'
import { MONACO_LANGUAGE_MAP, CODE_TEMPLATES } from '../constants/editorTemplates'
import { useTheme } from '../context/useTheme'
import {
  IconReset,
  IconCopy,
  IconCheck,
  IconTrash,
  IconSun,
  IconMoon,
  IconExpand,
  IconCompress,
} from './Icons'

export interface CodeEditorProps {
  language: Language
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  height?: string
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  onSubmit?: () => void
  className?: string
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  value,
  onChange,
  disabled = false,
  height = '100%',
  isFullscreen = false,
  onToggleFullscreen,
  onSubmit,
  className = '',
}) => {
  // Synchronized global theme: 'light' or 'dark'
  const { theme: appTheme, toggleTheme } = useTheme()
  const monacoTheme = appTheme === 'dark' ? 'vs-dark' : 'light'

  // Font size state
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('lotusoj_editor_fontsize')
    return saved ? parseInt(saved, 10) : 13
  })

  // Cursor position
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 })
  const [copied, setCopied] = useState<boolean>(false)

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const onSubmitRef = useRef<(() => void) | undefined>(onSubmit)

  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])

  const monacoLang = MONACO_LANGUAGE_MAP[language] || 'cpp'

  const handleEditorMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance

    editorInstance.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column,
      })
    })

    // Keyboard shortcut: Ctrl + Enter / Cmd + Enter to submit solution
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onSubmitRef.current) {
        onSubmitRef.current()
      }
    })
  }

  const handleToggleTheme = () => {
    toggleTheme()
  }

  const handleChangeFontSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = parseInt(e.target.value, 10)
    setFontSize(size)
    localStorage.setItem('lotusoj_editor_fontsize', size.toString())
  }

  const handleApplyTemplate = () => {
    const template = CODE_TEMPLATES[language]
    if (!template) return

    if (value && value.trim().length > 0) {
      if (!window.confirm('Hành động này sẽ thay thế mã nguồn hiện tại bằng code mẫu. Bạn có chắc chắn không?')) {
        return
      }
    }
    onChange(template)
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }

  const handleClearCode = () => {
    if (!value || value.trim().length === 0) return
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ mã nguồn không?')) {
      onChange('')
      if (editorRef.current) {
        editorRef.current.focus()
      }
    }
  }

  const handleCopyCode = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Count lines and characters
  const lineCount = value ? value.split('\n').length : 1
  const charCount = value ? value.length : 0

  return (
    <div className={`leetcode-editor-wrapper theme-${appTheme} ${isFullscreen ? 'is-fullscreen' : ''} ${className}`}>
      {/* Editor Control Toolbar */}
      <div className="leetcode-editor-toolbar">
        <div className="leetcode-editor-toolbar-left">
          <span className="leetcode-editor-lang-tag">
            <span className="leetcode-editor-lang-dot"></span>
            {language}
          </span>

          <button
            type="button"
            className="leetcode-toolbar-btn"
            onClick={handleApplyTemplate}
            disabled={disabled}
            title="Khôi phục khung mã nguồn mẫu cho ngôn ngữ này"
          >
            <IconReset size={13} />
            <span>Mẫu code</span>
          </button>
        </div>

        <div className="leetcode-editor-toolbar-right">
          {/* Font size picker */}
          <div className="leetcode-fontsize-wrap" title="Kích thước chữ">
            <select
              value={fontSize}
              onChange={handleChangeFontSize}
              className="leetcode-toolbar-select"
            >
              <option value={12}>12px</option>
              <option value={13}>13px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
            </select>
          </div>

          {/* Theme switcher */}
          <button
            type="button"
            className="leetcode-toolbar-btn"
            onClick={handleToggleTheme}
            title={`Chuyển sang giao diện ${appTheme === 'dark' ? 'Sáng (Light)' : 'Tối (Dark)'}`}
          >
            {appTheme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
            <span>{appTheme === 'dark' ? 'Sáng' : 'Tối'}</span>
          </button>

          {/* Copy code */}
          <button
            type="button"
            className="leetcode-toolbar-btn"
            onClick={handleCopyCode}
            title="Sao chép toàn bộ mã nguồn"
          >
            {copied ? <IconCheck size={14} color="#4ade80" /> : <IconCopy size={13} />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>

          {/* Clear code */}
          <button
            type="button"
            className="leetcode-toolbar-btn leetcode-toolbar-btn-danger"
            onClick={handleClearCode}
            disabled={disabled || !value}
            title="Xóa sạch mã nguồn"
          >
            <IconTrash size={13} />
            <span>Xóa</span>
          </button>

          {/* Fullscreen toggle button */}
          {onToggleFullscreen && (
            <button
              type="button"
              className="leetcode-toolbar-btn leetcode-toolbar-btn-accent"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Thu nhỏ giao diện' : 'Toàn màn hình'}
            >
              {isFullscreen ? <IconCompress size={13} /> : <IconExpand size={13} />}
              <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="leetcode-editor-main">
        <Editor
          height={height}
          language={monacoLang}
          value={value}
          onChange={(val) => onChange(val || '')}
          theme={monacoTheme}
          onMount={handleEditorMount}
          loading={
            <div className="leetcode-editor-loading">
              <div className="cf-spinner"></div>
              <span>Đang khởi tạo trình soạn thảo code...</span>
            </div>
          }
          options={{
            readOnly: disabled,
            fontSize,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: {
              enabled: isFullscreen,
            },
            bracketPairColorization: {
              enabled: true,
            },
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
            lineHeight: 20,
            padding: {
              top: 10,
              bottom: 10,
            },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="leetcode-editor-statusbar">
        <div className="leetcode-statusbar-left">
          <span>Dòng {cursorPos.line}, Cột {cursorPos.col}</span>
          <span className="leetcode-status-sep">|</span>
          <span>{lineCount} dòng, {charCount} ký tự</span>
        </div>
        <div className="leetcode-statusbar-right">
          <span>Tab: 4</span>
          <span className="leetcode-status-sep">|</span>
          <span>UTF-8</span>
          <span className="leetcode-status-sep">|</span>
          <span className="leetcode-theme-badge">{appTheme === 'dark' ? 'VS Dark' : 'Light'}</span>
        </div>
      </div>
    </div>
  )
}
