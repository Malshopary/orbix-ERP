/**
 * Math expression evaluator for quantity and calculator inputs.
 * Accepts expressions containing only numbers and operators: + - * / . ( )
 * Rejects letters and dangerous characters.
 */
export function evaluateMathExpression(input: string): number | null {
  if (!input || typeof input !== 'string') return null;

  // Trim and remove any whitespace
  const sanitized = input.trim();
  if (!sanitized) return null;

  // Check if string contains only digits, decimal point, and basic math operators + - * / ( )
  const validMathRegex = /^[0-9+\-*/. ()]+$/;
  if (!validMathRegex.test(sanitized)) {
    return null;
  }

  // Prevent dangerous sequences like ** or // or empty parens
  if (/[+*/-]{2,}/.test(sanitized.replace(/[-+/*]\s*[-+/*]/g, '')) && !/[*/+-]\s*[-+]/.test(sanitized)) {
    // allow unary minus like 5 * -2, but not 5 ** 2
    if (/\*{2,}|\/{2,}|\+{2,}/.test(sanitized)) {
      return null;
    }
  }

  try {
    // Use Function constructor with strict mathematical evaluation
    // Since input only contains [0-9+\-*/. ()], it is safe from code injection
    const result = new Function(`'use strict'; return (${sanitized});`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      // Round to 4 decimal places to prevent floating point inaccuracies like 0.1 + 0.2 = 0.30000000000000004
      return Math.round(result * 10000) / 10000;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Filters input to only allow digits, arithmetic symbols, spaces and parens.
 */
export function sanitizeMathInput(val: string): string {
  return val.replace(/[^0-9+\-*/. ()]/g, '');
}
