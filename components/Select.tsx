import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  leftIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder = 'Sélectionner...',
  leftIcon,
  variant = 'default',
  className = '',
  value,
  onFocus,
  onBlur,
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);
  const hasValue = !!value && value !== '';

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(false);
    setIsOpen(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e);
  };

  const isLabelFloating = isFocused || hasValue;
  const hasError = !!error;
  const selectedOption = options.find(opt => opt.value === value);

  const baseClasses = `
    relative w-full
    transition-all duration-300 ease-out
    focus:outline-none
  `;

  const selectClasses = `
    w-full
    ${variant === 'filled' ? 'bg-white/5' : 'bg-transparent'}
    border rounded-xl
    px-4 py-3
    text-white
    font-body text-base
    appearance-none
    cursor-pointer
    transition-all duration-300 ease-out
    ${leftIcon ? 'pl-11' : ''}
    pr-10
    ${hasError
      ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
      : 'border-white/10 focus:border-white/30 focus:ring-2 focus:ring-white/10'
    }
    ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${!hasValue ? 'text-slate-500' : 'text-white'}
  `;

  const labelClasses = `
    absolute left-4
    font-body text-sm font-medium
    pointer-events-none
    transition-all duration-300 ease-out
    ${isLabelFloating
      ? 'top-2 text-xs text-slate-400'
      : 'top-1/2 -translate-y-1/2 text-base text-slate-400'
    }
    ${hasError ? 'text-red-400' : ''}
    ${isFocused ? 'text-white' : ''}
  `;

  return (
    <div className={`${baseClasses} ${className}`}>
      {/* Label flottant */}
      {label && (
        <label
          htmlFor={props.id}
          className={labelClasses}
          style={{
            transform: isLabelFloating
              ? 'translateY(0) scale(0.85)'
              : 'translateY(-50%) scale(1)',
            transformOrigin: 'left top',
          }}
        >
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Container select */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}

        {/* Select */}
        <select
          ref={selectRef}
          className={selectClasses}
          value={value || ''}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        >
          {!hasValue && placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="bg-slate-900 text-white"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown Arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 transition-transform duration-300">
          <svg
            className={`w-5 h-5 ${isFocused ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Error Icon */}
        {hasError && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none z-10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}

        {/* Focus indicator */}
        {isFocused && !hasError && (
          <div className="absolute inset-0 rounded-xl pointer-events-none animate-pulse">
            <div className="absolute inset-0 rounded-xl border-2 border-white/20 opacity-50" />
          </div>
        )}
      </div>

      {/* Helper text / Error message */}
      {(helperText || error) && (
        <div
          className={`mt-2 text-sm transition-all duration-300 ${
            hasError ? 'text-red-400' : 'text-slate-400'
          } ${isFocused || hasError ? 'opacity-100' : 'opacity-0'}`}
        >
          {error || helperText}
        </div>
      )}
    </div>
  );
};

export default Select;

