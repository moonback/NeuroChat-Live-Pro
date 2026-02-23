import React from 'react';

interface BackgroundLayersProps {
    themeColor: string;
    isTalking: boolean;
    isConnected: boolean;
}

const BackgroundLayers: React.FC<BackgroundLayersProps> = React.memo(({ themeColor, isTalking, isConnected }) => (
    <>
        {/* Base Layer - Deep Black with Subtle Noise */}
        <div
            className="absolute inset-0 bg-[#000000] z-0"
            style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.015) 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }}
        />

        {/* Primary Ambient Glow - Center */}
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vh] h-[90vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0 animate-float"
            style={{
                background: `radial-gradient(circle, ${themeColor}25, ${themeColor}10 40%, transparent 70%)`,
                filter: 'blur(80px)',
                animation: 'pulse-glow 8s ease-in-out infinite'
            }}
        />

        {/* Secondary Glow - Top Right for Depth */}
        <div
            className="absolute top-[15%] right-[15%] w-[60vh] h-[60vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0"
            style={{
                background: `radial-gradient(circle, ${themeColor}15, transparent 60%)`,
                filter: 'blur(100px)',
                animation: 'pulse-glow 10s ease-in-out infinite reverse, float 12s ease-in-out infinite'
            }}
        />

        {/* Tertiary Glow - Bottom Left */}
        <div
            className="absolute bottom-[10%] left-[20%] w-[50vh] h-[50vh] rounded-full transition-all duration-[2000ms] ease-out pointer-events-none z-0"
            style={{
                background: `radial-gradient(circle, ${themeColor}12, transparent 60%)`,
                filter: 'blur(90px)',
                animation: 'pulse-glow 12s ease-in-out infinite, float 10s ease-in-out infinite reverse'
            }}
        />

        {/* Additional Dynamic Glow - Responsive to connection state */}
        {(isTalking || isConnected) && (
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vh] h-[100vh] rounded-full pointer-events-none z-0 transition-opacity duration-1000"
                style={{
                    background: `radial-gradient(circle, ${themeColor}20, transparent 50%)`,
                    filter: 'blur(120px)',
                    animation: 'pulse-glow 6s ease-in-out infinite',
                    opacity: isTalking ? 0.8 : 0.4
                }}
            />
        )}

        {/* Sophisticated Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-0 pointer-events-none transition-opacity duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent z-0 pointer-events-none transition-opacity duration-1000" />

        {/* Animated mesh gradient overlay for depth */}
        <div
            className="absolute inset-0 z-0 pointer-events-none opacity-40 transition-all duration-1000"
            style={{
                backgroundImage: `
                    radial-gradient(at 0% 0%, ${themeColor}10 0, transparent 50%),
                    radial-gradient(at 100% 0%, ${themeColor}08 0, transparent 50%),
                    radial-gradient(at 100% 100%, ${themeColor}10 0, transparent 50%),
                    radial-gradient(at 0% 100%, ${themeColor}08 0, transparent 50%)
                `,
                filter: 'blur(40px)'
            }}
        />

        {/* Grain Overlay for Texture */}
        <div className="absolute inset-0 z-[1] pointer-events-none opacity-[0.03] mix-blend-overlay"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
        />
    </>
));

BackgroundLayers.displayName = 'BackgroundLayers';

export default BackgroundLayers;
