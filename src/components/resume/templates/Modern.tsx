import { ContactList, getContacts, ResumeBody, type ResumeData, type TemplateProps, type Theme } from "../shared";

const ACCENT = "#1e3a8a"; // navy

// Modern: left-aligned name over a navy rule, navy section headings. Balanced margins.
const theme: Theme = {
  root: "px-[44px] py-[44px] font-sans text-[12px] leading-[1.5] text-slate-800",
  section: "mb-3",
  heading: "text-[12px] font-bold uppercase tracking-wider text-[#1e3a8a] border-b-2 border-blue-200 pb-0.5 mb-1.5",
  itemTitle: "font-bold text-slate-900",
  date: "text-[11px] font-semibold text-slate-500 whitespace-nowrap",
  subline: "text-[11px] font-medium text-slate-600",
  sublineSep: "  •  ",
  body: "leading-[1.5]",
  bullet: "list-disc list-outside pl-4 space-y-1 marker:text-[#1e3a8a]",
  link: "text-[#1e3a8a]",
  skillCat: "font-bold text-slate-900",
};

export function Modern({ data }: TemplateProps) {
  const b = data.basics ?? ({} as ResumeData["basics"]);
  return (
    <div className={theme.root}>
      <header className="mb-3 border-b-2 pb-2" style={{ borderColor: ACCENT }}>
        <h1 className="text-[24px] font-extrabold tracking-tight leading-none" style={{ color: ACCENT }}>{b.name || "Name"}</h1>
        {b.headline && <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 mt-1">{b.headline}</p>}
        <ContactList
          items={getContacts(b)}
          separator="•"
          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] text-slate-600"
          linkClass="text-[#1e3a8a]"
        />
      </header>
      <ResumeBody data={data} theme={theme} />
    </div>
  );
}
