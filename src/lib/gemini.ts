const GEMINI_MODEL = 'gemini-flash-latest'
const GEMINI_URL = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

export const getGeminiKey = (): string =>
  import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || ''

export const hasGeminiKey = (): boolean => !!getGeminiKey()

export interface GeminiConfig {
  temperature?: number
  responseMimeType?: 'text/plain' | 'application/json'
  responseSchema?: any
  systemInstruction?: string
}

export async function callGemini(prompt: string, config: GeminiConfig = {}): Promise<string> {
  const apiKey = getGeminiKey()
  if (!apiKey) throw new Error('Chưa cấu hình Gemini API key')

  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: config.temperature ?? 0.9,
      ...(config.responseMimeType ? { responseMimeType: config.responseMimeType } : {}),
      ...(config.responseSchema   ? { responseSchema:   config.responseSchema   } : {}),
    },
  }
  if (config.systemInstruction) {
    body.systemInstruction = { parts: [{ text: config.systemInstruction }] }
  }

  const res = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini trả về rỗng')
  return text
}

export async function callGeminiJson<T>(prompt: string, schema: any, config?: GeminiConfig): Promise<T> {
  const text = await callGemini(prompt, {
    ...config,
    responseMimeType: 'application/json',
    responseSchema: schema,
  })
  return JSON.parse(text) as T
}
