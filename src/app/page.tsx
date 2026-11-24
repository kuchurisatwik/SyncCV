"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Settings, FileText, CheckCircle2, AlertCircle, Wand2, KeyRound, ChevronLeft, ChevronRight, Sun, Moon, Copy, Check, Info, UploadCloud, LayoutGrid, ChevronDown, Play, Printer, BarChart3, Sparkles, Mail, Eye, ClipboardList, Zap, TrendingUp, ArrowRight, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { extractTextFromPDF } from "@/lib/pdf";
import { exportToDocx } from "@/lib/docx";
import { saveFile } from "@/lib/download";
import { processJobApplication } from "@/lib/gemini";
import { ResumePreview } from "@/components/ResumePreview";
import { ZoomableResume } from "@/components/ZoomableResume";
import { TemplateGallery } from "@/components/TemplateGallery";
import { DEFAULT_TEMPLATE_ID, type TemplateId } from "@/components/resume/templates";

function OnboardingEmpty() {
  const steps = [
    { n: 1, Icon: UploadCloud, title: "Upload Resume", desc: "Drag & drop or browse your PDF file" },
    { n: 2, Icon: ClipboardList, title: "Add Job Description", desc: "Paste the job details" },
    { n: 3, Icon: Zap, title: "Process Application", desc: "Let AI optimize your resume" },
  ];
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 min-h-[480px]">
      <div className="relative mb-8">
        <div className="absolute -inset-6 rounded-[45%] bg-slate-100 dark:bg-slate-800/40 blur-2xl" />
        <div className="relative w-36 h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md p-4 flex flex-col gap-2.5 -rotate-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-1.5 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
          <div className="h-1.5 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-1.5 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-1.5 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-1.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg ring-4 ring-slate-50 dark:ring-slate-950">
          <Eye className="w-6 h-6" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Upload a resume to see the preview.</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">Get started by uploading your PDF resume and adding a job description.</p>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-col items-center gap-2">
            <div className="relative w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <s.Icon className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold flex items-center justify-center">{s.n}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.title}</h3>
            <p className="text-xs text-muted-foreground max-w-[170px]">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Circular score gauge showing a 0-100 value with a colored arc. */
function ScoreGauge({ value, tone }: { value: number; tone: "amber" | "emerald" }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const dash = (pct / 100) * c;
  return (
    <div className="relative w-36 h-36 sm:w-40 sm:h-40">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
        <circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" stroke="currentColor"
          className={`transition-all duration-1000 ease-out ${tone === "emerald" ? "text-emerald-500" : "text-amber-500"}`}
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">{pct}</span>
        <span className="text-xs text-muted-foreground mt-1">/ 100</span>
      </div>
    </div>
  );
}

/** The two score cards (original vs optimized) with the improvement indicator between them. */
function AtsScores({ original, optimized }: { original: number; optimized: number }) {
  const points = optimized - original;
  const pct = original > 0 ? Math.round((points / original) * 100) : 0;
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4">
      {/* Original */}
      <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Original ATS Score</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Before optimization</p>
        <div className="flex justify-center"><ScoreGauge value={original} tone="amber" /></div>
      </div>

      {/* Improvement indicator */}
      <div className="flex md:flex-col items-center justify-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-slate-500 rotate-90 md:rotate-0" />
        </div>
        {points > 0 && (
          <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-center">
            <div className="text-sm font-bold leading-none">+{points}</div>
            <div className="text-[10px] mt-0.5">points</div>
          </div>
        )}
      </div>

      {/* Optimized */}
      <div className="flex-1 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 relative">
        {pct > 0 && (
          <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <TrendingUp className="w-3 h-3" /> +{pct}%
          </span>
        )}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Optimized ATS Score</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">After AI optimization</p>
        <div className="flex justify-center"><ScoreGauge value={optimized} tone="emerald" /></div>
      </div>
    </div>
  );
}

const KEYWORD_TONES = {
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    chip: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40",
  },
} as const;

