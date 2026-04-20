import { evaluate } from 'mathjs';

/**
 * Safely evaluates a mathematical formula string.
 * Returns the calculated number or null if invalid.
 */
export function safelyEvaluate(formula: string): number | null {
  if (!formula || formula.trim() === '') return 0;
  
  try {
    // Only allow basic arithmetic characters for safety
    if (/[^0-9\s\+\-\*\/\(\)\.]/.test(formula)) {
      return null;
    }
    
    const result = evaluate(formula);
    if (typeof result === 'number' && isFinite(result)) {
      return result;
    }
    return null;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return null;
  }
}

/**
 * Formats a number as currency ($X,XXX)
 * 台幣用 $ 符號表示，無小數
 */
export function formatCurrency(value: number | null): string {
  if (value === null) return '算式錯誤';
  return '$' + new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}
