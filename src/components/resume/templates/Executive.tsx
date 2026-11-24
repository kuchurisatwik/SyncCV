import { ContactList, getContacts, ResumeBody, type ResumeData, type TemplateProps, type Theme } from "../shared";

// Executive: serif typeface, centered name with a divider, letter-spaced headings. Balanced margins.
const theme: Theme = {
  root: "px-[44px] py-[50px] text-[12px] leading-[1.5] text-black",
  rootStyle: { fontFamily: 'Georgia, Cambria, "Times New Roman", serif' },
  section: "mb-3",
  heading: "text-[12px] font-bold uppercase tracking-[0.18em] text-slate-800 border-b border-slate-300 pb-1 mb-2",
  itemTitle: "font-bold",
  date: "text-[11px] text-slate-600 whitespace-nowrap",
  subline: "italic text-slate-700",
  sublineSep: " | ",
  body: "leading-[1.55] text-justify",
  bullet: "list-disc list-outside pl-4 space-y-1 text-justify marker:text-slate-500",
  link: "underline text-slate-700",
  skillCat: "font-bold",
};

export function Executive({ data }: TemplateProps) {
  const b = data.basics ?? ({} as ResumeData["basics"]);
  return (
    <div className={theme.root} style={theme.rootStyle}>
      <header className="text-center mb-4">
        <h1 className="text-[27px] font-bold tracking-[0.04em] leading-tight">{b.name || "Name"}</h1>
        {b.headline && <p className="text-[12px] italic tracking-wide text-slate-600 mt-1">{b.headline}</p>}
        <div className="mx-auto mt-2 h-px w-16 bg-slate-400" />
        <ContactList
          items={getContacts(b)}
          separator="•"
          className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-0.5 mt-2 text-[11px] text-slate-700"
          linkClass="text-slate-700"
        />
      </header>
      <ResumeBody data={data} theme={theme} />
    </div>
  );
}
