import React from 'react';

interface ScreenShareOverlayProps {
    isActive: boolean;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = React.memo(({ isActive }) => {
    if (!isActive) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-30 border-[6px] border-indigo-500/50 shadow-[inset_0_0_100px_rgba(99,102,241,0.2)] animate-pulse" />
    );
});

ScreenShareOverlay.displayName = 'ScreenShareOverlay';

export default ScreenShareOverlay;
