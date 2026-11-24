"use client";

import { ResumeShell } from "./resume/ResumeShell";
import { getTemplate, type TemplateId } from "./resume/templates";
import type { ResumeData } from "./resume/shared";

// Re-export so existing imports (`@/components/ResumePreview`) keep working.
export type { ResumeData };

export function ResumePreview({ data, templateId }: { data: ResumeData; templateId?: TemplateId }) {
  if (!data) return null;
  const { Component } = getTemplate(templateId);
  return (
    <ResumeShell>
      <Component data={data} />
    </ResumeShell>
  );
}
