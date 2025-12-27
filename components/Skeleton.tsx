import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  animation = 'wave',
  className = '',
  style,
  ...props
}) => {
  const baseClasses = `
    bg-white/5
    rounded-lg
    ${animation === 'pulse' ? 'animate-pulse' : ''}
    ${animation === 'wave' ? 'skeleton' : ''}
  `;

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const inlineStyle: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'circular' ? width : undefined),
    ...style,
  };

  return <div className={classes} style={inlineStyle} {...props} />;
};

// Composants helpers
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '80%' : '100%'}
        height="1rem"
      />
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className = '' }) => (
  <Skeleton variant="circular" width={size} height={size} className={className} />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 space-y-4 ${className}`}>
    <div className="flex items-center gap-4">
      <SkeletonAvatar size={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="40%" height="1.25rem" />
        <Skeleton variant="text" width="60%" height="1rem" />
      </div>
    </div>
    <SkeletonText lines={3} />
    <div className="flex gap-2">
      <Skeleton variant="rectangular" width="100px" height="36px" />
      <Skeleton variant="rectangular" width="100px" height="36px" />
    </div>
  </div>
);

export default Skeleton;

