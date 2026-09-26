import React, { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import katex from 'katex'
import 'katex/dist/katex.min.css'

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
      const mathTokens: { token: string; html: string }[] = []
      let tokenIdx = 0
      let processed = content

      // 1. Render block math $$...$$
      processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_match, eq) => {
        const token = `@@LOTUS_MATH_BLOCK_${tokenIdx++}@@`
        try {
          const rendered = katex.renderToString(eq.trim(), {
            displayMode: true,
            throwOnError: false,
          })
          mathTokens.push({
            token,
            html: `<div class="math-display">${rendered}</div>`,
          })
        } catch {
          mathTokens.push({
            token,
            html: `<div class="math-display"><code>${eq.trim()}</code></div>`,
          })
        }
        return `\n\n${token}\n\n`
      })

      // 2. Render inline math $...$
      processed = processed.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (_match, prefix, eq) => {
        const token = `@@LOTUS_MATH_INLINE_${tokenIdx++}@@`
        try {
          const rendered = katex.renderToString(eq.trim(), {
            displayMode: false,
            throwOnError: false,
          })
          mathTokens.push({
            token,
            html: rendered,
          })
        } catch {
          mathTokens.push({
            token,
            html: `<span class="math-inline">${eq.trim()}</span>`,
          })
        }
        return `${prefix}${token}`
      })

      // 3. Parse Markdown with marked
      let parsed = marked.parse(processed) as string

      // 4. Restore math tokens
      for (const item of mathTokens) {
        parsed = parsed.replaceAll(item.token, item.html)
      }

      // 5. Sanitize HTML preserving KaTeX MathML tags & attributes
      return DOMPurify.sanitize(parsed, {
        ADD_TAGS: [
          'annotation',
          'semantics',
          'math',
          'mrow',
          'mi',
          'mn',
          'mo',
          'msup',
          'msub',
          'mspace',
          'mover',
          'munder',
          'mfrac',
          'msqrt',
          'mroot',
          'mtable',
          'mtr',
          'mtd',
          'msubsup',
          'munderover',
          'menclose',
          'mpadded',
        ],
        ADD_ATTR: ['target', 'rel', 'display', 'aria-hidden'],
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

