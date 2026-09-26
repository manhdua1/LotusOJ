import React, { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configure marked with GFM (GitHub Flavored Markdown) and line breaks
marked.setOptions({
  gfm: true,
  breaks: true,
})

export interface MarkdownRendererProps {
  content?: string
  className?: string
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  const html = useMemo(() => {
    if (!content || !content.trim()) return ''
    try {
      let processed = content

      // Render block math $$...$$ as a styled formula box
      processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_match, eq) => {
        return `\n\n<div class="math-display"><em>${eq.trim()}</em></div>\n\n`
      })

      // Render inline math $...$ with subtle math styling
      processed = processed.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (_match, prefix, eq) => {
        return `${prefix}<span class="math-inline">${eq.trim()}</span>`
      })

      const raw = marked.parse(processed) as string
      return DOMPurify.sanitize(raw, {
        ADD_ATTR: ['target', 'rel'],
      })
    } catch (err) {
      console.error('Failed to parse markdown:', err)
      return DOMPurify.sanitize(content)
    }
  }, [content])

  if (!content || !content.trim()) {
    return null
  }

  return (
    <div
      className={`markdown-body-rendered ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
