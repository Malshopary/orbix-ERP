/**
 * Safely evaluates simple mathematical expressions in quantity / numerical input fields
 * Supports: +, -, *, /, %, parenthesis, decimals
 * Prevents non-math character typing
 */

export const sanitizeMathInput = (input: string): string => {
  // Allow only digits, basic operators +, -, *, /, %, dots, parenthesis, spaces
  return input.replace(/[^0-9+\-*/().%\s]/g, '');
};

export const isValidMathCharacter = (char: string): boolean => {
  return /^[0-9+\-*/().%\s]$/.test(char);
};

export const evaluateMathExpression = (expression: string, fallback: number = 1): number => {
  if (!expression || typeof expression !== 'string') return fallback;

  const sanitized = sanitizeMathInput(expression.trim());
  if (!sanitized) return fallback;

  // If already a plain number
  if (/^-?\d+(\.\d+)?$/.test(sanitized)) {
    const num = parseFloat(sanitized);
    return isNaN(num) || num <= 0 ? fallback : num;
  }

  try {
    // Safe evaluation using Function with strictly sanitized arithmetic tokens
    // sanitized contains only digits and operators: + - * / ( ) . % \s
    const safeExpr = sanitized.replace(/%/g, '/100');
    // Double verify that only math tokens are present before evaluation
    if (!/^[\d+\-*/().\s]+$/.test(safeExpr)) {
      return fallback;
    }

    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${safeExpr});`)();
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      // Round to 4 decimal places max to avoid floating point anomalies like 0.30000000000000004
      const rounded = Math.round(result * 10000) / 10000;
      return rounded > 0 ? rounded : fallback;
    }
    return fallback;
  } catch (err) {
    return fallback;
  }
};
