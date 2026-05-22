import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Modal, Button, Icon } from '../../../components';
import { smartParseQuestions, geminiParseQuestions, fetchUrlContent, readPdfText, readImageText, ParsedQuestion } from '../smartParser';

interface ImportQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (questions: ParsedQuestion[]) => void;
}

export const ImportQuestionModal: React.FC<ImportQuestionModalProps> = ({
  open,
  onClose,
  onImport
}) => {
  const [sourceType, setSourceType] = useState<'text' | 'link' | 'pdf' | 'image' | 'excel'>('text');
  const [useAI, setUseAI] = useState(true);
  const [geminiKey, setGeminiKey] = useState(
    localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || ''
  );
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedQuestion[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    try {
      if (sourceType === 'excel' && selectedFile) {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          throw new Error('File Excel rỗng hoặc không đúng định dạng.');
        }

        const results: ParsedQuestion[] = jsonData.map((row, index) => {
          const qText = row.question_text || row.Question || row.question || '';
          if (!qText) {
            throw new Error(`Dòng ${index + 2}: Thiếu nội dung câu hỏi (cột 'question_text').`);
          }

          const qType = String(row.type || 'mcq').toLowerCase().trim();
          const qSkill = String(row.skill || 'general').toLowerCase().trim();
          const qPoints = Number(row.points || row.score || 1);
          const qExpl = row.explanation || '';

          // Parse options
          const options: { text: string; isCorrect: boolean }[] = [];
          if (qType === 'mcq' || qType === 'true_false') {
            const optA = String(row.option_a || row.A || row.optionA || '').trim();
            const optB = String(row.option_b || row.B || row.optionB || '').trim();
            const optC = String(row.option_c || row.C || row.optionC || '').trim();
            const optD = String(row.option_d || row.D || row.optionD || '').trim();
            const correctVal = String(row.correct || row.correct_answer || row.Answer || '').trim().toUpperCase();

            const addOption = (text: string, code: string) => {
              if (text) {
                const isCorrect = correctVal === code || correctVal === text.toUpperCase() || (code === 'T' && correctVal === 'TRUE') || (code === 'F' && correctVal === 'FALSE');
                options.push({ text, isCorrect });
              }
            };

            if (qType === 'true_false') {
              addOption(optA || 'True', 'T');
              addOption(optB || 'False', 'F');
            } else {
              if (optA) addOption(optA, 'A');
              if (optB) addOption(optB, 'B');
              if (optC) addOption(optC, 'C');
              if (optD) addOption(optD, 'D');
            }
          }

          return {
            skill: qSkill as any,
            type: qType as any,
            question_text: qText,
            points: qPoints,
            explanation: qExpl,
            options: options.length > 0 ? options : undefined
          };
        });

        if (results.length === 0) {
          setError('Không tìm thấy câu hỏi nào. Hãy kiểm tra lại định dạng file.');
        } else {
          setPreview(results);
        }
        setProcessing(false);
        return;
      }

      let text = '';
      if (sourceType === 'text') {
        text = inputValue;
      } else if (sourceType === 'link') {
        text = await fetchUrlContent(inputValue);
      } else if (sourceType === 'pdf' && selectedFile) {
        text = await readPdfText(selectedFile);
      } else if (sourceType === 'image' && selectedFile) {
        text = await readImageText(selectedFile);
      }

      if (!text.trim()) {
        throw new Error('Không có nội dung để phân tích.');
      }
      
      let results: ParsedQuestion[] = [];
      if (useAI && geminiKey) {
        localStorage.setItem('gemini_api_key', geminiKey);
        const imgFile = sourceType === 'image' ? selectedFile : null;
        results = await geminiParseQuestions(text, geminiKey, imgFile);
      } else {
        results = smartParseQuestions(text);
      }

      if (results.length === 0) {
        setError('Không tìm thấy câu hỏi nào. Hãy kiểm tra lại định dạng văn bản.');
      } else {
        setPreview(results);
      }
      setProcessing(false);
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    onImport(preview);
    onClose();
    setPreview([]);
    setInputValue('');
    setSelectedFile(null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nhập đề thông minh & File Import"
      width={700}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {preview.length === 0 ? (
          <>
            <div style={{ 
              padding: 12, borderRadius: 8, background: 'var(--info-light)', 
              color: 'var(--info-dark)', fontSize: 13, display: 'flex', gap: 10, alignItems: 'center'
            }}>
              <Icon name="zap" size={16} />
              <span>Nhập đề hàng loạt từ file Excel/CSV hoặc bóc tách từ Văn bản, PDF, Ảnh bằng AI.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button 
                  variant={sourceType === 'text' ? 'primary' : 'outline'} 
                  onClick={() => { setSourceType('text'); setSelectedFile(null); }}
                  size="sm"
                >
                  Dán văn bản
                </Button>
                <Button 
                  variant={sourceType === 'pdf' ? 'primary' : 'outline'} 
                  onClick={() => { setSourceType('pdf'); setSelectedFile(null); }}
                  size="sm"
                >
                  File PDF
                </Button>
                <Button 
                  variant={sourceType === 'image' ? 'primary' : 'outline'} 
                  onClick={() => { setSourceType('image'); setSelectedFile(null); }}
                  size="sm"
                >
                  Ảnh / Chụp
                </Button>
                <Button 
                  variant={sourceType === 'excel' ? 'primary' : 'outline'} 
                  onClick={() => { setSourceType('excel'); setSelectedFile(null); }}
                  size="sm"
                >
                  Excel / CSV
                </Button>
                <Button 
                  variant={sourceType === 'link' ? 'primary' : 'outline'} 
                  onClick={() => { setSourceType('link'); setSelectedFile(null); }}
                  size="sm"
                >
                  Nhập từ Link
                </Button>
              </div>

              {sourceType !== 'excel' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} style={{ cursor: 'pointer' }} />
                    AI Mode
                  </label>
                </div>
              )}
            </div>

            {useAI && sourceType !== 'excel' && (
              <div style={{ 
                padding: '8px 12px', borderRadius: 8, background: 'var(--card-bg)', 
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10
              }}>
                <Icon name="key" size={14} style={{ color: 'var(--primary)' }} />
                <input 
                  type="password" 
                  value={geminiKey} 
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="Nhập Gemini API Key để xử lý chính xác 100%..."
                  style={{ 
                    flex: 1, background: 'transparent', border: 'none', 
                    color: 'var(--text-1)', fontSize: 12, outline: 'none' 
                  }}
                />
                <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Saved</div>
              </div>
            )}

            {sourceType === 'excel' && (
              <div style={{ 
                fontSize: 12, color: 'var(--text-3)', padding: 12, 
                background: 'var(--hover-bg)', borderRadius: 8, border: '1px solid var(--border)' 
              }}>
                <strong style={{ color: 'var(--text-1)' }}>Cấu trúc cột file Excel / CSV:</strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li><code>question_text</code>: Nội dung câu hỏi (Bắt buộc)</li>
                  <li><code>type</code>: Loại câu hỏi (mcq, true_false, fill_blank, short_answer, essay)</li>
                  <li><code>skill</code>: Kỹ năng (reading, listening, speaking, writing, general)</li>
                  <li><code>option_a</code>, <code>option_b</code>, <code>option_c</code>, <code>option_d</code>: Các phương án trắc nghiệm</li>
                  <li><code>correct</code>: Đáp án đúng (Ví dụ: A, B, C, D hoặc True, False)</li>
                  <li><code>points</code>: Điểm số (Mặc định 1)</li>
                  <li><code>explanation</code>: Giải thích đáp án</li>
                </ul>
              </div>
            )}

            {sourceType === 'text' ? (
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Dán nội dung đề thi tại đây..."
                style={{
                  width: '100%', height: 200, padding: 12, borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  color: 'var(--text-1)', fontSize: 13, fontFamily: 'monospace',
                  resize: 'none', outline: 'none'
                }}
              />
            ) : (sourceType === 'pdf' || sourceType === 'image' || sourceType === 'excel') ? (
              <div style={{
                height: 200, border: '2px dashed var(--border)', borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 12, background: 'var(--hover-bg)', position: 'relative'
              }}>
                <Icon name={sourceType === 'pdf' ? "file-text" : sourceType === 'excel' ? "list" : "image"} size={40} style={{ color: 'var(--text-4)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>
                    {selectedFile ? selectedFile.name : `Chọn file ${sourceType.toUpperCase()} từ máy tính`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-4)' }}>
                    {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : `Hỗ trợ ${sourceType === 'pdf' ? '.pdf' : sourceType === 'excel' ? '.xlsx, .xls, .csv' : '.jpg, .png, .webp'}`}
                  </div>
                </div>
                <input
                  type="file"
                  accept={sourceType === 'pdf' ? '.pdf' : sourceType === 'excel' ? '.xlsx,.xls,.csv' : 'image/*'}
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer'
                  }}
                />
                {selectedFile && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                    Xóa file
                  </Button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="https://example.com/test-page"
                    style={{
                      width: '100%', height: 36, padding: '0 12px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--card)',
                      color: 'var(--text-1)', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {error && <div style={{ color: '#ef4444', fontSize: 12, fontWeight: 500 }}>{error}</div>}

            <Button 
              onClick={handleProcess} 
              loading={processing}
              disabled={
                (sourceType === 'text' || sourceType === 'link') ? !inputValue.trim() : !selectedFile
              }
              style={{ height: 40, fontWeight: 700, alignSelf: 'center', minWidth: 200 }}
            >
              {processing ? 'Đang phân tích...' : sourceType === 'excel' ? 'Nhập câu hỏi từ file' : 'Bắt đầu phân tích bằng AI'}
            </Button>
          </>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                Kết quả phân tích ({preview.length} câu hỏi)
              </div>
              <Button variant="outline" size="sm" onClick={() => setPreview([])}>Làm lại</Button>
            </div>

            <div style={{ 
              maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
              padding: '4px', marginBottom: 16
            }}>
              {preview.map((q, i) => (
                <div key={i} style={{ 
                  padding: 12, borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--hover-bg)'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                    CÂU {i + 1} ({q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'true_false' ? 'Đúng/Sai' : 'Tự luận'})
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                    {q.question_text}
                  </div>
                  {q.image_url && (
                    <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={q.image_url} alt="Cropped" style={{ width: '100%', maxHeight: 150, objectFit: 'contain', background: '#fff' }} />
                    </div>
                  )}
                  {q.options && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ 
                          fontSize: 12, color: opt.isCorrect ? 'var(--primary)' : 'var(--text-3)',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}>
                          <div style={{ 
                            width: 6, height: 6, borderRadius: '50%', 
                            background: opt.isCorrect ? 'var(--primary)' : 'var(--border)' 
                          }} />
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={handleConfirm} style={{ height: 40, fontWeight: 700, alignSelf: 'center', minWidth: 200 }}>
              Xác nhận thêm {preview.length} câu hỏi vào đề
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
