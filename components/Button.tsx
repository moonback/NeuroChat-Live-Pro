import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center gap-2
    font-display font-semibold
    rounded-xl
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    touch-manipulation
    select-none
  `;

  const variantClasses = {
    primary: `
      bg-white text-black
      shadow-[0_0_40px_rgba(255,255,255,0.25)]
      hover:scale-105 hover:shadow-[0_0_70px_rgba(255,255,255,0.45)]
      active:scale-95
      focus:ring-white/50
    `,
    secondary: `
      glass border border-white/10 text-white
      hover:border-white/20 hover:bg-white/5
      hover:scale-105 active:scale-95
      focus:ring-white/30
    `,
    ghost: `
      bg-transparent text-white/80
      hover:bg-white/5 hover:text-white
      hover:scale-105 active:scale-95
      focus:ring-white/20
    `,
    danger: `
      bg-red-500 text-white
      shadow-[0_0_40px_rgba(239,68,68,0.4)]
      hover:bg-red-600 hover:shadow-[0_0_60px_rgba(239,68,68,0.6)]
      hover:scale-105 active:scale-95
      focus:ring-red-500/50
    `,
    success: `
      bg-emerald-500 text-white
      shadow-[0_0_40px_rgba(16,185,129,0.4)]
      hover:bg-emerald-600 hover:shadow-[0_0_60px_rgba(16,185,129,0.6)]
      hover:scale-105 active:scale-95
      focus:ring-emerald-500/50
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-base min-h-[44px]',
    lg: 'px-6 py-3.5 text-lg min-h-[52px]',
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Ripple effect on click */}
      <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <span className="absolute inset-0 bg-white/20 scale-0 rounded-full transition-transform duration-500 ease-out group-active:scale-100" />
      </span>

      {/* Content */}
      <span className="relative flex items-center gap-2">
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Chargement...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </span>
    </button>
  );
};

export default Button;

