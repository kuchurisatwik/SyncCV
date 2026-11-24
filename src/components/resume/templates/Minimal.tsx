import { ContactList, getContacts, ResumeBody, type ResumeData, type TemplateProps, type Theme } from "../shared";

// Minimal: clean, left-aligned, grayscale with light hairline rules. Narrow side
// margins (matching Executive) and readable headings so it reads solid, not sparse.
const theme: Theme = {
  root: "px-[44px] py-[46px] font-sans text-[12px] leading-[1.5] text-slate-800",
  section: "mb-3",
  heading: "text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500 border-b border-slate-200 pb-0.5 mb-1.5",
  itemTitle: "font-semibold text-slate-900",
  date: "text-[11px] text-slate-500 whitespace-nowrap",
  subline: "text-[11px] text-slate-600",
  sublineSep: "  ·  ",
  body: "leading-[1.5]",
  bullet: "list-disc list-outside pl-4 space-y-1 marker:text-slate-400",
  link: "text-slate-700 underline decoration-slate-300",
  skillCat: "font-semibold text-slate-900",
};

export function Minimal({ data }: TemplateProps) {
  const b = data.basics ?? ({} as ResumeData["basics"]);
  return (
    <div className={theme.root}>
      <header className="mb-4">
        <h1 className="text-[24px] font-semibold tracking-tight text-slate-900 leading-none">{b.name || "Name"}</h1>
        {b.headline && <p className="text-[12px] text-slate-600 mt-1">{b.headline}</p>}
        <ContactList
          items={getContacts(b)}
          separator="·"
          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] text-slate-600"
          linkClass="text-slate-700"
        />
      </header>
      <ResumeBody data={data} theme={theme} />
    </div>
  );
}
