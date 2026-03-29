import { Button } from "@/components/ui/button";
import { useCallback, useRef, useState } from "react";

interface ImageCropperProps {
  src: string;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropper({ src, onCrop, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{
    mx: number;
    my: number;
    ox: number;
    oy: number;
  } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const viewportSize = 280;
  const outputSize = 400;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      dragStart.current = {
        mx: e.clientX,
        my: e.clientY,
        ox: offset.x,
        oy: offset.y,
      };
    },
    [offset],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !dragStart.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    },
    [dragging],
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  const handleCrop = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nat = img.naturalWidth;
    const natH = img.naturalHeight;
    const baseScale = Math.min(viewportSize / nat, viewportSize / natH);
    const scale = baseScale * zoom;
    const rw = nat * scale;
    const rh = natH * scale;
    const ix = (viewportSize - rw) / 2 + offset.x;
    const iy = (viewportSize - rh) / 2 + offset.y;
    const ratio = outputSize / viewportSize;

    // Clip to circle so output has transparent circular boundary
    ctx.save();
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw the image — use positive ix/iy so the correct visible region is captured
    ctx.drawImage(img, ix * ratio, iy * ratio, rw * ratio, rh * ratio);

    ctx.restore();

    onCrop(canvas.toDataURL("image/png"));
  }, [zoom, offset, onCrop]);

  // Circle guide dimensions
  const circleSize = 240;
  const circlePad = (viewportSize - circleSize) / 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <div
        className="rounded-2xl p-5 flex flex-col items-center gap-4 w-full max-w-xs"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <h2 className="text-sm font-semibold text-foreground">Crop Image</h2>
        <p className="text-xs text-muted-foreground -mt-2 text-center">
          Drag &amp; zoom to position. Only the circle area will be saved.
        </p>

        {/* Viewport */}
        <div
          className="relative rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style={{
            width: viewportSize,
            height: viewportSize,
            background: "oklch(var(--muted))",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Crop preview"
            draggable={false}
            className="absolute"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
              transformOrigin: "center",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />

          {/* Dark overlay outside the circle guide */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `
                radial-gradient(
                  circle ${circleSize / 2}px at 50% 50%,
                  transparent ${circleSize / 2}px,
                  rgba(0,0,0,0.6) ${circleSize / 2}px
                )
              `,
            }}
          />

          {/* Circle border guide */}
          <div
            className="absolute pointer-events-none z-20 rounded-full"
            style={{
              width: circleSize,
              height: circleSize,
              top: circlePad,
              left: circlePad,
              border: "2px solid rgba(255,255,255,0.7)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Zoom</span>
            <span>{zoom.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: "var(--accent-color)" }}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1 border-border"
            onClick={onCancel}
            data-ocid="image_cropper.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            style={{ background: "var(--accent-color)" }}
            onClick={handleCrop}
            data-ocid="image_cropper.confirm_button"
          >
            Crop &amp; Save
          </Button>
        </div>
      </div>
    </div>
  );
}
