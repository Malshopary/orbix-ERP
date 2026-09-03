/**
 * High-Precision Print Utility
 * Prints any HTML element in an isolated clean iframe to prevent parent layout interference,
 * clipping, or blank page artifacts.
 */

export interface PrintOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

export function printDocumentElement(
  elementOrId: string | HTMLElement,
  options: PrintOptions = {}
): void {
  const { title = 'طباعة مستند', orientation = 'portrait' } = options;

  let sourceElement: HTMLElement | null = null;
  if (typeof elementOrId === 'string') {
    sourceElement = document.getElementById(elementOrId);
  } else {
    sourceElement = elementOrId;
  }

  if (!sourceElement) {
    console.warn(`[printDocumentElement] Element "${elementOrId}" not found. Falling back to window.print()`);
    window.print();
    return;
  }

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'orbix-print-isolated-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  iframe.setAttribute('aria-hidden', 'true');

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Collect all existing stylesheets and style tags
  const styleTags: string[] = [];
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    styleTags.push(node.outerHTML);
  });

  // Clone element content
  const contentHtml = sourceElement.outerHTML;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=Readex+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
      ${styleTags.join('\n')}
      <style>
        @page {
          size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: 8mm;
        }
        *, *::before, *::after {
          box-sizing: border-box !important;
          box-shadow: none !important;
          text-shadow: none !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          width: 100% !important;
          height: auto !important;
          min-height: auto !important;
          font-family: 'IBM Plex Sans Arabic', 'Readex Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        .printable-sheet,
        .printable-page,
        .printable-area,
        .print-portrait,
        .print-landscape {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          transform: none !important;
          display: block !important;
          overflow: visible !important;
        }
        .print\\:hidden,
        .print-hidden,
        .print-hide,
        button {
          display: none !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: auto !important;
        }
        tr {
          page-break-inside: avoid !important;
        }
        th, td {
          border: 1px solid #cbd5e1 !important;
          padding: 4px 6px !important;
        }
        thead th {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
          font-weight: 800 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      </style>
    </head>
    <body>
      <div style="width: 100%; max-width: 100%; margin: 0 auto; padding: 0;">
        ${contentHtml}
      </div>
    </body>
    </html>
  `);
  doc.close();

  // Trigger print after iframe renders styles
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Iframe print error:', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }
  }, 350);
}
