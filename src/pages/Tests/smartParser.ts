import { QuestionSkill, QuestionType } from '../../types/database';

export interface ParsedQuestion {
  skill: QuestionSkill;
  type: QuestionType;
  question_text: string;
  options?: { text: string; isCorrect: boolean }[];
  explanation?: string;
  points: number;
  image_url?: string;
}

/**
 * AI-POWERED PARSER (Multimodal Gemini)
 * Can handle both raw text OR an image. 
 * If an image is provided, it asks Gemini for question coordinates to auto-crop.
 */
export async function geminiParseQuestions(
  text: string, 
  apiKey: string, 
  imageFile?: File | null
): Promise<ParsedQuestion[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  
  let inlineData: any = null;
  if (imageFile) {
    const base64 = await fileToBase64(imageFile);
    inlineData = {
      mime_type: imageFile.type,
      data: base64.split(',')[1]
    };
  }

  const prompt = `
    Analyze the ${imageFile ? 'image' : 'text'} from an ESL exam.
    Extract all questions and return ONLY a valid JSON array.
    
    Each object in the array MUST follow this format:
    {
      "skill": "reading" | "listening" | "speaking" | "writing" | "general",
      "type": "mcq" | "true_false" | "short_answer" | "essay" | "speaking_prompt",
      "question_text": "string",
      "options": [ { "text": "string", "isCorrect": boolean } ],
      "points": number,
      "explanation": "string"${imageFile ? ',\n      "box_2d": [ymin, xmin, ymax, xmax]' : ''}
    }

    Rules:
    1. Fix OCR/spelling errors.
    2. For MCQ, ensure one option is marked isCorrect: true.
    ${imageFile ? '3. "box_2d" should be the normalized coordinates [0-1000] of ONLY the ILLUSTRATION or IMAGE associated with this question. Do NOT include the question text in the crop area. If there is no image/illustration, omit "box_2d".' : ''}
    
    ${imageFile ? 'IMAGE PROVIDED. ANALYZE THE IMAGE CONTENT.' : `TEXT TO ANALYZE:\n${text}`}
  `;

  const parts: any[] = [{ text: prompt }];
  if (inlineData) parts.push({ inline_data: inlineData });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API Error');
    }

    const data = await response.json();
    let jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```/, '').trim();
    }
    
    const parsed = JSON.parse(jsonStr);

    // If we have bounding boxes and an image, perform AUTO-CROP
    if (imageFile && parsed.length > 0) {
      return await autoCropQuestions(imageFile, parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Gemini Error:', err);
    throw err;
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Automatically crops multiple questions from a single image based on AI coordinates.
 */
async function autoCropQuestions(file: File, questions: any[]): Promise<ParsedQuestion[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const results = questions.map(q => {
        if (!q.box_2d || q.box_2d.length !== 4) return q;

        const [ymin, xmin, ymax, xmax] = q.box_2d;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const w = (xmax - xmin) * img.width / 1000;
        const h = (ymax - ymin) * img.height / 1000;
        const x = xmin * img.width / 1000;
        const y = ymin * img.height / 1000;

        canvas.width = w * 2; // High DPI for printing
        canvas.height = h * 2;
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, x, y, w, h, 0, 0, w * 2, h * 2);
          q.image_url = canvas.toDataURL('image/jpeg', 1.0); // Max quality
        }
        
        delete q.box_2d; // cleanup
        return q;
      });
      URL.revokeObjectURL(img.src);
      resolve(results);
    };
  });
}

/**
 * SUPER SMART PARSER (Local Heuristics Fallback)
 */
export function smartParseQuestions(text: string): ParsedQuestion[] {
  // 1. Pre-processing: Clean noise and normalize line breaks
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\u2013|\u2014/g, '-') // Normalize dashes
    .replace(/[“”]/g, '"')         // Normalize quotes
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n');

  const questions: ParsedQuestion[] = [];
  
  // 2. Identify potential Question Blocks
  // Pattern: Number followed by text, usually ending in ? or :
  // Or just a line followed by options A, B, C...
  const blocks = cleanText.split(/\n(?=\d+[\.\:\)\s]|Question\s*\d+|Q\d+)/i);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length === 0) continue;

    // First line or combined lines until first option is likely the question
    let questionText = '';
    let options: { text: string; isCorrect: boolean }[] = [];
    let foundOption = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect Option patterns (A., B., (a), [1], etc.)
      const optionMatch = line.match(/^([A-Da-d]|[1-4])[\.\)\:\-\s]\s*(.*)/);
      
      if (optionMatch) {
        foundOption = true;
        let optContent = optionMatch[2].trim();
        let isCorrect = false;

        // Smart Correct Answer Detection
        // Check for common markers: *, (x), [correct], bold (simulated)
        if (optContent.match(/(\(x\)|\[v\]|\*|\(correct\)|\[correct\])/i)) {
          isCorrect = true;
          optContent = optContent.replace(/(\(x\)|\[v\]|\*|\(correct\)|\[correct\])/i, '').trim();
        }

        options.push({ text: optContent, isCorrect });
      } else if (!foundOption) {
        // Still in question text
        questionText += (questionText ? ' ' : '') + line;
      } else {
        // Text after options started - could be part of the last option or an explanation
        if (options.length > 0) {
          options[options.length - 1].text += ' ' + line;
        }
      }
    }

    // Clean up question text (remove the numbering if present)
    questionText = questionText.replace(/^(\d+[\.\:\)\s]|Question\s*\d+|Q\d+)\s*/i, '').trim();

    if (questionText) {
      // 3. AI Skill Classification
      const skill = classifySkill(questionText);
      
      // 4. Determine Type
      let type: QuestionType = 'short_answer';
      if (options.length >= 2) {
        type = options.length === 2 && isTrueFalse(options) ? 'true_false' : 'mcq';
      } else if (isSpeakingPrompt(questionText)) {
        type = 'speaking_prompt';
      } else if (isEssay(questionText)) {
        type = 'essay';
      }

      questions.push({
        skill,
        type,
        question_text: questionText,
        options: options.length > 0 ? options : undefined,
        points: 1
      });
    }
  }

  return questions;
}

/**
 * AI-based Skill Classifier
 */
function classifySkill(text: string): QuestionSkill {
  const t = text.toLowerCase();
  if (t.includes('listen') || t.includes('audio') || t.includes('hear')) return 'listening';
  if (t.includes('read') || t.includes('passage') || t.includes('text') || t.includes('paragraph')) return 'reading';
  if (t.includes('speak') || t.includes('describe') || t.includes('talk')) return 'speaking';
  if (t.includes('write') || t.includes('essay') || t.includes('letter')) return 'writing';
  return 'general';
}

function isTrueFalse(opts: any[]): boolean {
  const t1 = opts[0].text.toLowerCase();
  const t2 = opts[1].text.toLowerCase();
  return (t1.includes('true') && t2.includes('false')) || (t1 === 't' && t2 === 'f');
}

function isSpeakingPrompt(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes('describe the picture') || t.includes('talk about') || t.includes('tell me about');
}

function isEssay(text: string): boolean {
  return text.length > 150 || text.toLowerCase().includes('write an essay') || text.toLowerCase().includes('write a letter');
}

/**
 * Extracts text from a local PDF file using PDF.js
 */
export async function readPdfText(file: File): Promise<string> {
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error('Thư viện xử lý PDF chưa được tải. Hãy thử lại sau giây lát.');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(' ') + '\n';
  }
  
  return fullText;
}

/**
 * Extracts text from an image file using OCR (Tesseract.js)
 */
export async function readImageText(file: File): Promise<string> {
  const Tesseract = (window as any).Tesseract;
  if (!Tesseract) throw new Error('Thư viện xử lý ảnh (OCR) chưa được tải. Hãy thử lại sau giây lát.');

  const result = await Tesseract.recognize(file, 'eng');
  return result.data.text || '';
}

/**
 * Attempts to fetch content from a URL and extract text.
 */
export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch URL');
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const scripts = doc.querySelectorAll('script, style, nav, footer, header');
    scripts.forEach(s => s.remove());
    return doc.body.innerText || '';
  } catch (err) {
    console.error(err);
    throw new Error('CORS error: Hãy thử copy văn bản trực tiếp.');
  }
}
