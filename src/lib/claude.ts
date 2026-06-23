const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

// Latest models — see https://docs.anthropic.com/en/docs/about-claude/models
export const CLAUDE_MODELS = {
  haiku:  'claude-haiku-4-5-20251001',   // nhanh, rẻ — phù hợp generate câu hỏi
  sonnet: 'claude-sonnet-4-6',           // chất lượng cao hơn
  opus:   'claude-opus-4-7',             // mạnh nhất
} as const

export const getClaudeKey = (): string =>
  localStorage.getItem('claude_api_key') || import.meta.env.VITE_CLAUDE_API_KEY || ''

export const hasClaudeKey = (): boolean => !!getClaudeKey()

interface ClaudeOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  system?: string
}

export async function callClaude(prompt: string, opts: ClaudeOptions = {}): Promise<string> {
  const apiKey = getClaudeKey()
  if (!apiKey) throw new Error('Chưa cấu hình VITE_CLAUDE_API_KEY')

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: opts.model ?? CLAUDE_MODELS.haiku,
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 1.0,
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Claude API ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return data?.content?.[0]?.text ?? ''
}

export async function callClaudeJson<T>(prompt: string, opts: ClaudeOptions = {}): Promise<T> {
  const text = await callClaude(
    prompt + '\n\nQUAN TRỌNG: Chỉ trả về JSON hợp lệ, không có markdown ```json fences, không có giải thích thêm.',
    opts
  )
  // Strip markdown code fences if accidentally present
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(clean) as T
}
