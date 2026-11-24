import type { jsPDF } from "jspdf";
import { getContacts, normalizeUrl, type ResumeData } from "@/components/resume/shared";

type RGB = [number, number, number];
type Align = "left" | "center";

/**
 * Per-template metrics. These mirror each template's on-screen CSS (font sizes
 * in pt = px * 0.75, line-height factor, and page margins in mm) so the PDF has
 * the SAME natural height as the preview — and therefore the same font size and
 * spacing after the one-page fit. Keep these in sync with the template themes
 * in src/components/resume/templates/*.
 */
interface TemplateStyle {
  font: "helvetica" | "times";
  accent: RGB;
  align: Align;
  sep: string;
  name: number; // header name size (pt)
  headline: number; // header headline size (pt)
  lead: number; // line-height factor
  padY: number; // top/bottom page margin (mm)
  headGapTop: number; // gap from heading text to its rule (mm)
  headGapBot: number; // gap from the rule to the section body (mm)
}

function styleFor(id?: string): TemplateStyle {
  switch (id) {
    case "modern":
      return { font: "helvetica", accent: [30, 58, 138], align: "left", sep: "•", name: 18, headline: 9, lead: 1.2, padY: 11.6, headGapTop: 0.6, headGapBot: 1.4 };
    case "executive":
      return { font: "times", accent: [51, 65, 85], align: "center", sep: "•", name: 20.25, headline: 9, lead: 1.25, padY: 13.2, headGapTop: 1.0, headGapBot: 1.8 };
    case "minimal":
      return { font: "helvetica", accent: [71, 85, 105], align: "left", sep: "·", name: 18, headline: 9, lead: 1.2, padY: 12.2, headGapTop: 0.6, headGapBot: 1.4 };
    case "classic":
    default:
      return { font: "helvetica", accent: [17, 24, 39], align: "center", sep: "|", name: 16.5, headline: 8.25, lead: 1.2, padY: 12.2, headGapTop: 0.6, headGapBot: 1.4 };
  }
}

const PT_TO_MM = 0.352778;
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 11.6; // left margin (mm) — matches every template's px-[44px]
const MR = 11.6; // right margin
const CW = PAGE_W - ML - MR; // content width

// Shared text sizes (pt) — every template uses text-[12px] body/headings and text-[11px] meta.
const SZ_BODY = 9; // 12px
const SZ_HEADING = 9; // 12px
const SZ_SMALL = 8.25; // 11px

// Shared vertical gaps (mm). Kept slightly tighter than the preview's Tailwind
// spacing to offset jsPDF wrapping text into more lines than the browser, so the
// PDF fills the page at a comparable font size instead of over-shrinking.
const SECTION_GAP = 2.8; // ~ section mb-3
const ITEM_GAP = 2.2; // ~ space-y-2.5 between experience/project items
const BULLET_GAP = 0.8; // ~ space-y-1 between bullets

const BODY_C: RGB = [31, 41, 55];
const MUTED_C: RGB = [100, 116, 139];
const RULE_C: RGB = [203, 213, 225];

/**
 * Renders the resume into the doc. When draw=false it only advances the cursor
 * (used to measure total height for the one-page fit). Returns content height (mm).
 */
