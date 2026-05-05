import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";

interface ImageBlurModalProps {
  imageSrc: string;
  onBlurComplete: (blurredImageSrc: string) => void;
  onClose: () => void;
}

export function ImageBlurModal({ imageSrc, onBlurComplete, onClose }: ImageBlurModalProps) {
  const [crop, setCrop] = useState<Crop | undefined>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return {
        unit: "%",
        width: 50,
        height: 50,
        x: 25,
        y: 25,
      };
    }
    return undefined;
  });
  const [mode, setMode] = useState<"crop" | "brush">("crop");
  const imageRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const syncCanvas = () => {
      if (imageRef.current && maskCanvasRef.current && mode === "brush") {
        const img = imageRef.current;
        const cvs = maskCanvasRef.current;
        if (cvs.width !== img.width || cvs.height !== img.height) {
          cvs.width = img.width;
          cvs.height = img.height;
        }
      }
    };
    // Let the image render first before syncing canvas
    const timer = setTimeout(syncCanvas, 100);
    window.addEventListener("resize", syncCanvas);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", syncCanvas);
    };
  }, [mode, imageSrc]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!maskCanvasRef.current) return null;
    const rect = maskCanvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== "brush") return;
    const pos = getCoordinates(e);
    if (pos) {
      setIsDrawing(true);
      lastPos.current = pos;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== "brush" || !maskCanvasRef.current) return;
    const pos = getCoordinates(e);
    if (pos && lastPos.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 40;
        ctx.strokeStyle = 'white';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'white';
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasDrawn(true);
      }
      lastPos.current = pos;
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const applyBlur = useCallback(async () => {
    if (!imageRef.current) return;

    if (mode === "crop" && (!crop || !crop.width || !crop.height)) return;
    if (mode === "brush" && !hasDrawn) return;

    const image = imageRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);

    if (mode === "crop") {
      const isPercent = crop!.unit === "%";
      const scaleX = isPercent ? image.naturalWidth / 100 : image.naturalWidth / image.width;
      const scaleY = isPercent ? image.naturalHeight / 100 : image.naturalHeight / image.height;

      const cx = crop!.x * scaleX;
      const cy = crop!.y * scaleY;
      const cWidth = crop!.width * scaleX;
      const cHeight = crop!.height * scaleY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(cx, cy, cWidth, cHeight);
      ctx.clip();
      // Increase blur relative to image size for consistent look
      const blurAmount = Math.max(25, (image.naturalWidth / 1000) * 25);
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    } else {
      const blurCanvas = document.createElement("canvas");
      blurCanvas.width = image.naturalWidth;
      blurCanvas.height = image.naturalHeight;
      const blurCtx = blurCanvas.getContext("2d");
      if (blurCtx) {
        blurCtx.filter = "blur(25px)";
        blurCtx.drawImage(image, 0, 0);

        blurCtx.globalCompositeOperation = "destination-in";
        blurCtx.drawImage(maskCanvasRef.current!, 0, 0, blurCanvas.width, blurCanvas.height);
      }

      ctx.drawImage(blurCanvas, 0, 0);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      onBlurComplete(URL.createObjectURL(blob));
    }, "image/jpeg", 0.95);
  }, [crop, mode, hasDrawn, onBlurComplete]);

  return (
    <div className="fixed inset-0 z-200 bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4 text-white shrink-0 mt-4">
        <h2 className="text-lg font-bold">Borrar Imagem</h2>
        <p className="text-sm text-zinc-400">Selecione a área que deseja borrar na foto</p>
        <div className="flex justify-center gap-2 mt-4 bg-white/10 p-1 rounded-lg w-fit mx-auto">
          <button
            onClick={() => setMode("crop")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === "crop" ? "bg-white text-black" : "text-white hover:bg-white/20"}`}
          >
            Caixa de Seleção
          </button>
          <button
            onClick={() => setMode("brush")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === "brush" ? "bg-white text-black" : "text-white hover:bg-white/20"}`}
          >
            Pincel Livre
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-5xl flex-1 bg-black/50 rounded-lg overflow-hidden border border-white/10 min-h-0 select-none flex items-center justify-center p-4">
        {mode === "crop" ? (
          <ReactCrop crop={crop} onChange={c => setCrop(c)} className="max-w-full max-h-full inline-block">
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Blur Area"
              className="block pointer-events-none select-none"
              crossOrigin="anonymous"
              style={{ maxWidth: '100%', maxHeight: 'calc(100dvh - 280px)', width: 'auto', height: 'auto' }}
            />
          </ReactCrop>
        ) : (
          <div className="relative max-w-full max-h-full inline-block">
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Blur Area"
              className="block pointer-events-none select-none"
              crossOrigin="anonymous"
              style={{ maxWidth: '100%', maxHeight: 'calc(100dvh - 280px)', width: 'auto', height: 'auto' }}
            />
            <canvas
              ref={maskCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
              style={{ touchAction: 'none' }}
            />
          </div>
        )}
      </div>

      <div className="my-6 flex gap-4 w-full max-w-sm shrink-0">
        <Button variant="secondary" className="w-full text-white border-white/20 hover:bg-white/10" onClick={onClose}>Cancelar</Button>
        <Button
          className="w-full bg-wine-700 hover:bg-wine-600 text-white disabled:opacity-50"
          onClick={applyBlur}
          disabled={(mode === "crop" && (!crop || !crop.width || !crop.height)) || (mode === "brush" && !hasDrawn)}
        >
          Aplicar Borrão
        </Button>
      </div>
    </div>
  );
}
