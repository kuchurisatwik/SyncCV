"use client";

import { Check } from "lucide-react";

import { TEMPLATES, type TemplateId } from "./resume/templates";

/** A tiny CSS mock of each template's layout, used as the gallery thumbnail. */
function TemplateThumb({ align, accent, light }: { align: "center" | "left"; accent: string; light?: boolean }) {
  const alignClass = align === "center" ? "items-center" : "items-start";
  return (
    <div className="w-full h-full bg-white flex flex-col gap-[3px] p-1.5 overflow-hidden">
      <div className={`flex flex-col gap-[2px] w-full ${alignClass}`}>
        <div className="h-[3px] rounded-full" style={{ width: "60%", background: accent }} />
        <div className="h-[2px] rounded-full bg-slate-300" style={{ width: "42%" }} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-[2px] w-full mt-[2px]">
          <div className="h-[2px] rounded-full" style={{ width: "34%", background: light ? "#cbd5e1" : accent }} />
          {!light && <div className="h-px bg-slate-200 w-full" />}
          <div className="h-[2px] rounded-full bg-slate-200 w-full" />
          <div className="h-[2px] rounded-full bg-slate-200" style={{ width: "88%" }} />
        </div>
      ))}
    </div>
  );
}

export function TemplateGallery({
  value,
  onChange,
  variant = "thumbs",
}: {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  variant?: "thumbs" | "pills";
}) {
  if (variant === "pills") {
    return (
      <div className="flex flex-nowrap items-center gap-1 overflow-x-auto max-w-full no-scrollbar">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-xs border transition-colors ${
              value === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-slate-200 dark:border-slate-700 hover:text-foreground"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {TEMPLATES.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className="group flex flex-col items-center gap-1" title={t.name}>
          <div
            className={`relative w-[56px] aspect-[3/4] mx-auto rounded-md border overflow-hidden transition-all ${
              value === t.id ? "ring-2 ring-primary border-primary" : "border-slate-200 dark:border-slate-700 group-hover:border-slate-400"
            }`}
          >
            <TemplateThumb align={t.thumb.align} accent={t.thumb.accent} light={t.thumb.light} />
            {value === t.id && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <span className={`text-[10px] leading-none ${value === t.id ? "text-primary font-medium" : "text-muted-foreground"}`}>
            {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}
