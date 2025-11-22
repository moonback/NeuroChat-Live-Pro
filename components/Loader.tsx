import React from 'react';

const Loader: React.FC<{ size?: 'sm' | 'md' | 'lg', color?: string }> = ({ size = 'md', color = '#6366f1' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: `${color}40`, borderTopColor: color }}></div>
      
      {/* Inner Ring */}
      <div className="absolute inset-1 rounded-full border-2 border-b-transparent animate-spin-reverse"
        style={{ borderColor: `${color}20`, borderBottomColor: color, animationDuration: '1.5s' }}></div>
      
      {/* Pulse Core */}
      <div className="absolute inset-0 m-auto w-1/3 h-1/3 rounded-full animate-pulse"
        style={{ backgroundColor: color }}></div>
    </div>
  );
};

export default Loader;
