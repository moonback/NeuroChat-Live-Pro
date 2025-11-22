import React from 'react';

interface LatencyIndicatorProps {
  latencyMs: number;
}

const LatencyIndicator: React.FC<LatencyIndicatorProps> = ({ latencyMs }) => {
  const getColor = () => {
    if (latencyMs < 200) return 'text-emerald-400';
    if (latencyMs < 500) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md border border-white/5">
      <svg className={`w-3 h-3 ${getColor()}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span className={`font-mono text-[10px] font-medium ${getColor()}`}>
        {latencyMs > 0 ? `${latencyMs}ms` : '--'}
      </span>
    </div>
  );
};

export default LatencyIndicator;
