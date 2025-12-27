import React, { useState, useRef, useEffect } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled';
  autoResize?: boolean;
  maxRows?: number;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  autoResize = false,
  maxRows = 10,
  className = '',
  value,
  placeholder,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setHasValue(!!value || !!(textareaRef.current?.value));
  }, [value]);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const maxHeight = lineHeight * maxRows;
      const scrollHeight = textarea.scrollHeight;
      
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [value, autoResize, maxRows]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    setHasValue(!!e.target.value);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const textareaClasses = `
    w-full
    ${variant === 'filled' ? 'bg-white/5' : 'bg-transparent'}
    border rounded-xl
    px-4 py-3
    text-white placeholder:text-slate-500
    font-body text-base
    resize-y
    transition-all duration-300 ease-out
    ${hasError
      ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
      : 'border-white/10 focus:border-white/30 focus:ring-2 focus:ring-white/10'
    }
    ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
    min-h-[100px]
  `;

  const labelClasses = `
    absolute left-4
    font-body text-sm font-medium
    pointer-events-none
    transition-all duration-300 ease-out
    ${isLabelFloating
      ? 'top-2 text-xs text-slate-400'
      : 'top-3 text-base text-slate-400'
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
              : 'translateY(0) scale(1)',
            transformOrigin: 'left top',
          }}
        >
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className={textareaClasses}
        value={value}
        placeholder={isLabelFloating ? placeholder : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        {...props}
      />

      {/* Focus indicator */}
      {isFocused && !hasError && (
        <div className="absolute inset-0 rounded-xl pointer-events-none animate-pulse">
          <div className="absolute inset-0 rounded-xl border-2 border-white/20 opacity-50" />
        </div>
      )}

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

      {/* Character count (if maxLength) */}
      {props.maxLength && (
        <div className="mt-2 text-xs text-slate-500 text-right">
          {String(value || '').length} / {props.maxLength}
        </div>
      )}
    </div>
  );
};

export default Textarea;

