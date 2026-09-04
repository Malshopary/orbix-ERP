import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Check,
  X,
  Maximize2,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

type AspectRatioMode = 'free' | '3:1' | '2:1' | '1:1' | '4:1';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Transformations
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flippedH, setFlippedH] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('free');

  // Crop Box normalized coordinates (percentage 0 to 100 within viewport)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 20,
    width: 80,
    height: 60,
  });

  // Dragging state for crop box
  const [isDraggingBox, setIsDraggingBox] = useState<boolean>(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; box: typeof cropBox }>({
    mouseX: 0,
    mouseY: 0,
    box: cropBox,
  });

  // Image load state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Reset when opening with new image
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setFlippedH(false);
      setAspectRatio('free');
      setCropBox({ x: 10, y: 15, width: 80, height: 70 });
      setImageLoaded(false);
    }
  }, [isOpen, imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  };

  // Adjust crop box based on aspect ratio
  const applyAspectRatio = (ratio: AspectRatioMode) => {
    setAspectRatio(ratio);
    if (ratio === 'free') return;

    let targetRatio = 1;
    if (ratio === '3:1') targetRatio = 3 / 1;
    if (ratio === '2:1') targetRatio = 2 / 1;
    if (ratio === '1:1') targetRatio = 1 / 1;
    if (ratio === '4:1') targetRatio = 4 / 1;

    setCropBox((prev) => {
      const container = containerRef.current;
      if (!container) return prev;
      const cWidth = container.clientWidth;
      const cHeight = container.clientHeight;

      // Desired pixel width and height
      let newW = prev.width;
      let newPixelW = (newW / 100) * cWidth;
      let newPixelH = newPixelW / targetRatio;
      let newH = (newPixelH / cHeight) * 100;

      if (newH > 90) {
        newH = 80;
        newPixelH = (newH / 100) * cHeight;
        newPixelW = newPixelH * targetRatio;
        newW = (newPixelW / cWidth) * 100;
      }

      const newX = Math.max(5, Math.min(95 - newW, (100 - newW) / 2));
      const newY = Math.max(5, Math.min(95 - newH, (100 - newH) / 2));

      return { x: newX, y: newY, width: newW, height: newH };
    });
  };

  // Mouse / Touch handlers for moving & resizing the crop box
  const handlePointerDown = (e: React.PointerEvent, handle: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDragHandle(handle);
    setIsDraggingBox(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...cropBox },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingBox || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaX = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;
    const initial = dragStartRef.current.box;

    if (!dragHandle) {
      // Moving the entire box
      let newX = initial.x + deltaX;
      let newY = initial.y + deltaY;

      // Bound checks
      newX = Math.max(0, Math.min(100 - initial.width, newX));
      newY = Math.max(0, Math.min(100 - initial.height, newY));

      setCropBox({
        ...initial,
        x: newX,
        y: newY,
      });
    } else {
      // Resizing via handles
      let { x, y, width, height } = initial;

      if (dragHandle.includes('e')) {
        width = Math.max(10, Math.min(100 - x, initial.width + deltaX));
      }
      if (dragHandle.includes('s')) {
        height = Math.max(10, Math.min(100 - y, initial.height + deltaY));
      }
      if (dragHandle.includes('w')) {
        const potentialW = initial.width - deltaX;
        if (potentialW >= 10 && initial.x + deltaX >= 0) {
          x = initial.x + deltaX;
          width = potentialW;
        }
      }
      if (dragHandle.includes('n')) {
        const potentialH = initial.height - deltaY;
        if (potentialH >= 10 && initial.y + deltaY >= 0) {
          y = initial.y + deltaY;
          height = potentialH;
        }
      }

      setCropBox({ x, y, width, height });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDraggingBox(false);
    setDragHandle(null);
  };

  // Perform the actual crop using an offscreen canvas
  const handleConfirmCrop = () => {
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container || !naturalSize.width || !naturalSize.height) return;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // The crop box in screen pixels relative to container
    const cropPixelX = containerRect.left + (cropBox.x / 100) * containerRect.width;
    const cropPixelY = containerRect.top + (cropBox.y / 100) * containerRect.height;
    const cropPixelW = (cropBox.width / 100) * containerRect.width;
    const cropPixelH = (cropBox.height / 100) * containerRect.height;

    // Relative to the visible image element inside container
    const relativeX = cropPixelX - imgRect.left;
    const relativeY = cropPixelY - imgRect.top;

    // Scale factor between visible rendered image and natural resolution
    const scaleX = naturalSize.width / imgRect.width;
    const scaleY = naturalSize.height / imgRect.height;

    // Source rect on natural image
    const sourceX = Math.max(0, relativeX * scaleX);
    const sourceY = Math.max(0, relativeY * scaleY);
    const sourceW = Math.min(naturalSize.width - sourceX, cropPixelW * scaleX);
    const sourceH = Math.min(naturalSize.height - sourceY, cropPixelH * scaleY);

    if (sourceW <= 0 || sourceH <= 0) return;

    // Create Canvas
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sourceW);
    canvas.height = Math.round(sourceH);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle rotation / flip if needed
    ctx.save();
    if (rotation !== 0 || flippedH) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
      if (flippedH) ctx.scale(-1, 1);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();

    const croppedBase64 = canvas.toDataURL('image/png', 0.95);
    onCropComplete(croppedBase64);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                أداة قص وتعديل مقاس الشعار (Image Cropper)
              </h3>
              <p className="text-[11px] text-slate-500">
                حدد الجزء المراد من الشعار، أزل الحواف البيضاء الزائدة أو اضبط الأبعاد لتظهر بأفضل دقة في الفاتورة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio & Toolbar */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-500 font-bold text-[11px] ml-1">نسبة الأبعاد:</span>
            {[
              { id: 'free', label: 'حر (Free)' },
              { id: '3:1', label: 'أفقي 3:1 (مثالي للفواتير)' },
              { id: '2:1', label: 'مستطيل 2:1' },
              { id: '1:1', label: 'مربع 1:1' },
              { id: '4:1', label: 'عريض 4:1' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyAspectRatio(item.id as AspectRatioMode)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${
                  aspectRatio === item.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Quick Transform Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRotation((r) => (r - 90) % 360)}
              title="تدوير 90 درجة لليسار"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="تدوير 90 درجة لليمين"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setFlippedH((f) => !f)}
              title="عكس أفقي (Flip)"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                flippedH ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setFlippedH(false);
                setAspectRatio('free');
                setCropBox({ x: 10, y: 15, width: 80, height: 70 });
              }}
              title="إعادة ضبط"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Cropping Canvas / Viewport */}
        <div className="relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center min-h-[320px] max-h-[500px] select-none p-4">
          <div
            ref={containerRef}
            className="relative w-full h-full max-w-xl max-h-[420px] flex items-center justify-center overflow-hidden touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* The Target Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Source for cropping"
              onLoad={handleImageLoad}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flippedH ? -1 : 1})`,
                transition: isDraggingBox ? 'none' : 'transform 0.15s ease',
              }}
              className="max-h-full max-w-full object-contain pointer-events-none select-none drop-shadow-md"
            />

            {/* Dark Mask Backdrop surrounding crop area */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: `0 0 0 9999px rgba(15, 23, 42, 0.65)`,
                left: `${cropBox.x}%`,
                top: `${cropBox.y}%`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
              }}
            />

            {/* Interactive Crop Box Window */}
            <div
              onPointerDown={(e) => handlePointerDown(e, null)}
              style={{
                left: `${cropBox.x}%`,
                top: `${cropBox.y}%`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
              }}
              className="absolute border-2 border-emerald-400 cursor-move rounded-xs shadow-2xl z-20 group"
            >
              {/* Grid Lines (Rule of Thirds) */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-emerald-200" />
                <div className="border-r border-b border-emerald-200" />
                <div className="border-b border-emerald-200" />
                <div className="border-r border-b border-emerald-200" />
                <div className="border-r border-b border-emerald-200" />
                <div className="border-b border-emerald-200" />
                <div className="border-r border-emerald-200" />
                <div className="border-r border-emerald-200" />
                <div />
              </div>

              {/* Resize Handles */}
              {/* Top-Left */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'nw')}
                className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
              />
              {/* Top-Right */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'ne')}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
              />
              {/* Bottom-Left */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'sw')}
                className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
              />
              {/* Bottom-Right */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'se')}
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
              />

              {/* Edge Handles */}
              {/* Top Center */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'n')}
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-emerald-400 border border-white rounded-full cursor-ns-resize"
              />
              {/* Bottom Center */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 's')}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-emerald-400 border border-white rounded-full cursor-ns-resize"
              />
              {/* Left Center */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'w')}
                className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-emerald-400 border border-white rounded-full cursor-ew-resize"
              />
              {/* Right Center */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'e')}
                className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-emerald-400 border border-white rounded-full cursor-ew-resize"
              />

              {/* Dimensions tag badge */}
              <div className="absolute top-1 left-1 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded pointer-events-none border border-white/20">
                {Math.round(cropBox.width)}% × {Math.round(cropBox.height)}%
              </div>
            </div>
          </div>
        </div>

        {/* Zoom & Fine Tuning Footer Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3 w-full sm:w-72">
            <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min="0.8"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-mono font-bold text-slate-600 min-w-[45px]">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء الأمر
            </button>
            <button
              type="button"
              onClick={handleConfirmCrop}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              تأكيد وتطبيق القص
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
