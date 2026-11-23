"use client";

import React, { useLayoutEffect, useRef, useState } from 'react';

export interface ResumeData {
  basics: {
    name: string;
    headline?: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    summary: string;
  };
  skills: Array<{ category: string; keywords: string[] }>;
  experience: Array<{
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    description?: string;
    url?: string;
    technologies: string[];
    highlights: string[];
  }>;
  education: Array<{
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }>;
  certifications?: Array<{
    name: string;
    date: string;
    issuer: string;
  }>;
  achievements?: string[];
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `https://${url}`;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12px] font-bold uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-1.5">
      {children}
    </h2>
  );
}

const linkClass = "hover:underline text-blue-700 print:text-black";

export function ResumePreview({ data }: { data: ResumeData }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Auto-fit: if the content is taller than the usable page area, scale it down
  // just enough to fit inside the margins. Never scale up (keeps text at normal
  // size for short resumes). This guarantees nothing is ever clipped at the bottom.
  useLayoutEffect(() => {
    const area = areaRef.current;
    const content = contentRef.current;
    if (!area || !content) return;

    const measure = () => {
      const available = area.clientHeight;
      const natural = content.scrollHeight; // layout height, unaffected by the transform
      if (!available || !natural) return;
      const next = natural > available ? Math.max(available / natural, 0.5) : 1;
      setScale((prev) => (Math.abs(prev - next) > 0.003 ? next : prev));
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(area);
    ro.observe(content);

    let cancelled = false;
    const fonts = (typeof document !== "undefined" ? (document as Document & { fonts?: FontFaceSet }).fonts : undefined);
    if (fonts?.ready) {
      fonts.ready.then(() => { if (!cancelled) measure(); }).catch(() => {});
    }

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [data]);

  if (!data) return null;

  const b = data.basics || ({} as ResumeData["basics"]);

  const contacts = [
    b.phone ? <span key="phone">{b.phone}</span> : null,
    b.email ? <a key="email" href={`mailto:${b.email}`} className="hover:underline">{b.email}</a> : null,
    b.github ? <a key="github" href={normalizeUrl(b.github)} target="_blank" rel="noopener noreferrer" className={linkClass}>GitHub</a> : null,
    b.linkedin ? <a key="linkedin" href={normalizeUrl(b.linkedin)} target="_blank" rel="noopener noreferrer" className={linkClass}>LinkedIn</a> : null,
    b.portfolio ? <a key="portfolio" href={normalizeUrl(b.portfolio)} target="_blank" rel="noopener noreferrer" className={linkClass}>Portfolio</a> : null,
    b.location ? <span key="location">{b.location}</span> : null,
  ].filter(Boolean);

  return (
    <div id="resume-preview-content" className="bg-white text-black px-[49px] py-[45px] font-sans w-[794px] h-[1123px] overflow-hidden flex flex-col mx-auto shadow-md border border-slate-200 text-[12px] leading-[1.45] print:shadow-none print:border-0">
      <div ref={areaRef} className="flex-1 min-h-0 overflow-hidden">
        <div ref={contentRef} style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
          {/* Header */}
          <header className="text-center mb-3">
            <h1 className="text-[22px] font-bold uppercase tracking-wide leading-tight">{b.name || "Name"}</h1>
            {b.headline && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mt-1">{b.headline}</p>
            )}
            {contacts.length > 0 && (
              <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-800">
                {contacts.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-slate-400">|</span>}
                    {c}
                  </React.Fragment>
                ))}
              </div>
            )}
          </header>

          {/* Summary */}
          {b.summary && (
            <section className="mb-3">
              <SectionHeading>Professional Summary</SectionHeading>
              <p className="leading-[1.4] text-justify">{b.summary}</p>
            </section>
          )}

          {/* Skills */}
          {data.skills && data.skills.length > 0 && (
            <section className="mb-3">
              <SectionHeading>Technical Skills</SectionHeading>
              <div className="space-y-1">
                {data.skills.map((skillGroup, idx) => (
                  <div key={idx}>
                    <span className="font-bold">{skillGroup.category}:</span> {skillGroup.keywords?.join(", ")}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {data.experience && data.experience.length > 0 && (
            <section className="mb-3">
              <SectionHeading>Professional Experience</SectionHeading>
              <div className="space-y-2.5">
                {data.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="font-bold">{exp.position}</h3>
                      <span className="text-[11px] font-bold whitespace-nowrap">{exp.startDate} - {exp.endDate}</span>
                    </div>
                    <div className="italic font-semibold mb-0.5">
                      {[exp.company, exp.location].filter(Boolean).join(" | ")}
                    </div>
                    <ul className="list-disc list-outside pl-4 space-y-1 text-justify marker:text-black">
                      {exp.highlights?.map((hl, hIdx) => (
                        <li key={hIdx}>{hl}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <section className="mb-3">
              <SectionHeading>Projects</SectionHeading>
              <div className="space-y-2.5">
                {data.projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="font-bold">{proj.name}</h3>
                      {proj.url && (
                        <a href={normalizeUrl(proj.url)} target="_blank" rel="noopener noreferrer" className={`text-[11px] whitespace-nowrap ${linkClass}`}>GitHub</a>
                      )}
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="italic">{proj.technologies.join(" | ")}</div>
                    )}
                    {proj.description && <p className="text-slate-700">{proj.description}</p>}
                    <ul className="list-disc list-outside pl-4 space-y-1 text-justify marker:text-black mt-0.5">
                      {proj.highlights?.map((hl, hIdx) => (
                        <li key={hIdx}>{hl}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {data.education && data.education.length > 0 && (
            <section className="mb-3">
              <SectionHeading>Education</SectionHeading>
              <div className="space-y-1">
                {data.education.map((edu, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="font-bold">
                        {edu.studyType}{edu.area ? ` (${edu.area})` : ""}
                      </h3>
                      <span className="text-[11px] font-bold whitespace-nowrap">{edu.startDate} - {edu.endDate}</span>
                    </div>
                    <div className="italic">
                      {edu.institution}{edu.gpa ? ` — GPA: ${edu.gpa}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <section className="mb-3">
              <SectionHeading>Certifications</SectionHeading>
              <ul className="list-disc list-outside pl-4 space-y-1 marker:text-black">
                {data.certifications.map((cert, idx) => (
                  <li key={idx}>
                    <span className="font-bold">{cert.name}</span>{cert.issuer ? `, ${cert.issuer}` : ""} {cert.date && `(${cert.date})`}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Achievements */}
          {data.achievements && data.achievements.length > 0 && (
            <section className="mb-3">
              <SectionHeading>Achievements</SectionHeading>
              <ul className="list-disc list-outside pl-4 space-y-1 text-justify marker:text-black">
                {data.achievements.map((achievement, idx) => (
                  <li key={idx}>{achievement}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
