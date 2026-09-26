import type { Language } from '../types/submission'

const DRAFT_PREFIX = 'lotusoj_draft_'
const LAST_LANG_PREFIX = 'lotusoj_last_lang_'

export interface CodeDraftData {
  slug: string
  language: Language
  code: string
  updatedAt: number
}

const SUPPORTED_LANGUAGES: Language[] = ['CPP', 'JAVA', 'PYTHON', 'C', 'CSHARP']

export const codeDraftService = {
  /**
   * Lay ma nguon ban nhap cua mot bai tap theo ngon ngu
   */
  getDraft(slug: string, language: Language): string | null {
    if (!slug) return null
    try {
      const key = `${DRAFT_PREFIX}${slug}_${language}`
      const raw = localStorage.getItem(key)
      if (!raw) return null
      try {
        const parsed = JSON.parse(raw) as CodeDraftData
        if (parsed && typeof parsed.code === 'string') {
          return parsed.code
        }
      } catch {
        return raw
      }
      return null
    } catch {
      return null
    }
  },

  /**
   * Lay metadata (thoi gian cap nhat, ma nguon) cua ban nhap
   */
  getDraftMetadata(slug: string, language: Language): CodeDraftData | null {
    if (!slug) return null
    try {
      const key = `${DRAFT_PREFIX}${slug}_${language}`
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as CodeDraftData
    } catch {
      return null
    }
  },

  /**
   * Luu ma nguon ban nhap vao localStorage theo bai tap va ngon ngu
   */
  saveDraft(slug: string, language: Language, code: string): void {
    if (!slug) return
    try {
      const key = `${DRAFT_PREFIX}${slug}_${language}`
      const payload: CodeDraftData = {
        slug,
        language,
        code,
        updatedAt: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(payload))
    } catch (err) {
      console.warn('[CodeDraftService] Khong the luu ban nhap vao localStorage:', err)
    }
  },

  /**
   * Xoa ban nhap cua mot bai tap theo ngon ngu
   */
  clearDraft(slug: string, language: Language): void {
    if (!slug) return
    try {
      const key = `${DRAFT_PREFIX}${slug}_${language}`
      localStorage.removeItem(key)
    } catch (err) {
      console.warn('[CodeDraftService] Khong the xoa ban nhap:', err)
    }
  },

  /**
   * Kiem tra xem co ban nhap cho bai tap va ngon ngu hay khong
   */
  hasDraft(slug: string, language: Language): boolean {
    return this.getDraft(slug, language) !== null
  },

  /**
   * Lay danh sach ngon ngu da co ban nhap cua bai tap nay
   */
  getAllDraftLanguages(slug: string): Language[] {
    if (!slug) return []
    return SUPPORTED_LANGUAGES.filter((lang) => this.hasDraft(slug, lang))
  },

  /**
   * Lay ngon ngu duoc lua chon gan nhat cua bai tap
   */
  getLastLanguage(slug: string): Language | null {
    if (!slug) return null
    try {
      const val = localStorage.getItem(`${LAST_LANG_PREFIX}${slug}`)
      if (val && SUPPORTED_LANGUAGES.includes(val as Language)) {
        return val as Language
      }
      return null
    } catch {
      return null
    }
  },

  /**
   * Luu ngon ngu duoc lua chon gan nhat cua bai tap
   */
  saveLastLanguage(slug: string, language: Language): void {
    if (!slug) return
    try {
      localStorage.setItem(`${LAST_LANG_PREFIX}${slug}`, language)
    } catch (err) {
      console.warn('[CodeDraftService] Khong the luu ngon ngu cuoi:', err)
    }
  },

  /**
   * Xoa toan bo ban nhap cua tat ca ngon ngu cho mot bai tap
   */
  clearAllDraftsForProblem(slug: string): void {
    if (!slug) return
    SUPPORTED_LANGUAGES.forEach((lang) => {
      this.clearDraft(slug, lang)
    })
    try {
      localStorage.removeItem(`${LAST_LANG_PREFIX}${slug}`)
    } catch {
      // ignore
    }
  },
}
