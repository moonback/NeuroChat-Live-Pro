import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'glass';
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  hover?: boolean;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'md',
  hover = true,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = `
    relative
    rounded-2xl
    transition-all duration-300 ease-out
    overflow-hidden
  `;

  const variantClasses = {
    default: `
      bg-[#0a0a0a]/60
      border border-white/10
      shadow-lg
    `,
    elevated: `
      bg-[#0f0f19]/80
      border border-white/15
      shadow-xl
    `,
    interactive: `
      glass-intense
      border border-white/10
      shadow-lg
      cursor-pointer
      ${hover ? 'hover:border-white/20 hover:shadow-xl hover:-translate-y-1' : ''}
    `,
    glass: `
      glass
      border border-white/10
      shadow-md
    `,
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={classes} {...props}>
      {/* Subtle gradient overlay for depth */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Hover glow effect */}
      {hover && variant === 'interactive' && (
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div
            className="absolute inset-0 rounded-2xl blur-xl"
            style={{
              background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1), transparent 70%)',
            }}
          />
        </div>
      )}
    </div>
  );
};

// Card sub-components
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3
    className={`font-display font-bold text-lg text-white mb-2 ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p className={`text-sm text-slate-400 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`mt-4 pt-4 border-t border-white/10 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;

