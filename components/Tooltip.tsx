import React, { useState, useEffect, useRef } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  maxWidth?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  delay = 300,
  disabled = false,
  maxWidth = 'max-w-xs'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top': return 'top-full left-1/2 -translate-x-1/2 border-t-slate-800/95 border-x-transparent border-b-transparent border-4';
      case 'bottom': return 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800/95 border-x-transparent border-t-transparent border-4';
      case 'left': return 'left-full top-1/2 -translate-y-1/2 border-l-slate-800/95 border-y-transparent border-r-transparent border-4';
      case 'right': return 'right-full top-1/2 -translate-y-1/2 border-r-slate-800/95 border-y-transparent border-l-transparent border-4';
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && !disabled && (
        <div 
          ref={tooltipRef}
          className={`absolute z-50 ${getPositionClasses()} animate-scale-in pointer-events-none`}
          role="tooltip"
          aria-live="polite"
        >
          <div className={`relative bg-slate-800/95 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-lg shadow-2xl border border-white/10 ${maxWidth} ${typeof content === 'string' ? 'whitespace-nowrap' : ''}`}>
            {content}
            <div className={`absolute ${getArrowClasses()}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