/** One keyword column (found / missing) with a count badge and expandable chips. */
function KeywordGroup({
  title, tone, icon: Icon, keywords, emptyText, allCovered,
}: {
  title: string;
  tone: keyof typeof KEYWORD_TONES;
  icon: React.ElementType;
  keywords: string[];
  emptyText: string;
  allCovered?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 8;
  const s = KEYWORD_TONES[tone];
  const shown = expanded ? keywords : keywords.slice(0, LIMIT);
  const remaining = keywords.length - shown.length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${s.text}`} />
        <h4 className={`font-medium text-sm ${s.text}`}>{title}</h4>
        <span className={`ml-auto min-w-[1.5rem] text-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>{keywords.length}</span>
      </div>
      {keywords.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {shown.map((kw) => (
            <span key={kw} className={`px-2.5 py-1 text-xs rounded-full font-medium border ${s.chip}`}>{kw}</span>
          ))}
          {remaining > 0 && (
            <button onClick={() => setExpanded(true)} className="px-2.5 py-1 text-xs rounded-full font-medium border border-dashed border-slate-300 dark:border-slate-600 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              +{remaining} more
            </button>
          )}
          {expanded && keywords.length > LIMIT && (
            <button onClick={() => setExpanded(false)} className="px-2.5 py-1 text-xs rounded-full font-medium text-muted-foreground hover:text-foreground transition-colors">
              show less
            </button>
          )}
        </div>
      ) : allCovered ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="w-4 h-4" /> All keywords covered!
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">{emptyText}</span>
      )}
    </div>
  );
}

