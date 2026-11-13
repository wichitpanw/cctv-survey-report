import React, { useRef, useState } from 'react';
import { FlipHorizontal2, RotateCw, Trash2, Move } from 'lucide-react';
import type { StickerOverlay } from '@/types/survey';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface StickerCanvasProps {
  imageUrl?: string;
  placeholderText: string;
  stickers: StickerOverlay[];
  onChange: (stickers: StickerOverlay[]) => void;
  aspectClass?: string;
}

export function StickerCanvas({
  imageUrl,
  placeholderText,
  stickers,
  onChange,
  aspectClass = 'aspect-[3/4]',
}: StickerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const selectedSticker = stickers.find((s) => s.id === selectedId) ?? null;

  const updatePositionFromPointer = (clientX: number, clientY: number, id: string) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));

    onChange(
      stickers.map((s) =>
        s.id === id ? { ...s, x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) } : s
      )
    );
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedId(id);
    setDraggingId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId) return;
    updatePositionFromPointer(e.clientX, e.clientY, draggingId);
  };

  const handlePointerUp = () => {
    setDraggingId(null);
  };

  const rotateSelected = (delta: number) => {
    if (!selectedSticker) return;
    onChange(
      stickers.map((s) =>
        s.id === selectedSticker.id
          ? { ...s, rotation: (((s.rotation ?? 0) + delta) % 360 + 360) % 360 }
          : s
      )
    );
  };

  const updateSelectedLabel = (label: string) => {
    if (!selectedSticker) return;
    onChange(
      stickers.map((s) => (s.id === selectedSticker.id ? { ...s, label } : s))
    );
  };

  const toggleCameraDirection = () => {
    if (!selectedSticker || selectedSticker.type !== 'camera') return;
    const nextDir = selectedSticker.direction === 'left' ? 'right' : 'left';
    onChange(
      stickers.map((s) =>
        s.id === selectedSticker.id ? { ...s, direction: nextDir } : s
      )
    );
  };

  const deleteSelected = () => {
    if (!selectedSticker) return;
    onChange(stickers.filter((s) => s.id !== selectedSticker.id));
    setSelectedId(null);
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => setSelectedId(null)}
        className={cn(
          'relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 select-none touch-none',
          aspectClass
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Survey Canvas"
            className="h-full w-full object-contain pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-xs text-slate-400">
            <Move className="mb-2 h-6 w-6 opacity-50" />
            <span>{placeholderText}</span>
          </div>
        )}

        {stickers.map((st) => {
          const isSelected = st.id === selectedId;
          return (
            <div
              key={st.id}
              onPointerDown={(e) => handlePointerDown(e, st.id)}
              onClick={(e) => e.stopPropagation()}
              style={{
                left: `${st.x}%`,
                top: `${st.y}%`,
                transform: 'translate(-50%, -50%)',
                width: st.type === 'pole' ? `${st.w ?? 4}%` : undefined,
                height: st.type === 'pole' ? `${st.h ?? 65}%` : undefined,
              }}
              title={st.label}
              className={cn(
                'group absolute cursor-grab active:cursor-grabbing transition-shadow',
                isSelected && 'ring-2 ring-blue-500 ring-offset-1 rounded'
              )}
            >
              {st.type === 'pole' && (
                <div className="h-full w-full bg-red-600 border border-red-900/70 opacity-90" />
              )}

              {st.type === 'camera' && (
                <div className="relative">
                  <img
                    src={
                      st.direction === 'left'
                        ? './assets/template/sticker-camera-left.png'
                        : './assets/template/sticker-camera.png'
                    }
                    alt={st.label || 'CAM'}
                    className="h-7 w-11 object-contain pointer-events-none drop-shadow"
                    draggable={false}
                  />
                  <span
                    className={cn(
                      'pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900/80 px-1 py-0 text-[9px] font-bold text-white transition-opacity',
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    )}
                  >
                    {st.label}
                  </span>
                </div>
              )}

              {st.type === 'cabinet' && (
                <img
                  src="./assets/template/sticker-cabinet.png"
                  alt="Cabinet"
                  className="h-12 w-10 object-contain pointer-events-none drop-shadow"
                  draggable={false}
                />
              )}

              {(st.type === 'cam-label' || st.type === 'cabinet-label') && (
                <div className="whitespace-nowrap border-2 border-white bg-[#FFC000] px-2.5 py-0.5 text-[11px] font-bold text-slate-900 shadow">
                  {st.label}
                </div>
              )}

              {st.type === 'cam-cone' && (
                <div className="relative flex flex-col items-center">
                  <div className="mb-1 rounded border border-orange-500 bg-white px-1.5 py-0 text-[10px] font-bold text-slate-900 shadow-xs">
                    {st.label}
                  </div>
                  <div
                    className="relative flex items-center justify-center"
                    style={{ transform: `rotate(${st.rotation ?? 0}deg)` }}
                  >
                    <div
                      className="h-0 w-0 opacity-50 pointer-events-none"
                      style={{
                        borderTop: '14px solid transparent',
                        borderBottom: '14px solid transparent',
                        borderLeft: '32px solid #FFD100',
                        position: 'absolute',
                        left: '6px',
                      }}
                    />
                    <div className="z-10 h-3 w-4 rounded-xs border border-white bg-red-600 shadow" />
                  </div>
                </div>
              )}

              {st.type === 'callout' && (
                <div className="whitespace-nowrap rounded-lg border border-slate-800 bg-white px-2 py-1 text-[10px] font-bold text-slate-900 shadow">
                  {st.label}
                </div>
              )}

              {st.type === 'meter' && (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="whitespace-nowrap border border-amber-400 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-900 shadow">
                    {st.label}
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-white p-1 shadow">
                    <img
                      src="./assets/template/sticker-meter.png"
                      alt="Meter"
                      className="h-8 w-6 object-contain pointer-events-none"
                      draggable={false}
                    />
                  </div>
                </div>
              )}

              {st.type === 'cat6' && (
                <div className="whitespace-nowrap rounded border border-sky-600 bg-white px-1.5 py-0.5 text-[10px] font-bold text-sky-700 shadow">
                  {st.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedSticker && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs">
          <span className="font-medium text-blue-900">
            เลือก: {selectedSticker.label} ({selectedSticker.x}%, {selectedSticker.y}%)
          </span>
          <input
            type="text"
            value={selectedSticker.label}
            onChange={(e) => updateSelectedLabel(e.target.value)}
            className="h-6 w-32 rounded border border-blue-200 bg-white px-2 text-xs"
            placeholder="ข้อความป้าย"
          />
          {selectedSticker.type === 'camera' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={toggleCameraDirection}
            >
              <FlipHorizontal2 className="h-3 w-3 mr-1" />
              {selectedSticker.direction === 'left' ? 'หันซ้าย (คลิกกลับขวา)' : 'หันขวา (คลิกกลับซ้าย)'}
            </Button>
          )}
          {selectedSticker.type === 'cam-cone' && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => rotateSelected(-30)}
              >
                -30°
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => rotateSelected(30)}
              >
                <RotateCw className="h-3 w-3 mr-1" />
                +30° ({selectedSticker.rotation ?? 0}°)
              </Button>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="ml-auto h-6 px-2 text-xs"
            onClick={deleteSelected}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            ลบชิ้นนี้
          </Button>
        </div>
      )}
    </div>
  );
}
