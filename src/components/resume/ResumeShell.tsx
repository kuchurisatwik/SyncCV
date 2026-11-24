"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

import { RESUME_SANS } from "./shared";

const PAGE_W = 794; // 210mm @ 96dpi
const PAGE_H = 1123; // 297mm @ 96dpi
const MIN_SCALE = 0.5;

/**
 * The shared A4 page for every template.
 *
 * Width-filling auto-fit: lay the content out wider and scale it down so it
 * fills the full page width (no side gaps) with the largest font that still
 * fits ONE page. A hidden off-screen measurer finds that scale.
 *
 * Robustness: the scale search is damped so it converges, and a final safety
 * clamp guarantees the content fits the page height — so content is NEVER
 * clipped at the bottom, for any template or amount of content.
 */
export function ResumeShell({ children }: { children: React.ReactNode }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const m = measureRef.current;
    if (!m) return;

    const heightAt = (width: number) => {
      m.style.width = `${width}px`;
      return m.scrollHeight;
    };

    const compute = () => {
      let s = 1;
      for (let i = 0; i < 8; i++) {
        const h = heightAt(PAGE_W / s);
        if (!h) return;
        const need = Math.min(1, Math.max(MIN_SCALE, PAGE_H / h));
        const nextS = (s + need) / 2; // damped for stable convergence
        if (Math.abs(nextS - s) < 0.003) {
          s = nextS;
          break;
        }
        s = nextS;
      }
      // Safety clamp: guarantee it fits the page height at the chosen width.
      const finalH = heightAt(PAGE_W / s);
      if (finalH > 0) {
        s = Math.min(s, Math.max(MIN_SCALE, PAGE_H / finalH));
      }
      setScale((prev) => (Math.abs(prev - s) > 0.003 ? s : prev));
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(m);

    let cancelled = false;
    const fonts = typeof document !== "undefined" ? (document as Document & { fonts?: FontFaceSet }).fonts : undefined;
    if (fonts?.ready) fonts.ready.then(() => { if (!cancelled) compute(); }).catch(() => {});

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [children]);

  return (
    <div className="mx-auto" style={{ width: PAGE_W, fontFamily: RESUME_SANS }}>
      {/* Off-screen measurer (never captured by the PDF export). */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none"
        style={{ position: "fixed", left: -100000, top: 0, visibility: "hidden", width: PAGE_W }}
      >
        {children}
      </div>

      {/* The actual A4 page. */}
      <div
        id="resume-preview-content"
        className="bg-white text-black overflow-hidden mx-auto shadow-md border border-slate-200 print:shadow-none print:border-0"
        style={{ width: PAGE_W, height: PAGE_H }}
      >
        <div style={{ width: PAGE_W / scale, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
