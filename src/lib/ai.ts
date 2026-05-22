import { callGeminiJson, hasGeminiKey } from './gemini'
import { callClaudeJson,  hasClaudeKey  } from './claude'

export type AiProvider = 'claude' | 'gemini' | 'ollama' | 'none'

export const getActiveProvider = (): AiProvider => {
  // Cho phép override qua localStorage
  const forced = localStorage.getItem('ai_provider') as AiProvider | null
  if (forced === 'claude' && hasClaudeKey()) return 'claude'
  if (forced === 'gemini' && hasGeminiKey()) return 'gemini'
  if (forced === 'ollama') return 'ollama'

  // Auto: ưu tiên Claude nếu có key
  if (hasClaudeKey()) return 'claude'
  if (hasGeminiKey()) return 'gemini'
  return 'none'
}

export const hasAi = (): boolean => getActiveProvider() !== 'none'

export async function callOllamaJson<T>(prompt: string, schema: any): Promise<T> {
  const model = localStorage.getItem('ollama_model') || 'qwen2.5:7b'
  const host = localStorage.getItem('ollama_host') || 'http://localhost:11434'

  const res = await fetch(`${host}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. You must respond ONLY with a valid JSON object matching the requested schema. Do not wrap in markdown code blocks.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nRespond strictly in JSON format matching this schema: ${JSON.stringify(schema)}`
        }
      ],
      stream: false,
      options: {
        temperature: 0.7
      },
      format: 'json'
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ollama error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data?.message?.content || ''
  return JSON.parse(text) as T
}

/**
 * Gọi AI để generate JSON theo schema.
 * - Gemini: dùng responseSchema (structured output chuẩn)
 * - Claude: instruct trong prompt
 * - Ollama: định dạng JSON qua api local
 */
export async function aiJson<T>(prompt: string, schema: any, opts?: { temperature?: number }): Promise<T> {
  const provider = getActiveProvider()
  if (provider === 'claude') {
    return callClaudeJson<T>(prompt, { temperature: opts?.temperature })
  }
  if (provider === 'gemini') {
    return callGeminiJson<T>(prompt, schema, { temperature: opts?.temperature })
  }
  if (provider === 'ollama') {
    return callOllamaJson<T>(prompt, schema)
  }
  throw new Error('Chưa có AI provider nào được cấu hình')
}

