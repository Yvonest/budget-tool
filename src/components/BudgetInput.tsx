import React from 'react';
import { safelyEvaluate, formatCurrency } from '../utils/math';

interface BudgetInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  resultClassName?: string;
}

export const BudgetInput: React.FC<BudgetInputProps> = ({
  value,
  onChange,
  placeholder = '預抓費用',
  className = '',
  resultClassName = '',
}) => {
  const result = safelyEvaluate(value);

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`formula-input ${className}`}
      />
      <span 
        className={`min-w-[75px] text-right font-round text-xs whitespace-nowrap font-semibold ${
          result === null 
            ? 'text-overspent' 
            : value 
              ? 'text-main-text/80' 
              : 'text-main-text/25'
        } ${resultClassName}`}
      >
        {result === null ? '算式錯誤' : formatCurrency(result)}
      </span>
    </div>
  );
};
