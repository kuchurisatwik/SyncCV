import type { ComponentType } from "react";
import type { TemplateProps } from "../shared";
import { Classic } from "./Classic";
import { Modern } from "./Modern";
import { Executive } from "./Executive";
import { Minimal } from "./Minimal";

export type TemplateId = "classic" | "modern" | "executive" | "minimal";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  Component: ComponentType<TemplateProps>;
  thumb: { align: "center" | "left"; accent: string; light?: boolean; serif?: boolean };
}

export const TEMPLATES: TemplateMeta[] = [
  { id: "classic", name: "Classic", Component: Classic, thumb: { align: "center", accent: "#111827" } },
  { id: "modern", name: "Modern", Component: Modern, thumb: { align: "left", accent: "#1e3a8a" } },
  { id: "executive", name: "Executive", Component: Executive, thumb: { align: "center", accent: "#334155", serif: true } },
  { id: "minimal", name: "Minimal", Component: Minimal, thumb: { align: "left", accent: "#64748b", light: true } },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = "classic";

export function getTemplate(id?: string): TemplateMeta {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