function render(doc: jsPDF, data: ResumeData, st: TemplateStyle, scale: number, draw: boolean): number {
  const NAME = st.name * scale;
  const HEADLINE = st.headline * scale;
  const HEADING = SZ_HEADING * scale;
  const BODY = SZ_BODY * scale;
  const SMALL = SZ_SMALL * scale;
  const MT = st.padY;
  const lh = (pt: number) => pt * st.lead * PT_TO_MM;

  const setColor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const anchorX = st.align === "center" ? PAGE_W / 2 : ML;
  const b = data.basics || ({} as ResumeData["basics"]);

  let y = MT;

  // ---- Header ----
  doc.setFont(st.font, "bold");
  doc.setFontSize(NAME);
  setColor(st.accent);
  if (draw) doc.text((b.name || "Name").toUpperCase(), anchorX, y, { align: st.align, baseline: "top" });
  y += lh(NAME) + 1 * scale;

  if (b.headline) {
    doc.setFont(st.font, st.font === "times" ? "italic" : "bold");
    doc.setFontSize(HEADLINE);
    setColor(MUTED_C);
    if (draw) doc.text(b.headline, anchorX, y, { align: st.align, baseline: "top" });
    y += lh(HEADLINE) + 1.5 * scale;
  }

  // Contacts (with clickable links)
  const contacts = getContacts(b);
  if (contacts.length) {
    doc.setFont(st.font, "normal");
    doc.setFontSize(SMALL);
    const sepStr = `  ${st.sep}  `;
    const sepW = doc.getTextWidth(sepStr);
    const pieces = contacts.map((c) => ({ ...c, w: doc.getTextWidth(c.label) }));
    const totalW = pieces.reduce((s, p) => s + p.w, 0) + sepW * Math.max(0, pieces.length - 1);
    let x = st.align === "center" ? (PAGE_W - totalW) / 2 : ML;
    const h = lh(SMALL);
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      if (i > 0) {
        setColor(MUTED_C);
        if (draw) doc.text(sepStr, x, y, { baseline: "top" });
        x += sepW;
      }
      if (p.href) {
        setColor(st.accent);
        if (draw) {
          doc.text(p.label, x, y, { baseline: "top" });
          doc.link(x, y, p.w, h, { url: p.href });
        }
      } else {
        setColor(MUTED_C);
        if (draw) doc.text(p.label, x, y, { baseline: "top" });
      }
      x += p.w;
    }
    y += h;
  }

  y += 3.5 * scale;

  // ---- Section helper ----
  const heading = (title: string) => {
    doc.setFont(st.font, "bold");
    doc.setFontSize(HEADING);
    setColor(st.accent);
    if (draw) doc.text(title.toUpperCase(), ML, y, { baseline: "top" });
    y += lh(HEADING) + st.headGapTop * scale;
    if (draw) {
      doc.setDrawColor(RULE_C[0], RULE_C[1], RULE_C[2]);
      doc.setLineWidth(0.3);
      doc.line(ML, y, ML + CW, y);
    }
    y += st.headGapBot * scale;
  };

  const paragraph = (text: string, fs: number, color: RGB, style: "normal" | "italic" | "bold" = "normal") => {
    doc.setFont(st.font, style);
    doc.setFontSize(fs);
    setColor(color);
    const lines = doc.splitTextToSize(text, CW) as string[];
    if (draw) doc.text(lines, ML, y, { baseline: "top" });
    y += lines.length * lh(fs);
  };

  const bullets = (items: string[]) => {
    const indent = 3.6 * scale;
    doc.setFont(st.font, "normal");
    doc.setFontSize(BODY);
    setColor(BODY_C);
    for (const it of items) {
      if (!it) continue;
      const lines = doc.splitTextToSize(it, CW - indent) as string[];
      if (draw) {
        doc.text("•", ML, y, { baseline: "top" });
        doc.text(lines, ML + indent, y, { baseline: "top" });
      }
      y += lines.length * lh(BODY) + BULLET_GAP * scale;
    }
  };

  const titleAndDate = (title: string, dates: string) => {
    doc.setFont(st.font, "bold");
    doc.setFontSize(BODY);
    setColor(BODY_C);
    if (draw) doc.text(title, ML, y, { baseline: "top" });
    if (dates.trim()) {
      doc.setFont(st.font, "normal");
      doc.setFontSize(SMALL);
      setColor(MUTED_C);
      if (draw) doc.text(dates, ML + CW, y, { align: "right", baseline: "top" });
    }
    y += lh(BODY);
  };

  const sectionGap = () => { y += SECTION_GAP * scale; };

  // ---- Summary ----
  if (b.summary) {
    heading("Professional Summary");
    paragraph(b.summary, BODY, BODY_C);
    sectionGap();
  }

  // ---- Skills ----
  if (data.skills?.length) {
    heading("Technical Skills");
    for (const g of data.skills) {
      doc.setFontSize(BODY);
      setColor(BODY_C);
      const label = `${g.category}: `;
      doc.setFont(st.font, "bold");
      const labelW = doc.getTextWidth(label);
      doc.setFont(st.font, "normal");
      const kw = (g.keywords || []).join(", ");
      const kwLines = doc.splitTextToSize(kw, Math.max(20, CW - labelW)) as string[];
      if (draw) {
        doc.setFont(st.font, "bold");
        doc.text(label, ML, y, { baseline: "top" });
        doc.setFont(st.font, "normal");
        doc.text(kwLines, ML + labelW, y, { baseline: "top" });
      }
      y += Math.max(1, kwLines.length) * lh(BODY) + BULLET_GAP * scale;
    }
    sectionGap();
  }

  // ---- Experience ----
  if (data.experience?.length) {
    heading("Professional Experience");
    data.experience.forEach((exp, idx) => {
      titleAndDate(exp.position || "", `${exp.startDate || ""} - ${exp.endDate || ""}`);
      const sub = [exp.company, exp.location].filter(Boolean).join(" | ");
      if (sub) { paragraph(sub, SMALL, MUTED_C, "italic"); y += 0.5 * scale; }
      bullets(exp.highlights || []);
      if (idx < data.experience.length - 1) y += ITEM_GAP * scale;
    });
    sectionGap();
  }

  // ---- Projects ----
  if (data.projects?.length) {
    heading("Projects");
    data.projects.forEach((p, idx) => {
      doc.setFont(st.font, "bold");
      doc.setFontSize(BODY);
      setColor(BODY_C);
      if (draw) doc.text(p.name || "", ML, y, { baseline: "top" });
      const url = normalizeUrl(p.url);
      if (url) {
        doc.setFont(st.font, "normal");
        doc.setFontSize(SMALL);
        setColor(st.accent);
        const label = "GitHub";
        const w = doc.getTextWidth(label);
        if (draw) {
          doc.text(label, ML + CW, y, { align: "right", baseline: "top" });
          doc.link(ML + CW - w, y, w, lh(SMALL), { url });
        }
      }
      y += lh(BODY);
      if (p.technologies?.length) { paragraph(p.technologies.join(" | "), SMALL, MUTED_C, "italic"); y += 0.3 * scale; }
      if (p.description) paragraph(p.description, SMALL, MUTED_C);
      y += 0.6 * scale;
      bullets(p.highlights || []);
      if (idx < data.projects.length - 1) y += ITEM_GAP * scale;
    });
    sectionGap();
  }

  // ---- Education ----
  if (data.education?.length) {
    heading("Education");
    data.education.forEach((e) => {
      titleAndDate(`${e.studyType || ""}${e.area ? ` (${e.area})` : ""}`, `${e.startDate || ""} - ${e.endDate || ""}`);
      const inst = `${e.institution || ""}${e.gpa ? ` — GPA: ${e.gpa}` : ""}`;
      if (inst.trim()) { paragraph(inst, SMALL, MUTED_C, "italic"); y += 1 * scale; }
    });
    sectionGap();
  }

  // ---- Certifications ----
  if (data.certifications?.length) {
    heading("Certifications");
    bullets(data.certifications.map((c) => `${c.name}${c.issuer ? `, ${c.issuer}` : ""}${c.date ? ` (${c.date})` : ""}`));
    sectionGap();
  }

  // ---- Achievements ----
  if (data.achievements?.length) {
    heading("Achievements");
    bullets(data.achievements);
    sectionGap();
  }

  return y - MT;
}

