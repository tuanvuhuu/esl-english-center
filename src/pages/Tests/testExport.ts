import jsPDF from 'jspdf';
import { Test, TestQuestion, TestQuestionOption } from '../../types/database';

interface ExportData {
  test: Test;
  questions: (TestQuestion & { options: TestQuestionOption[] })[];
}

export const exportTestToPdf = async (data: ExportData) => {
  const { test, questions } = data;
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 20;
  let cursorY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ESL ENGLISH CENTER', margin, cursorY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Class: ${test.class?.name || '__________'}`, pageWidth - margin - 40, cursorY);
  
  cursorY += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(test.name.toUpperCase(), pageWidth / 2, cursorY, { align: 'center' });

  cursorY += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Full Name: ___________________________________', margin, cursorY);
  doc.text('Date: ____/____/202__', pageWidth - margin - 40, cursorY);

  cursorY += 10;
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 10;

  // --- QUESTIONS ---
  questions.forEach((q, index) => {
    // Check for page break (estimate block height)
    let blockHeight = 20; // Question text + spacing
    if (q.image_url) blockHeight += 35; // Image space
    if (q.options && q.options.length > 0) blockHeight += Math.ceil(q.options.length / 2) * 8;

    if (cursorY + blockHeight > 275) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const qLabel = `Question ${index + 1}: `;
    doc.text(qLabel, margin, cursorY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const qText = q.question_text;
    const splitText = doc.splitTextToSize(qText, pageWidth - margin * 2 - 25);
    doc.text(splitText, margin + 25, cursorY);
    
    cursorY += (splitText.length * 6) + 4;

    // Image handling (Smaller size to avoid pixelation)
    if (q.image_url) {
      try {
        // Smaller, centered image
        const imgWidth = 45; // Reduced from 60
        const imgHeight = 30; // Reduced from 40
        const imgX = margin + 25;
        doc.addImage(q.image_url, 'JPEG', imgX, cursorY, imgWidth, imgHeight);
        cursorY += imgHeight + 6;
      } catch (e) {
        console.error('PDF Image Error:', e);
      }
    }

    // Options mapping
    if (q.options && q.options.length > 0) {
      doc.setFontSize(10);
      q.options.forEach((opt, optIdx) => {
        const label = String.fromCharCode(65 + optIdx) + '. ';
        const xPos = margin + 25 + (optIdx % 2 === 1 ? 75 : 0);
        const yPos = cursorY + (Math.floor(optIdx / 2) * 8);
        // Fix: Use option_text instead of text
        const text = (opt as any).option_text || (opt as any).text || '';
        doc.text(label + text, xPos, yPos);
      });
      cursorY += (Math.ceil(q.options.length / 2) * 8) + 10;
    } else {
      cursorY += 12; // Space for short answers
    }

    cursorY += 2; // Extra gap between questions
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth / 2, 287, { align: 'center' });

  doc.save(`${test.name.replace(/\s+/g, '_')}_Test.pdf`);
};
