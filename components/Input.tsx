import React, { useState, useRef, useEffect } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  value,
  placeholder,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(!!value || !!(inputRef.current?.value));
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setHasValue(!!e.target.value);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  const isLabelFloating = isFocused || hasValue || !!placeholder;
  const hasError = !!error;

  const baseClasses = `
    relative w-full
    transition-all duration-300 ease-out
    focus:outline-none
  `;

  const inputClasses = `
    w-full
    ${variant === 'filled' ? 'bg-white/5' : 'bg-transparent'}
    border rounded-xl
    px-4 py-3
    text-white placeholder:text-slate-500
    font-body text-base
    transition-all duration-300 ease-out
    ${leftIcon ? 'pl-11' : ''}
    ${rightIcon ? 'pr-11' : ''}
    ${hasError
      ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
      : 'border-white/10 focus:border-white/30 focus:ring-2 focus:ring-white/10'
    }
    ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
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

      {/* Container input */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          className={inputClasses}
          value={value}
          placeholder={isLabelFloating ? placeholder : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            {rightIcon}
          </div>
        )}

        {/* Error Icon */}
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none z-10">
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

export default Input;

