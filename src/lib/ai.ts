import { callGeminiJson, hasGeminiKey } from './gemini'
import { callClaudeJson,  hasClaudeKey  } from './claude'

export type AiProvider = 'claude' | 'gemini' | 'none'

export const getActiveProvider = (): AiProvider => {
  // Cho phép override qua localStorage
  const forced = localStorage.getItem('ai_provider') as AiProvider | null
  if (forced === 'claude' && hasClaudeKey()) return 'claude'
  if (forced === 'gemini' && hasGeminiKey()) return 'gemini'

  // Auto: ưu tiên Claude nếu có key
  if (hasClaudeKey()) return 'claude'
  if (hasGeminiKey()) return 'gemini'
  return 'none'
}

export const hasAi = (): boolean => getActiveProvider() !== 'none'

/**
 * Gọi AI để generate JSON theo schema.
 * - Gemini: dùng responseSchema (structured output chuẩn)
 * - Claude: instruct trong prompt
 */
export async function aiJson<T>(prompt: string, schema: any, opts?: { temperature?: number }): Promise<T> {
  const provider = getActiveProvider()
  if (provider === 'claude') {
    return callClaudeJson<T>(prompt, { temperature: opts?.temperature })
  }
  if (provider === 'gemini') {
    return callGeminiJson<T>(prompt, schema, { temperature: opts?.temperature })
  }
  throw new Error('Chưa có AI provider nào được cấu hình')
}
