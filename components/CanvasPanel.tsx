import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface CanvasElement {
  id: string;
  type: 'line' | 'circle' | 'rectangle' | 'text' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  strokeWidth?: number;
  fontSize?: number;
  text?: string;
  points?: Array<{ x: number; y: number }>;
  endX?: number;
  endY?: number;
}

interface CanvasPanelProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  onElementsChange: (elements: CanvasElement[]) => void;
  themeColor?: string;
}

const CanvasPanel: React.FC<CanvasPanelProps> = ({
  isOpen,
  onClose,
  elements,
  onElementsChange,
  themeColor = '#0ea5e9',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Redraw canvas when elements change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid background
    drawGrid(ctx, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    // Draw all elements
    elements.forEach((element) => {
      drawElement(ctx, element);
    });

    ctx.restore();
  }, [elements, zoom, pan]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    const gridSize = 20;
    const offsetX = (pan.x % (gridSize * zoom)) / zoom;
    const offsetY = (pan.y % (gridSize * zoom)) / zoom;

    for (let x = -offsetX; x < width / zoom; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height / zoom);
      ctx.stroke();
    }

    for (let y = -offsetY; y < height / zoom; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width / zoom, y);
      ctx.stroke();
    }
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.color;
    ctx.lineWidth = element.strokeWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (element.type) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(element.x, element.y);
        ctx.lineTo(element.endX || element.x, element.endY || element.y);
        ctx.stroke();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(
          element.x,
          element.y,
          element.radius || (element.width || 20) / 2,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        break;

      case 'rectangle':
        ctx.strokeRect(
          element.x,
          element.y,
          element.width || 50,
          element.height || 50
        );
        break;

      case 'text':
        ctx.font = `${element.fontSize || 16}px Inter, sans-serif`;
        ctx.fillText(element.text || '', element.x, element.y);
        break;

      case 'freehand':
        if (element.points && element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
        }
        break;
    }
  };

  const handleClear = useCallback(() => {
    onElementsChange([]);
  }, [onElementsChange]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:z-30 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={containerRef}
        className="fixed right-0 top-0 bottom-0 w-full lg:w-96 xl:w-[28rem] z-50 lg:z-40 bg-[#050508]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
        style={{
          boxShadow: `-10px 0 40px rgba(0, 0, 0, 0.5), 0 0 20px ${themeColor}15`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-b from-[#050508]/98 to-transparent">
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }}
            />
            <h2 className="text-sm font-bold text-white tracking-tight">Canvas Collaboratif</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer le canvas"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Zoom arrière"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
              </svg>
            </button>
            <span className="text-xs text-zinc-400 font-mono min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Zoom avant"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM18 10.5h-6m3-3v6" />
              </svg>
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Réinitialiser zoom"
            >
              Reset
            </button>
          </div>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors"
            aria-label="Effacer le canvas"
          >
            Effacer
          </button>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 relative overflow-hidden bg-[#020617]">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ touchAction: 'none' }}
          />
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-zinc-600">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                  />
                </svg>
                <p className="text-sm font-medium">Le canvas est vide</p>
                <p className="text-xs text-zinc-700 mt-1">L'IA peut dessiner ici</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-white/5 bg-white/5">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>{elements.length} élément{elements.length !== 1 ? 's' : ''}</span>
            <span className="font-mono">
              Ctrl + Drag pour déplacer • Molette pour zoomer
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CanvasPanel;

