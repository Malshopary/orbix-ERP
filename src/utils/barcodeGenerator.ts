// A robust, zero-dependency Code128 and numeric 1D Barcode SVG renderer
// Ensures the application runs seamlessly everywhere without module resolution errors.

const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export interface BarcodeRenderOptions {
  format?: 'CODE128' | 'EAN13';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
}

/**
 * Encodes text into Code128 pattern string of module widths (alternating bar / space)
 */
export function encodeCode128(text: string): string[] {
  const codes: number[] = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // ASCII 32 to 126
    const code = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(code);
    checksum += code * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(STOP_CODE);

  return codes.map((c) => CODE128_PATTERNS[c] || CODE128_PATTERNS[0]);
}

/**
 * Renders a standard Code128 barcode directly into an SVG element
 */
export function renderBarcodeSvg(
  svgElement: SVGSVGElement | null,
  text: string,
  options: BarcodeRenderOptions = {}
): void {
  if (!svgElement) return;

  const validText = (text || '12345678').trim();
  const widthMultiplier = options.width || 2;
  const barHeight = options.height || 45;
  const displayValue = options.displayValue !== false;
  const fontSize = options.fontSize || 12;
  const margin = options.margin ?? 6;
  const lineColor = options.lineColor || '#000000';
  const background = options.background || '#ffffff';

  const patterns = encodeCode128(validText);

  // Calculate total modules
  let totalModules = 0;
  for (const pattern of patterns) {
    for (let j = 0; j < pattern.length; j++) {
      totalModules += parseInt(pattern[j], 10);
    }
  }

  const svgWidth = totalModules * widthMultiplier + margin * 2;
  const svgHeight = barHeight + (displayValue ? fontSize + 8 : 0) + margin * 2;

  // Clear previous SVG content
  while (svgElement.firstChild) {
    svgElement.removeChild(svgElement.firstChild);
  }

  svgElement.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svgElement.setAttribute('width', `${svgWidth}`);
  svgElement.setAttribute('height', `${svgHeight}`);
  svgElement.style.maxWidth = '100%';
  svgElement.style.height = 'auto';

  // Background rect
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', `${svgWidth}`);
  bgRect.setAttribute('height', `${svgHeight}`);
  bgRect.setAttribute('fill', background);
  svgElement.appendChild(bgRect);

  // Draw Bars
  let currentX = margin;
  for (const pattern of patterns) {
    for (let j = 0; j < pattern.length; j++) {
      const modWidth = parseInt(pattern[j], 10) * widthMultiplier;
      const isBar = j % 2 === 0;

      if (isBar) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', `${currentX}`);
        rect.setAttribute('y', `${margin}`);
        rect.setAttribute('width', `${modWidth}`);
        rect.setAttribute('height', `${barHeight}`);
        rect.setAttribute('fill', lineColor);
        svgElement.appendChild(rect);
      }
      currentX += modWidth;
    }
  }

  // Draw Text below barcode
  if (displayValue) {
    const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElem.setAttribute('x', `${svgWidth / 2}`);
    textElem.setAttribute('y', `${margin + barHeight + fontSize + 2}`);
    textElem.setAttribute('text-anchor', 'middle');
    textElem.setAttribute('font-family', 'monospace, monospace');
    textElem.setAttribute('font-size', `${fontSize}`);
    textElem.setAttribute('font-weight', 'bold');
    textElem.setAttribute('fill', lineColor);
    textElem.textContent = validText;
    svgElement.appendChild(textElem);
  }
}

/**
 * Generates an SVG string representation of a barcode for direct embedding / printing
 */
export function generateBarcodeSvgString(
  text: string,
  options: BarcodeRenderOptions = {}
): string {
  const validText = (text || '12345678').trim();
  const widthMultiplier = options.width || 1.8;
  const barHeight = options.height || 40;
  const displayValue = options.displayValue !== false;
  const fontSize = options.fontSize || 11;
  const margin = options.margin ?? 4;
  const lineColor = options.lineColor || '#000000';
  const background = options.background || '#ffffff';

  const patterns = encodeCode128(validText);

  let totalModules = 0;
  for (const pattern of patterns) {
    for (let j = 0; j < pattern.length; j++) {
      totalModules += parseInt(pattern[j], 10);
    }
  }

  const svgWidth = totalModules * widthMultiplier + margin * 2;
  const svgHeight = barHeight + (displayValue ? fontSize + 6 : 0) + margin * 2;

  let rectsSvg = `<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${background}" />`;
  let currentX = margin;

  for (const pattern of patterns) {
    for (let j = 0; j < pattern.length; j++) {
      const modWidth = parseInt(pattern[j], 10) * widthMultiplier;
      const isBar = j % 2 === 0;

      if (isBar) {
        rectsSvg += `<rect x="${currentX.toFixed(2)}" y="${margin}" width="${modWidth.toFixed(2)}" height="${barHeight}" fill="${lineColor}" />`;
      }
      currentX += modWidth;
    }
  }

  let textSvg = '';
  if (displayValue) {
    textSvg = `<text x="${(svgWidth / 2).toFixed(2)}" y="${(margin + barHeight + fontSize + 2).toFixed(2)}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" font-weight="bold" fill="${lineColor}">${validText}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">${rectsSvg}${textSvg}</svg>`;
}
