import { supabase } from '../lib/supabase'
import type { DbVocabularyEntry } from '../types/database'

export interface VocabularyFilters {
  cefr_level?: string
  topic?: string
  search?: string
  limit?: number
}

export async function getVocabulary(filters?: VocabularyFilters): Promise<DbVocabularyEntry[]> {
  let q = supabase
    .from('vocabulary_bank')
    .select('*')
    .order('word', { ascending: true })

  if (filters?.cefr_level) {
    q = q.eq('cefr_level', filters.cefr_level)
  }
  if (filters?.topic) {
    q = q.eq('topic', filters.topic)
  }
  if (filters?.search) {
    q = q.ilike('word', `%${filters.search}%`)
  }
  if (filters?.limit) {
    q = q.limit(filters.limit)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as DbVocabularyEntry[]
}

export async function insertVocabulary(
  entries: Partial<DbVocabularyEntry>[]
): Promise<DbVocabularyEntry[]> {
  const { data, error } = await supabase
    .from('vocabulary_bank')
    .upsert(entries, { onConflict: 'word' })
    .select('*')

  if (error) throw error
  return data as DbVocabularyEntry[]
}

export async function deleteVocabulary(id: string): Promise<void> {
  const { error } = await supabase
    .from('vocabulary_bank')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Fetches phonetic IPA transcription and audio URL from Free Dictionary API.
 */
export async function fetchDictionaryDetails(word: string): Promise<{
  phonetic: string | null
  audio_url: string | null
}> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim().toLowerCase())}`)
    if (!response.ok) {
      return { phonetic: null, audio_url: null }
    }
    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) {
      return { phonetic: null, audio_url: null }
    }

    const entry = data[0]
    const phoneticText = entry.phonetic || 
      (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text) || 
      null

    const audioUrl = (entry.phonetics && entry.phonetics.find((p: any) => p.audio)?.audio) || 
      null

    return {
      phonetic: phoneticText,
      audio_url: audioUrl,
    }
  } catch (err) {
    console.error(`Failed to fetch details for word "${word}":`, err)
    return { phonetic: null, audio_url: null }
  }
}
