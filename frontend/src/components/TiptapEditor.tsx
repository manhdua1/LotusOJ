import React, { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import { MarkdownRenderer } from './MarkdownRenderer'

export interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

type EditorMode = 'visual' | 'markdown' | 'preview'

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập mô tả bài toán bằng định dạng Markdown...',
  minHeight = '240px',
}) => {
  const [mode, setMode] = useState<EditorMode>('visual')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TableKit,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      // Extract markdown from tiptap-markdown extension
      const md = (ed.storage as any).markdown?.getMarkdown?.() ?? ed.getHTML()
      onChange(md)
    },
  })

  // Synchronize external value changes (e.g. form reset, modal open, switching from raw markdown mode)
  useEffect(() => {
    if (!editor) return

    const currentMd = (editor.storage as any).markdown?.getMarkdown?.() ?? ''
    if (value !== currentMd && !editor.isFocused) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  const handleModeChange = useCallback(
    (newMode: EditorMode) => {
      if (newMode === 'visual' && mode === 'markdown' && editor) {
        // Sync raw markdown to visual editor
        editor.commands.setContent(value || '')
      }
      setMode(newMode)
    },
    [editor, mode, value]
  )

  const insertTemplate = () => {
    const template = `Cho một mảng các số nguyên \`nums\` gồm $N$ phần tử và một số nguyên \`target\`.

### Yêu cầu
Tìm chỉ số của **hai phần tử** sao cho tổng của chúng bằng \`target\`.

### Lưu ý
- Mỗi đầu vào có đúng một đáp án duy nhất.
- Không sử dụng một phần tử hai lần.
`
    if (mode === 'visual' && editor) {
      editor.commands.setContent(template)
      const md = (editor.storage as any).markdown?.getMarkdown?.() ?? template
      onChange(md)
    } else {
      onChange(template)
    }
  }

  if (!editor) {
    return (
      <div className="tiptap-editor-container" style={{ minHeight }}>
        <div style={{ padding: '12px', color: '#888' }}>Đang khởi tạo trình soạn thảo...</div>
      </div>
    )
  }

  return (
    <div className="tiptap-editor-container">
      {/* Top Header Bar: Mode switcher & Actions */}
      <div className="tiptap-header-bar">
        <div className="tiptap-mode-tabs">
          <button
            type="button"
            className={`tiptap-mode-tab ${mode === 'visual' ? 'active' : ''}`}
            onClick={() => handleModeChange('visual')}
            title="Soạn thảo trực quan WYSIWYG"
          >
            ✏️ Trực quan
          </button>
          <button
            type="button"
            className={`tiptap-mode-tab ${mode === 'markdown' ? 'active' : ''}`}
            onClick={() => handleModeChange('markdown')}
            title="Chỉnh sửa mã nguồn Markdown thô"
          >
            📄 Mã Markdown
          </button>
          <button
            type="button"
            className={`tiptap-mode-tab ${mode === 'preview' ? 'active' : ''}`}
            onClick={() => handleModeChange('preview')}
            title="Xem trước kết quả hiển thị"
          >
            👁️ Xem trước
          </button>
        </div>

        <div className="tiptap-header-actions">
          <button
            type="button"
            className="tiptap-action-btn"
            onClick={insertTemplate}
            title="Chèn cấu trúc mẫu bài toán"
          >
            + Chèn mẫu bài toán
          </button>
        </div>
      </div>

      {/* Visual Mode Formatting Toolbar */}
      {mode === 'visual' && (
        <div className="tiptap-toolbar">
          <div className="tiptap-btn-group">
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="In đậm (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="In nghiêng (Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Gạch ngang"
            >
              <s>S</s>
            </button>
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('code') ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Mã nội dòng (Inline Code)"
            >
              &lt;/&gt;
            </button>
          </div>

          <div className="tiptap-separator" />

          <div className="tiptap-btn-group">
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('paragraph') ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().setParagraph().run()}
              title="Đoạn văn"
            >
              P
            </button>
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Tiêu đề 1"
            >
              H1
            </button>
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Tiêu đề 2"
            >
              H2
            </button>
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Tiêu đề 3"
            >
              H3
            </button>
          </div>

          <div className="tiptap-separator" />

          <div className="tiptap-btn-group">
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Danh sách gạch đầu dòng"
            >
              • List
            </button>
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Danh sách số thứ tự"
            >
              1. List
            </button>
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Khối trích dẫn (Blockquote)"
            >
              ❝ Quote
            </button>
            <button
              type="button"
              className={`tiptap-tool-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Khối mã lệnh (Code Block)"
            >
              {'{ } Code'}
            </button>
            <button
              type="button"
              className="tiptap-tool-btn"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Đường phân cách ngang"
            >
              ― Kẻ ngang
            </button>
          </div>

          <div className="tiptap-separator" />

          <div className="tiptap-btn-group">
            <button
              type="button"
              className="tiptap-tool-btn"
              onClick={() =>
                (editor.chain().focus() as any)
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              title="Chèn bảng 3x3"
            >
              ▦ Bảng
            </button>
          </div>

          <div className="tiptap-separator" />

          <div className="tiptap-btn-group" style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className="tiptap-tool-btn"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Hoàn tác (Ctrl+Z)"
            >
              ↺
            </button>
            <button
              type="button"
              className="tiptap-tool-btn"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Làm lại (Ctrl+Y)"
            >
              ↻
            </button>
            <button
              type="button"
              className="tiptap-tool-btn"
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              title="Xóa định dạng đang chọn"
            >
              ✕ Xóa định dạng
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="tiptap-content-wrapper" style={{ minHeight }}>
        {mode === 'visual' && (
          <EditorContent editor={editor} className="tiptap-rendered-content" />
        )}

        {mode === 'markdown' && (
          <textarea
            className="tiptap-raw-textarea"
            style={{ minHeight }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
          />
        )}

        {mode === 'preview' && (
          <div className="tiptap-preview-wrapper" style={{ minHeight }}>
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <div className="tiptap-empty-preview">
                <em>(Chưa có nội dung mô tả để hiển thị xem trước)</em>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status / Hints Bar */}
      <div className="tiptap-status-bar">
        <span className="tiptap-hint-item">
          💡 Hỗ trợ cú pháp Markdown, mã nguồn, bảng và công thức toán học <code style={{ fontSize: '11px', background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>$công_thức$</code>.
        </span>
        <span className="tiptap-stats">
          {value.length} ký tự
        </span>
      </div>
    </div>
  )
}
