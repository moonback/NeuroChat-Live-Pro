import React from 'react';

interface LatencyIndicatorProps {
  latencyMs: number;
}

const LatencyIndicator: React.FC<LatencyIndicatorProps> = ({ latencyMs }) => {
  const getColor = () => {
    if (latencyMs < 200) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' };
    if (latencyMs < 500) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
    return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
  };

  const getStatus = () => {
    if (latencyMs < 200) return 'Excellent';
    if (latencyMs < 500) return 'Bon';
    return 'Élevé';
  };

  const colors = getColor();

  return (
    <div 
      className={`flex items-center gap-1.5 backdrop-blur-sm px-2.5 py-1.5 rounded-md border transition-all duration-300 ${colors.bg} ${colors.border} group hover:scale-105`}
      title={`Latence: ${latencyMs}ms - ${getStatus()}`}
    >
      <div className="relative">
        <svg className={`w-3 h-3 ${colors.text} transition-transform duration-300 group-hover:rotate-12`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {latencyMs < 200 && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
        )}
      </div>
      <span className={`font-mono text-[10px] font-semibold ${colors.text}`}>
        {latencyMs > 0 ? `${latencyMs}ms` : '--'}
      </span>
    </div>
  );
};

export default LatencyIndicator;
