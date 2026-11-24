import React from "react";

/** Font stack for the resume body — the same families the PDF export renders
 *  via jsPDF's Helvetica — so the on-screen preview matches the downloaded PDF. */
export const RESUME_SANS = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

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
  certifications?: Array<{ name: string; date: string; issuer: string }>;
  achievements?: string[];
}

export interface TemplateProps {
  data: ResumeData;
}

export function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const t = url.trim();
  if (!t) return undefined;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return t;
  // Only treat it as a link if it looks like a real domain (has a dot + TLD).
  // This prevents placeholder text like "GitHub" from becoming a broken
  // "https://GitHub" link, so links are either real/working or shown as text.
  if (/^[\w@][\w.-]*\.[a-z]{2,}(\/.*)?$/i.test(t)) return `https://${t}`;
  return undefined;
}

export interface ContactItem {
  label: string;
  href?: string;
  external?: boolean;
}

export function getContacts(b?: ResumeData["basics"]): ContactItem[] {
  const items: ContactItem[] = [];
  if (!b) return items;
  if (b.phone) items.push({ label: b.phone });
  if (b.email) items.push({ label: b.email, href: `mailto:${b.email}` });
  const gh = normalizeUrl(b.github);
  if (gh) items.push({ label: "GitHub", href: gh, external: true });
  const li = normalizeUrl(b.linkedin);
  if (li) items.push({ label: "LinkedIn", href: li, external: true });
  const pf = normalizeUrl(b.portfolio);
  if (pf) items.push({ label: "Portfolio", href: pf, external: true });
  if (b.location) items.push({ label: b.location });
  return items;
}

/** Renders a contact line; styling (separator, link color, wrapper) is supplied by each template. */
export function ContactList({
  items,
  separator,
  className,
  linkClass = "",
}: {
  items: ContactItem[];
  separator: React.ReactNode;
  className?: string;
  linkClass?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={className}>
      {items.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="opacity-40">{separator}</span>}
          {c.href ? (
            <a
              href={c.href}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`hover:underline ${c.external ? linkClass : ""}`}
            >
              {c.label}
            </a>
          ) : (
            <span>{c.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Per-template styling hooks. The section CONTENT is shared; only these classes change. */
export interface Theme {
  root: string;
  rootStyle?: React.CSSProperties;
  section: string;
  heading: string;
  itemTitle: string;
  date: string;
  subline: string;
  sublineSep: string;
  body: string;
  bullet: string;
  link: string;
  skillCat: string;
}

/**
 * The shared body. Every template renders the SAME sections with the SAME data
 * (so content and length never change between templates) — only the `theme`
 * classes differ. The page header is rendered separately by each template.
 */
export function ResumeBody({ data, theme }: { data: ResumeData; theme: Theme }) {
  const H = ({ children }: { children: React.ReactNode }) => <h2 className={theme.heading}>{children}</h2>;

  return (
    <>
      {data.basics?.summary && (
        <section className={theme.section}>
          <H>Professional Summary</H>
          <p className={theme.body}>{data.basics.summary}</p>
        </section>
      )}

      {data.skills && data.skills.length > 0 && (
        <section className={theme.section}>
          <H>Technical Skills</H>
          <div className="space-y-1">
            {data.skills.map((g, i) => (
              <div key={i}>
                <span className={theme.skillCat}>{g.category}:</span> {g.keywords?.join(", ")}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.experience && data.experience.length > 0 && (
        <section className={theme.section}>
          <H>Professional Experience</H>
          <div className="space-y-2.5">
            {data.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className={theme.itemTitle}>{exp.position}</h3>
                  <span className={theme.date}>{exp.startDate} - {exp.endDate}</span>
                </div>
                <div className={theme.subline}>{[exp.company, exp.location].filter(Boolean).join(theme.sublineSep)}</div>
                <ul className={theme.bullet}>
                  {exp.highlights?.map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.projects && data.projects.length > 0 && (
        <section className={theme.section}>
          <H>Projects</H>
          <div className="space-y-2.5">
            {data.projects.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className={theme.itemTitle}>{p.name}</h3>
                  {normalizeUrl(p.url) && (
                    <a href={normalizeUrl(p.url)} target="_blank" rel="noopener noreferrer" className={`whitespace-nowrap ${theme.link}`}>
                      GitHub
                    </a>
                  )}
                </div>
                {p.technologies && p.technologies.length > 0 && (
                  <div className={theme.subline}>{p.technologies.join(theme.sublineSep)}</div>
                )}
                {p.description && <p className="opacity-80">{p.description}</p>}
                <ul className={`${theme.bullet} mt-0.5`}>
                  {p.highlights?.map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section className={theme.section}>
          <H>Education</H>
          <div className="space-y-1">
            {data.education.map((edu, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className={theme.itemTitle}>{edu.studyType}{edu.area ? ` (${edu.area})` : ""}</h3>
                  <span className={theme.date}>{edu.startDate} - {edu.endDate}</span>
                </div>
                <div className={theme.subline}>{edu.institution}{edu.gpa ? ` — GPA: ${edu.gpa}` : ""}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <section className={theme.section}>
          <H>Certifications</H>
          <ul className={theme.bullet}>
            {data.certifications.map((c, i) => (
              <li key={i}>
                <span className={theme.skillCat}>{c.name}</span>{c.issuer ? `, ${c.issuer}` : ""} {c.date && `(${c.date})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.achievements && data.achievements.length > 0 && (
        <section className={theme.section}>
          <H>Achievements</H>
          <ul className={theme.bullet}>
            {data.achievements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </section>
      )}
    </>
  );
}

/** Classic layout shared as the base for every template (same margins + structure). */
export function makeClassicTheme(overrides: Partial<Theme> = {}): Theme {
  return {
    root: "px-[44px] py-[46px] text-[12px] leading-[1.45] text-black",
    section: "mb-3",
    heading: "text-[12px] font-bold uppercase tracking-wide border-b border-slate-400 pb-0.5 mb-1.5",
    itemTitle: "font-bold",
    date: "text-[11px] font-bold whitespace-nowrap",
    subline: "italic",
    sublineSep: " | ",
    body: "leading-[1.4] text-justify",
    bullet: "list-disc list-outside pl-4 space-y-1 text-justify marker:text-black",
    link: "text-blue-700 print:text-black",
    skillCat: "font-bold",
    ...overrides,
  };
}

/** Classic's centered header (name, headline, pipe-separated contacts). Only colors are themeable. */
export function CenteredHeader({
  data,
  nameClass = "",
  headlineClass = "text-slate-700",
  linkClass = "text-blue-700 print:text-black",
}: {
  data: ResumeData;
  nameClass?: string;
  headlineClass?: string;
  linkClass?: string;
}) {
  const b = data.basics ?? ({} as ResumeData["basics"]);
  return (
    <header className="text-center mb-3">
      <h1 className={`text-[22px] font-bold uppercase tracking-wide leading-tight ${nameClass}`}>{b.name || "Name"}</h1>
      {b.headline && <p className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${headlineClass}`}>{b.headline}</p>}
      <ContactList
        items={getContacts(b)}
        separator="|"
        className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-800"
        linkClass={linkClass}
      />
    </header>
  );
}
