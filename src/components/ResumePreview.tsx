import React from 'react';

export interface ResumeData {
  basics: {
    name: string;
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

export function ResumePreview({ data }: { data: ResumeData }) {
  if (!data) return null;

  return (
    <div className="bg-white text-black p-6 md:p-8 font-serif w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-md border border-slate-200 print:shadow-none print:border-0 print:px-8 print:py-6 print:max-w-none print:min-h-0">
      {/* Header */}
      <header className="text-center mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">{data.basics?.name || "Name"}</h1>
        <div className="text-xs flex flex-wrap justify-center gap-x-3 gap-y-1 text-slate-800">
          {data.basics?.email && <a href={`mailto:${data.basics.email}`} className="hover:underline">{data.basics.email}</a>}
          {data.basics?.phone && <a href={`tel:${data.basics.phone}`} className="hover:underline">{data.basics.phone}</a>}
          {data.basics?.location && <span>{data.basics.location}</span>}
          {data.basics?.linkedin && (
            <a href={data.basics.linkedin.startsWith("http") ? data.basics.linkedin : `https://${data.basics.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-700 print:text-slate-800">
              LinkedIn
            </a>
          )}
          {data.basics?.github && (
            <a href={data.basics.github.startsWith("http") ? data.basics.github : `https://${data.basics.github}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-700 print:text-slate-800">
              GitHub
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {data.basics?.summary && (
        <section className="mb-2">
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1 tracking-widest">Professional Summary</h2>
          <p className="text-xs leading-tight text-justify">{data.basics.summary}</p>
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section className="mb-2">
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1 tracking-widest">Technical Skills</h2>
          <div className="text-xs space-y-0.5">
            {data.skills.map((skillGroup, idx) => (
              <div key={idx} className="leading-tight">
                <span className="font-bold">{skillGroup.category}:</span> {skillGroup.keywords?.join(", ")}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <section className="mb-2">
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1 tracking-widest">Professional Experience</h2>
          <div className="space-y-2">
            {data.experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-xs">{exp.position}</h3>
                  <span className="text-[11px] font-medium">{exp.startDate} - {exp.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="italic text-[11px]">{exp.company}</span>
                  <span className="italic text-[11px]">{exp.location}</span>
                </div>
                <ul className="list-disc list-outside ml-4 text-xs space-y-0.5 leading-tight text-justify">
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
        <section className="mb-2">
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1 tracking-widest">Projects</h2>
          <div className="space-y-2">
            {data.projects.map((proj, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-xs">
                    {proj.name} {proj.technologies?.length > 0 && <span className="font-normal italic">| {proj.technologies.join(", ")}</span>}
                  </h3>
                </div>
                {proj.description && <p className="text-xs mb-0.5 leading-tight">{proj.description}</p>}
                <ul className="list-disc list-outside ml-4 text-xs space-y-0.5 leading-tight text-justify">
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
        <section className="mb-2">
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1 tracking-widest">Education</h2>
          <div className="space-y-1">
            {data.education.map((edu, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-xs">{edu.institution}</h3>
                  <span className="text-[11px] font-medium">{edu.startDate} - {edu.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="italic text-[11px]">{edu.studyType} in {edu.area}</span>
                  {edu.gpa && <span className="text-[11px]">GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-2">
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1 tracking-widest">Certifications</h2>
          <ul className="list-disc list-outside ml-4 text-xs space-y-0.5 leading-tight">
            {data.certifications.map((cert, idx) => (
              <li key={idx}>
                <span className="font-bold">{cert.name}</span>, {cert.issuer} {cert.date && `(${cert.date})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <section className="mb-2">
          <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1 tracking-widest">Achievements</h2>
          <ul className="list-disc list-outside ml-4 text-xs space-y-0.5 leading-tight text-justify">
            {data.achievements.map((achievement, idx) => (
              <li key={idx}>{achievement}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
