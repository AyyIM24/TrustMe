import { jsPDF } from 'jspdf';

export const exportToPDF = (data) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color Palette
  const darkBlue = '#080C14';
  const surfaceBlue = '#0E1526';
  const cyan = '#00D4FF';
  const green = '#00FF88';
  const red = '#FF2D55';
  const textWhite = '#E8EDF5';
  const mutedText = '#8A99AD';

  // --- Title Header Block ---
  doc.setFillColor(14, 21, 38); // surfaceBlue
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // App Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 212, 255); // cyan
  doc.text('FakeShield Analysis Report', 15, 20);

  // Subtitle / Date
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(138, 153, 173); // mutedText
  const dateStr = new Date(data.created_at || Date.now()).toLocaleString();
  doc.text(`Generated on: ${dateStr} | Secure Verification System`, 15, 28);
  doc.text(`Model Version: ${data.model_version || 'v1.0-Fast'}`, 15, 33);

  // Decorative header line
  doc.setDrawColor(26, 37, 64);
  doc.setLineWidth(0.5);
  doc.line(15, 38, pageWidth - 15, 38);

  // --- Article Metadata Section ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(14, 21, 38); // Dark for body titles
  doc.text('Scanned Content Metadata', 15, 58);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Title:', 15, 66);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const titleText = data.title || 'Untitled Claim Scan';
  const splitTitle = doc.splitTextToSize(titleText, pageWidth - 45);
  doc.text(splitTitle, 35, 66);
  
  const titleHeight = splitTitle.length * 4.5;
  let nextY = 66 + titleHeight + 2;

  if (data.source_url) {
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Source URL:', 15, nextY);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(0, 136, 204); // URL blue
    const splitUrl = doc.splitTextToSize(data.source_url, pageWidth - 45);
    doc.text(splitUrl, 35, nextY);
    nextY += (splitUrl.length * 4.5) + 4;
  } else {
    nextY += 2;
  }

  // --- Verdict Box Section ---
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(220, 224, 230);
  doc.rect(15, nextY, pageWidth - 30, 24, 'FD');

  // Verdict Left Border Indicator
  const isFake = data.prediction === 'fake';
  doc.setFillColor(isFake ? 255 : 0, isFake ? 45 : 255, isFake ? 85 : 136); // Red vs Green
  doc.rect(15, nextY, 3, 24, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('SYSTEM VERDICT', 23, nextY + 7);

  doc.setFontSize(15);
  doc.setTextColor(isFake ? 220 : 0, isFake ? 20 : 150, isFake ? 60 : 70);
  doc.text(isFake ? 'Lately Identified as FAKE / UNVERIFIED' : 'Verified as REAL / TRUSTWORTHY', 23, nextY + 16);

  // Confidence & Credibility Badge
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Confidence Rate: ${data.confidence}%`, 130, nextY + 7);
  doc.text(`Credibility Score: ${data.credibility_score}/100`, 130, nextY + 16);

  nextY += 34;

  // --- Credibility Signals Grid ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(14, 21, 38);
  doc.text('Biometric & Credibility Indicators', 15, nextY);

  nextY += 8;

  if (data.credibility_signals && data.credibility_signals.length > 0) {
    data.credibility_signals.forEach((signal) => {
      // Background row outline
      doc.setFillColor(250, 251, 253);
      doc.rect(15, nextY - 4, pageWidth - 30, 10, 'F');
      doc.setDrawColor(235, 238, 242);
      doc.line(15, nextY + 6, pageWidth - 15, nextY + 6);

      // Signal Info
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      doc.text(signal.name, 18, nextY + 2);

      // Score Bar background
      doc.setFillColor(220, 224, 230);
      doc.rect(75, nextY - 1, 40, 3, 'F');

      // Score Bar Fill
      doc.setFillColor(signal.score >= 75 ? 0 : signal.score >= 50 ? 255 : 255, signal.score >= 75 ? 200 : signal.score >= 50 ? 179 : 45, signal.score >= 75 ? 100 : signal.score >= 50 ? 0 : 85);
      doc.rect(75, nextY - 1, (signal.score / 100) * 40, 3, 'F');

      // Score Text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`${signal.score}%`, 118, nextY + 2);

      // Detail snippet
      const detailStr = signal.detail.length > 55 ? signal.detail.substring(0, 52) + '...' : signal.detail;
      doc.text(detailStr, 132, nextY + 2);

      nextY += 12;
    });
  } else {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('No separate credibility indicators cataloged for this scan.', 18, nextY);
    nextY += 10;
  }

  // Check page boundaries before adding explainability
  if (nextY > pageHeight - 50) {
    doc.addPage();
    nextY = 25;
  }

  // --- ML Explanations & Contributing Words ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(14, 21, 38);
  doc.text('Key Text Features Contributing to Verdict', 15, nextY);

  nextY += 8;

  if (data.explanations && data.explanations.length > 0) {
    data.explanations.forEach((ex) => {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(`"${ex.word}"`, 20, nextY);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      const isReal = ex.direction === 'real';
      doc.setTextColor(isReal ? 0 : 200, isReal ? 120 : 20, isReal ? 80 : 60);
      doc.text(`Weight: ${ex.contribution > 0 ? '+' : ''}${ex.contribution} (${isReal ? 'Supports Real' : 'Supports Fake'})`, 70, nextY);

      nextY += 7;
    });
  } else {
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Explainability coefficients not mapped for this entry.', 20, nextY);
    nextY += 10;
  }

  // Footer page label
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('FakeShield Security Audit - Encrypted Biometric Document Output', 15, pageHeight - 10);
  doc.text(`Page 1 of 1`, pageWidth - 30, pageHeight - 10);

  // Save the PDF
  const filename = `fakeshield_report_${data.id || Date.now()}.pdf`;
  doc.save(filename);
};
