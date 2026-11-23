"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;

const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
const round2 = (z: number) => Math.round(z * 100) / 100;

/**
 * Wraps an A4-sized preview and provides zoom:
 * - defaults to "fit to width" so the page fills the viewport (no wasted side
 *   space on phones, and no overflow), never upscaling past 100%
 * - on-screen +/- buttons (click the % to re-fit to width)
 * - Ctrl + wheel / trackpad pinch, and two-finger pinch on touch screens
 *
 * Zoom is a view-only transform; the underlying element is untouched, so the
 * PDF export (captured at exact A4) is unaffected.
 */
export function ZoomableResume({
  children,
  baseWidthPx = 794,
  baseHeightPx = 1123,
}: {
  children: React.ReactNode;
  baseWidthPx?: number;
  baseHeightPx?: number;
}) {
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  const userAdjustedRef = useRef(false);

  // Scale the page to fit the viewport width (never upscaled beyond 100%).
  const fitToWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const styles = getComputedStyle(el);
    const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const avail = el.clientWidth - padX;
    if (avail <= 0) return;
    setZoom(clampZoom(round2(Math.min(avail / baseWidthPx, 1))));
  }, [baseWidthPx]);

  // Fit on first render and on viewport resize, until the user zooms manually.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onResize = () => {
      if (!userAdjustedRef.current) fitToWidth();
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitToWidth]);

  // Ctrl + wheel / trackpad pinch, and two-finger touch pinch.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      userAdjustedRef.current = true;
      const delta = Math.max(-0.2, Math.min(0.2, -e.deltaY * 0.01));
      setZoom((z) => clampZoom(round2(z + delta)));
    };

    const distance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = { startDist: distance(e.touches), startZoom: zoomRef.current };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        userAdjustedRef.current = true;
        const ratio = distance(e.touches) / pinchRef.current.startDist;
        setZoom(clampZoom(round2(pinchRef.current.startZoom * ratio)));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const adjustZoom = (next: number) => {
    userAdjustedRef.current = true;
    setZoom(clampZoom(round2(next)));
  };

  const resetToFit = () => {
    userAdjustedRef.current = false;
    fitToWidth();
  };

  return (
    <>
      <div
        ref={scrollRef}
        className="absolute inset-0 w-full h-full overflow-auto p-4 md:p-8 custom-scrollbar print:static print:h-auto print:overflow-visible print:p-0"
        style={{ touchAction: "pan-x pan-y" }}
      >
        <div
          className="resume-zoom-sizer mx-auto"
          style={{ width: `calc(${baseWidthPx}px * ${zoom})`, height: `calc(${baseHeightPx}px * ${zoom})` }}
        >
          <div
            className="resume-zoom-layer"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: `${baseWidthPx}px`,
              height: `${baseHeightPx}px`,
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Zoom toolbar */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-0.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-full shadow-lg px-1.5 py-1 no-print">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={() => adjustZoom(zoomRef.current - ZOOM_STEP)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <button
          onClick={resetToFit}
          className="text-xs font-medium tabular-nums w-11 text-center text-slate-600 dark:text-slate-300 hover:text-primary"
          title="Fit to width"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={() => adjustZoom(zoomRef.current + ZOOM_STEP)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
}
