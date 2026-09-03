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

  let originalTransform = '';
  let targetElement: HTMLElement | null = null;

  try {
    if (onStart) onStart();

    targetElement =
      typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;

    if (!targetElement) {
      throw new Error(`Element "${elementOrId}" not found in DOM`);
    }

    // Save and temporarily remove zoom transform from original element
    originalTransform = targetElement.style.transform;
    targetElement.style.transform = 'none';

    // Capture using html2canvas with optimized options
    const canvas = await html2canvas(targetElement, {
      scale: Math.max(1.5, Math.min(scale, 2.5)),
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: targetElement.scrollWidth,
      windowHeight: targetElement.scrollHeight,
      onclone: (_clonedDoc, clonedElement) => {
        clonedElement.style.transform = 'none';
        clonedElement.style.boxShadow = 'none';
        clonedElement.style.margin = '0 auto';
      },
    });

    // Restore original transform
    if (targetElement) {
      targetElement.style.transform = originalTransform;
    }

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Initialize jsPDF
    const pdf = new jsPDF({
      orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: format,
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const availableWidth = pageWidth - margin * 2;
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(
      imgData,
      'JPEG',
      margin,
      position,
      imgWidth,
      imgHeight,
      undefined,
      'FAST'
    );
    heightLeft -= pageHeight - margin * 2;

    // Multi-page handling if content exceeds single page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(
        imgData,
        'JPEG',
        margin,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      heightLeft -= pageHeight - margin * 2;
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);

    if (onComplete) onComplete();
    return true;
  } catch (error) {
    // Restore transform in case of error
    if (targetElement && originalTransform !== undefined) {
      targetElement.style.transform = originalTransform;
    }

    console.error('PDF export error:', error);
    if (onError) onError(error);
    throw error;
  }
}
