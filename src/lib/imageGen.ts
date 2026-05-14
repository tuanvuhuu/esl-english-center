/**
 * Generate AI image URL từ prompt — dùng Pollinations.ai (free, no API key).
 * Mỗi prompt + seed → ảnh ổn định (không random). Cùng seed = cùng ảnh.
 */
export const generateImageUrl = (
  prompt: string,
  opts: { width?: number; height?: number; seed?: number } = {}
): string => {
  const { width = 512, height = 384, seed } = opts
  const cleanPrompt = prompt.trim().replace(/\s+/g, ' ')
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    nologo: 'true',
    enhance: 'true',
    safe: 'true',
  })
  if (seed != null) params.set('seed', String(seed))
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?${params}`
}

/**
 * Generate seed cố định từ string — cùng câu hỏi → cùng ảnh, không bị đổi mỗi lần render.
 */
export const stableSeed = (text: string): number => {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h) + text.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h) % 100000
}

/**
 * Extract image prompt từ câu hỏi — đoán chủ đề cần ảnh.
 * Ưu tiên: imageSuggestion từ AI > extract noun từ question_text.
 */
export const buildImagePrompt = (
  questionText: string,
  imageSuggestion?: string | null
): string => {
  if (imageSuggestion && imageSuggestion.trim()) {
    return `${imageSuggestion.trim()}, cartoon style, colorful, for kids, clean background`
  }
  // Fallback: trích chủ đề từ question text
  const cleaned = questionText
    .replace(/[?!.,;:]/g, '')
    .replace(/^(read:|listen:|look at|describe|what|where|when|how|why|which|who|the)\b/gi, '')
    .trim()
  return `${cleaned.slice(0, 60)}, cartoon style, colorful, for kids`
}