/** Empty state shown on the ATS Score tab before an optimization has run. */
function AtsScoreEmpty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 min-h-[480px]">
      <div className="relative mb-8">
        <div className="absolute -inset-6 rounded-[45%] bg-slate-100 dark:bg-slate-800/40 blur-2xl" />
        <div className="relative w-28 h-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg ring-4 ring-slate-50 dark:ring-slate-950">
            <Search className="w-5 h-5" />
          </div>
        </div>
        <Sparkles className="absolute -top-2 -left-3 w-5 h-5 text-amber-400" />
        <Sparkles className="absolute top-4 -right-5 w-4 h-4 text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Run optimization to see your ATS results</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">Upload your resume and add a job description to get started.</p>
    </div>
  );
}

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePdfUrl, setResumePdfUrl] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isCustomPromptOpen, setIsCustomPromptOpen] = useState(false);
  
  // Results
  const [optimizedResume, setOptimizedResume] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [keywordData, setKeywordData] = useState<{ companyName?: string; matchedKeywords: string[]; missingKeywords: string[]; matchPercentage: number } | null>(null);
  
  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("original");
  const [hasProcessed, setHasProcessed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [coverLetterCopied, setCoverLetterCopied] = useState(false);
  const [templateId, setTemplateId] = useState<TemplateId>(DEFAULT_TEMPLATE_ID);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Calculate the Post-Optimization Score dynamically
  const displayKeywordData = useMemo(() => {
    if (!keywordData) return null;
    if (!optimizedResume) return { ...keywordData, isOptimizedScore: false };

    const resumeString = JSON.stringify(optimizedResume).toLowerCase();
    
    const newlyFound: string[] = [];
    const stillMissing: string[] = [];
    
    keywordData.missingKeywords.forEach(kw => {
      if (resumeString.includes(kw.toLowerCase())) {
        newlyFound.push(kw);
      } else {
        stillMissing.push(kw);
      }
    });

    const totalKeywords = keywordData.matchedKeywords.length + keywordData.missingKeywords.length;
    const allFound = [...keywordData.matchedKeywords, ...newlyFound];
    const newScore = totalKeywords === 0 ? 0 : Math.round((allFound.length / totalKeywords) * 100);

    return {
      companyName: keywordData.companyName,
      matchedKeywords: allFound,
      missingKeywords: stillMissing,
      matchPercentage: newScore,
      isOptimizedScore: true
    };
  }, [keywordData, optimizedResume]);

  useEffect(() => {
    const savedKey = localStorage.getItem("geminiApiKey");
    if (savedKey) setApiKey(savedKey);
  }, []);

  useEffect(() => {
    const savedTemplate = localStorage.getItem("resumeTemplate") as TemplateId | null;
    if (savedTemplate) setTemplateId(savedTemplate);
  }, []);

  const changeTemplate = (id: TemplateId) => {
    setTemplateId(id);
    localStorage.setItem("resumeTemplate", id);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    localStorage.setItem("geminiApiKey", e.target.value);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResumeFile(file);
    const objectUrl = URL.createObjectURL(file);
    setResumePdfUrl(objectUrl);
    setError("");
    setResumeText("");

    try {
      const text = await extractTextFromPDF(file);
      if (!text || text.trim().length < 20) {
        setError("We couldn't read any text from this PDF. It looks like a scanned or image-only file — please upload a text-based PDF.");
        return;
      }
      setResumeText(text);
      setActiveTab("original");
    } catch (err) {
      console.error("Failed to parse PDF:", err);
      setError("Could not read the uploaded PDF. Please ensure it's a valid, text-based PDF and try again.");
    }
  };

  const validateInputs = () => {
    setError("");
    if (!apiKey || apiKey.trim() === "" || apiKey.includes(" ")) {
      setError("Please provide a valid Gemini API Key (cannot contain spaces).");
      return false;
    }
    if (!resumeText) {
      setError("Please upload your resume.");
      return false;
    }
    if (!jdText.trim()) {
      setError("Please paste the job description.");
      return false;
    }
    return true;
  };

  const handleProcessApplication = async () => {
    if (!validateInputs()) return;
    
    setIsProcessing(true);
    setHasProcessed(true);
    setOptimizedResume(null);
    setCoverLetter(null);
    setKeywordData(null);
    setActiveTab("optimized");
    
    // Auto-scroll to results on mobile devices
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setTimeout(() => {
        document.getElementById('results-area')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    
    try {
      const response = await processJobApplication(apiKey, resumeText, jdText);
      
      setKeywordData(response.keywordAnalysis);
      setOptimizedResume(response.optimizedResume);
      setCoverLetter(response.coverLetter);
      
    } catch (err: any) {
      console.error("Processing failed:", err);
      setError(err.message || "Failed to process application. Please check your API key and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCoverLetter = async () => {
    if (!coverLetter) return;
    const plainText = coverLetter
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#+\s*/gm, '')
      .replace(/^>\s*/gm, '')
      .replace(/`/g, '')
      .trim();

    const markCopied = () => {
      setCoverLetterCopied(true);
      setTimeout(() => setCoverLetterCopied(false), 2000);
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(plainText);
        markCopied();
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch {
      // Fallback for non-secure contexts or older browsers
      try {
        const ta = document.createElement("textarea");
        ta.value = plainText;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        markCopied();
      } catch {
        alert("Could not copy to clipboard. Please select and copy the text manually.");
      }
    }
  };

  const downloadCoverLetterPdf = async () => {
    if (!coverLetter) {
      alert("Please generate the Cover Letter first before downloading.");
      return;
    }

    try {
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const marginX = 20;   // mm
      const marginY = 22;   // mm
      const pageHeight = 297;
      const maxWidth = 210 - marginX * 2;
      const lineHeight = 6; // mm

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      const stripMarkdown = (s: string) =>
        s.replace(/\*\*(.*?)\*\*/g, '$1')
         .replace(/\*(.*?)\*/g, '$1')
         .replace(/^#+\s*/gm, '')
         .replace(/^>\s*/gm, '')
         .replace(/`/g, '');

      let y = marginY;
      const paragraphs = coverLetter.replace(/\r\n/g, '\n').split(/\n{2,}/);

      paragraphs.forEach((para) => {
        stripMarkdown(para).split('\n').forEach((raw) => {
          const text = raw.trim();
          if (!text) return;
          const wrapped = pdf.splitTextToSize(text, maxWidth) as string[];
          wrapped.forEach((line) => {
            if (y > pageHeight - marginY) {
              pdf.addPage();
              y = marginY;
            }
            pdf.text(line, marginX, y);
            y += lineHeight;
          });
        });
        y += lineHeight * 0.7; // extra spacing between paragraphs
      });

      const personName = (optimizedResume?.basics?.name || "Cover_Letter").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
      const company = displayKeywordData?.companyName ? `_${displayKeywordData.companyName.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
      await saveFile(pdf.output('blob'), `${personName}${company}_Cover_Letter.pdf`);
    } catch (error: any) {
      console.error("Failed to generate cover letter PDF:", error);
      alert(`Failed to generate cover letter PDF: ${error.message}.`);
    }
  };

  const downloadPdf = async () => {
    if (activeTab === "cover-letter") {
      await downloadCoverLetterPdf();
      return;
    }

    if (activeTab !== "optimized") {
      alert("Open the Optimized Resume or Cover Letter tab to download.");
      return;
    }

    try {
      // Text-based, ATS-friendly PDF (real selectable text + clickable links),
      // rendered from the resume data and the selected template.
      const { buildResumeBlob } = await import('@/lib/resumePdf');
      const blob = await buildResumeBlob(optimizedResume, templateId);

      const personName = (optimizedResume?.basics?.name || "Resume").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
      const company = displayKeywordData?.companyName ? `_${displayKeywordData.companyName.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
      await saveFile(blob, `${personName}${company}.pdf`);
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      alert(`Failed to generate PDF: ${error.message}.`);
    }
  };


  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 print:block print:h-auto print:bg-white">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 no-print">
        {/* Row 1: Logo + Action Buttons */}
        <div className="px-4 py-3 flex flex-row justify-between items-center">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">ResumeAI</h1>
              <p className="text-[10px] leading-tight text-muted-foreground">ATS Optimizer</p>
            </div>
          </div>

          {/* Desktop-only nav (inline with logo) */}
          <TabsList className="hidden md:flex justify-center shrink-0 h-auto">
            <TabsTrigger value="original" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Original Resume</TabsTrigger>
            <TabsTrigger value="score" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> ATS Score</TabsTrigger>
            <TabsTrigger value="optimized" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Optimized Resume</TabsTrigger>
            <TabsTrigger value="cover-letter" className="gap-1.5"><Mail className="w-3.5 h-3.5" /> Cover Letter</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={toggleDarkMode} aria-label="Toggle dark mode">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="default" size="sm" onClick={downloadPdf} className="gap-1.5 px-3 h-9 rounded-lg" disabled={!optimizedResume && !coverLetter}>
              <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Print PDF</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Mobile-only navigation tabs */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 px-2 py-1">
          <TabsList className="flex w-full overflow-x-auto justify-start no-scrollbar h-auto">
            <TabsTrigger value="original" className="gap-1.5 whitespace-nowrap"><FileText className="w-3.5 h-3.5" /> Original Resume</TabsTrigger>
            <TabsTrigger value="score" className="gap-1.5 whitespace-nowrap"><BarChart3 className="w-3.5 h-3.5" /> ATS Score</TabsTrigger>
            <TabsTrigger value="optimized" className="gap-1.5 whitespace-nowrap"><Sparkles className="w-3.5 h-3.5" /> Optimized Resume</TabsTrigger>
            <TabsTrigger value="cover-letter" className="gap-1.5 whitespace-nowrap"><Mail className="w-3.5 h-3.5" /> Cover Letter</TabsTrigger>
          </TabsList>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-auto md:overflow-hidden no-scrollbar print:block print:overflow-visible">
        {/* Left Sidebar */}
        <aside className={`md:border-r border-b md:border-b-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col no-print transition-all duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'w-full md:w-[450px]' : 'w-0 opacity-0 overflow-hidden border-r-0 border-b-0'}`}>
          <div className="w-full md:w-[450px] md:h-full flex flex-col overflow-hidden">
            <div className="p-4 flex flex-col flex-1 gap-4 overflow-y-auto custom-scrollbar">
            
            {/* API Key */}
            <div className="space-y-1.5 shrink-0">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Gemini API Key
              </Label>
              <div className="relative">
                <Input 
                  id="api-key" 
                  type="password" 
                  value={apiKey} 
                  onChange={handleApiKeyChange}
                  placeholder="Enter your Gemini API key..." 
                  className="text-xs pr-9"
                />
                <Info className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <Separator className="shrink-0" />

            {/* Resume Upload */}
            <div className="space-y-1.5 shrink-0">
              <Label className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-muted-foreground" />
                Upload Resume (PDF)
              </Label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer relative">
                <Input 
                  type="file" 
                  accept=".pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-2 text-sm pointer-events-none">
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  {resumeFile ? (
                    <span className="font-medium text-primary break-all">{resumeFile.name}</span>
                  ) : (
                    <>
                      <p className="font-medium text-slate-700 dark:text-slate-200">Drag &amp; drop your PDF here</p>
                      <p className="text-xs text-muted-foreground">or <span className="text-blue-600 dark:text-blue-400 font-medium">click to browse</span></p>
                      <p className="text-[11px] text-muted-foreground">Supports PDF files only • Max size: 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Resume Template */}
            <div className="space-y-1.5 shrink-0">
              <Label className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                Resume Template
              </Label>
              <TemplateGallery value={templateId} onChange={changeTemplate} />
            </div>

            {/* Job Description */}
            <div className="space-y-1.5 shrink-0">
              <Label htmlFor="jd" className="flex items-center gap-2 shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Job Description
              </Label>
              <Textarea 
                id="jd" 
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job description here..."
                className="h-[240px] min-h-[120px] overflow-y-auto custom-scrollbar text-sm resize-y"
              />
            </div>

            {/* Advanced Settings */}
            <div className="space-y-2 shrink-0">
              <button 
                onClick={() => setIsCustomPromptOpen(!isCustomPromptOpen)}
                className="flex items-center justify-between w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  AI Instructions <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCustomPromptOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCustomPromptOpen && (
                <Textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific instructions for the AI (e.g. emphasize leadership, target a specific role, keep it concise)..."
                  className="min-h-[140px] text-xs mt-2"
                />
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="shrink-0 pt-1">
              <Button 
                className="w-full font-semibold gap-2" 
                size="lg"
                onClick={handleProcessApplication}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing Application (5-10s)..." : <><Play className="w-4 h-4 fill-current" /> Process Application</>}
              </Button>
            </div>
            
          </div>
        </div>
      </aside>

        {/* Right Content Area */}
        <div id="results-area" className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 print:block print:bg-white relative min-h-[600px] md:min-h-0">
          
          {/* Floating Sidebar Toggle */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`absolute top-1/2 -translate-y-1/2 z-50 h-8 w-8 rounded-full shadow-md bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 no-print transition-all duration-300 hidden md:flex ${isSidebarOpen ? '-left-4' : 'left-4'}`}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>

          <div className="flex-1 flex flex-col relative print:block print:static">
            <div className="flex-1 overflow-auto relative p-6 custom-scrollbar print-area print:overflow-visible print:block print:static print:p-0">
              
              <TabsContent value="original" className="h-full m-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col">
                {resumePdfUrl ? (
                  <object data={resumePdfUrl} type="application/pdf" className="w-full h-full rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="p-6 text-center text-muted-foreground">
                      Unable to display PDF inline. <a href={resumePdfUrl} target="_blank" className="text-primary hover:underline">Download</a> instead.
                    </div>
                  </object>
                ) : resumeText ? (
                  <div className="flex-1 w-full overflow-y-auto p-6 bg-white dark:bg-slate-950 font-mono text-sm whitespace-pre-wrap custom-scrollbar rounded-md border border-slate-200 dark:border-slate-800">
                    {resumeText}
                  </div>
                ) : (
                  <OnboardingEmpty />
                )}
              </TabsContent>

              <TabsContent value="score" className="h-full m-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden flex-col print:block print:h-auto">
                <div className="flex-1 overflow-y-auto px-4 pt-4 md:px-8 md:pt-6 custom-scrollbar print:overflow-visible print:p-0">
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground min-h-[480px]">
                      <Wand2 className="w-8 h-8 animate-pulse text-primary" />
                      <p>Analyzing your resume against the job description...</p>
                    </div>
                  ) : keywordData ? (
                    <div className="flex flex-col gap-5 pb-8 max-w-5xl mx-auto w-full">
                      <AtsScores
                        original={keywordData.matchPercentage}
                        optimized={displayKeywordData?.matchPercentage ?? keywordData.matchPercentage}
                      />

                      {/* Keyword Analysis */}
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                        <div className="flex items-center gap-2 mb-1">
                          <Search className="w-4 h-4 text-slate-500" />
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Keyword Analysis</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-5">Keywords found and missing from your resume</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <KeywordGroup
                            title="Found Keywords"
                            tone="emerald"
                            icon={CheckCircle2}
                            keywords={keywordData.matchedKeywords ?? []}
                            emptyText="No keywords matched."
                          />
                          <KeywordGroup
                            title="Originally Missing"
                            tone="rose"
                            icon={AlertCircle}
                            keywords={keywordData.missingKeywords ?? []}
                            emptyText="Nothing was missing."
                          />
                          <KeywordGroup
                            title="Still Missing"
                            tone="amber"
                            icon={AlertCircle}
                            keywords={displayKeywordData?.missingKeywords ?? []}
                            emptyText="Run optimization to see results."
                            allCovered={displayKeywordData?.isOptimizedScore && (displayKeywordData?.missingKeywords?.length ?? 0) === 0}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AtsScoreEmpty />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="optimized" className="h-full m-0 mt-0 data-[state=active]:block data-[state=inactive]:hidden print:block print:h-auto relative">
                {isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Wand2 className="w-8 h-8 animate-pulse text-primary" />
                    <p>Processing job application (this takes about 5-10s)...</p>
                    <p className="text-sm animate-subtle-blink">Retry, If response is not better</p>
                  </div>
                ) : optimizedResume ? (
                  <>
                    <ZoomableResume>
                      <ResumePreview data={optimizedResume} templateId={templateId} />
                    </ZoomableResume>
                    <div className="absolute top-3 inset-x-0 z-30 no-print flex justify-center px-3 pointer-events-none">
                      <div className="pointer-events-auto max-w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-full p-1 shadow-md">
                        <TemplateGallery value={templateId} onChange={changeTemplate} variant="pills" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                    Click "Process Application" to generate.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cover-letter" className="h-full m-0 mt-0 data-[state=active]:block data-[state=inactive]:hidden print:block print:h-auto relative">
                <div className="absolute inset-0 w-full h-full overflow-y-auto p-4 md:p-8 custom-scrollbar print:static print:h-auto print:overflow-visible print:p-0">
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground min-h-[400px]">
                      <Wand2 className="w-8 h-8 animate-pulse text-primary" />
                      <p>Processing job application (this takes about 5-10s)...</p>
                      <p className="text-sm animate-subtle-blink">Retry, If response is not better</p>
                    </div>
                  ) : coverLetter ? (
                    <div className="max-w-3xl mx-auto">
                      <div className="flex justify-end mb-2 no-print">
                        <Button variant="outline" size="sm" onClick={handleCopyCoverLetter} className="gap-1.5 h-8">
                          {coverLetterCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {coverLetterCopied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-10 shadow-sm print:shadow-none print:border-none print:p-0">
                        <div className="prose dark:prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-semibold">
                          <ReactMarkdown>
                            {coverLetter}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground italic min-h-[400px]">
                      Click "Process Application" to generate.
                    </div>
                  )}
                </div>
              </TabsContent>
              
            </div>
          </div>
        </div>
      </main>
      
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; color: black; }
          .no-print { display: none !important; }
          .print-area { display: block !important; padding: 0 !important; overflow: visible !important; }
          .prose { max-width: 100% !important; }
          .resume-zoom-sizer, .resume-zoom-layer { transform: none !important; width: auto !important; height: auto !important; }
        }
      `}} />
    </Tabs>
  );
}