/** Builds an ATS-friendly, text-based resume PDF and returns it as a Blob. */
export async function buildResumeBlob(data: ResumeData, templateId?: string): Promise<Blob> {
  const mod = await import("jspdf");
  const JsPDFCtor = mod.jsPDF || (mod as unknown as { default: typeof mod.jsPDF }).default;
  const doc = new JsPDFCtor({ orientation: "portrait", unit: "mm", format: "a4" });
  const st = styleFor(templateId);

  const avail = PAGE_H - st.padY * 2;

  // One-page fit: pick the largest scale whose content still fits, EXACTLY like
  // the on-screen preview (ResumeShell) does — shrink to fit, but never grow
  // past 1.0. Because the metrics above mirror the preview's CSS, the natural
  // height matches the preview, so the chosen scale (and thus the final font
  // size and spacing) matches too. Binary search because text wrapping makes
  // height a non-linear function of scale.
  const FILL_MIN = 0.5;
  const FILL_MAX = 1.0;
  let scale: number;
  if (render(doc, data, st, FILL_MAX, false) <= avail) {
    scale = FILL_MAX; // content fits at full size (matches the preview's scale-1 cap)
  } else {
    let lo = FILL_MIN, hi = FILL_MAX;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (render(doc, data, st, mid, false) > avail) hi = mid;
      else lo = mid;
    }
    scale = lo; // largest scale that still fits on one page
  }

  render(doc, data, st, scale, true);

  return doc.output("blob");
}
