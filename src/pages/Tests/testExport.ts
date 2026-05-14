import jsPDF from 'jspdf';
import { Test, TestQuestion, TestQuestionOption } from '../../types/database';

interface ExportData {
  test: Test;
  questions: (TestQuestion & { options: TestQuestionOption[] })[];
}

const buildPdfDoc = (data: ExportData): jsPDF => {
  const { test, questions } = data;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const margin = 20;
  let cursorY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

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

  questions.forEach((q, index) => {
    let blockHeight = 20;
    if (q.image_url) blockHeight += 35;
    if (q.options && q.options.length > 0) blockHeight += Math.ceil(q.options.length / 2) * 8;

    if (cursorY + blockHeight > 275) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Question ${index + 1}: `, margin, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(q.question_text, pageWidth - margin * 2 - 25);
    doc.text(splitText, margin + 25, cursorY);
    cursorY += (splitText.length * 6) + 4;

    if (q.image_url) {
      try {
        doc.addImage(q.image_url, 'JPEG', margin + 25, cursorY, 45, 30);
        cursorY += 36;
      } catch (e) {
        console.error('PDF Image Error:', e);
      }
    }

    if (q.options && q.options.length > 0) {
      doc.setFontSize(10);
      q.options.forEach((opt, optIdx) => {
        const label = String.fromCharCode(65 + optIdx) + '. ';
        const xPos = margin + 25 + (optIdx % 2 === 1 ? 75 : 0);
        const yPos = cursorY + (Math.floor(optIdx / 2) * 8);
        const text = (opt as any).option_text || (opt as any).text || '';
        doc.text(label + text, xPos, yPos);
      });
      cursorY += (Math.ceil(q.options.length / 2) * 8) + 10;
    } else {
      cursorY += 12;
    }

    cursorY += 2;
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth / 2, 287, { align: 'center' });

  return doc;
};

export const exportTestToPdf = async (data: ExportData): Promise<void> => {
  const doc = buildPdfDoc(data);
  doc.save(`${data.test.name.replace(/\s+/g, '_')}_Test.pdf`);
};

export const generateTestPdfBlobUrl = async (data: ExportData): Promise<string> => {
  const doc = buildPdfDoc(data);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
