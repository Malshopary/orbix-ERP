import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter' | [number, number];
  margin?: number;
  scale?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Captures an HTML element by ID or Element reference and downloads it as a high-quality PDF.
 */
export async function exportElementToPdf(
  elementOrId: string | HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const {
    filename = 'document.pdf',
    orientation = 'portrait',
    format = 'a4',
    margin = 8,
    scale = 2,
    onStart,
    onComplete,
    onError,
  } = options;

  try {
    if (onStart) onStart();

    const element =
      typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;

    if (!element) {
      throw new Error(`Element ${elementOrId} not found in DOM`);
    }

    // Scroll to top to ensure complete render
    const originalScrollPos = window.scrollY;

    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    window.scrollTo(0, originalScrollPos);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const availableWidth = pageWidth - margin * 2;
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight - margin * 2;

    // Multi-page handling if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight - margin * 2;
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);

    if (onComplete) onComplete();
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    if (onError) onError(error);
    return false;
  }
}
