"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Settings, Upload, FileText, CheckCircle2, Download, AlertCircle, Wand2, KeyRound, ChevronLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { extractTextFromPDF } from "@/lib/pdf";
import { exportToDocx } from "@/lib/docx";
import { processJobApplication } from "@/lib/gemini";
import { ResumePreview } from "@/components/ResumePreview";

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
    
    try {
      const text = await extractTextFromPDF(file);
      setResumeText(text);
      setActiveTab("original");
    } catch (err) {
      console.error("Failed to parse PDF:", err);
      setError("Could not parse the uploaded PDF file. Please ensure it's a valid PDF containing text.");
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
    setOptimizedResume(null);
    setCoverLetter(null);
    setKeywordData(null);
    setActiveTab("score");
    
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

  const downloadPdf = () => {
    const originalTitle = document.title;
    const company = displayKeywordData?.companyName ? `_${displayKeywordData.companyName.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
    document.title = `satwik${company}`;
    window.print();
    document.title = originalTitle;
  };

  const downloadDocx = () => {
    if (activeTab === "optimized" && optimizedResume) {
      const data = optimizedResume;
      let md = `**${data.basics?.name || "Name"}**\n\n`;
      
      const contacts = [];
      if (data.basics?.email) contacts.push(data.basics.email);
      if (data.basics?.phone) contacts.push(data.basics.phone);
      if (data.basics?.location) contacts.push(data.basics.location);
      if (data.basics?.linkedin) contacts.push(data.basics.linkedin);
      if (data.basics?.github) contacts.push(data.basics.github);
      
      if (contacts.length > 0) md += `${contacts.join(" | ")}\n\n`;
      if (data.basics?.summary) md += `**Professional Summary**\n\n${data.basics.summary}\n\n`;
      
      if (data.skills && data.skills.length > 0) {
        md += `**Technical Skills**\n\n`;
        data.skills.forEach((s: any) => {
          md += `**${s.category}:** ${s.keywords.join(", ")}\n\n`;
        });
      }
      
      if (data.experience && data.experience.length > 0) {
        md += `**Professional Experience**\n\n`;
        data.experience.forEach((exp: any) => {
          md += `**${exp.position}** | ${exp.company}\n\n`;
          md += `${exp.startDate} - ${exp.endDate} | ${exp.location}\n\n`;
          exp.highlights?.forEach((hl: string) => {
            md += `- ${hl}\n\n`;
          });
        });
      }
      
      if (data.projects && data.projects.length > 0) {
        md += `**Projects**\n\n`;
        data.projects.forEach((proj: any) => {
          const tech = proj.technologies?.length > 0 ? ` | ${proj.technologies.join(", ")}` : "";
          md += `**${proj.name}**${tech}\n\n`;
          if (proj.description) md += `${proj.description}\n\n`;
          proj.highlights?.forEach((hl: string) => {
            md += `- ${hl}\n\n`;
          });
        });
      }
      
      if (data.education && data.education.length > 0) {
        md += `**Education**\n\n`;
        data.education.forEach((edu: any) => {
          md += `**${edu.studyType} in ${edu.area}**\n\n`;
          md += `${edu.institution} | ${edu.startDate} - ${edu.endDate}\n\n`;
        });
      }

      if (data.certifications && data.certifications.length > 0) {
        md += `**Certifications**\n\n`;
        data.certifications.forEach((cert: any) => {
          md += `- **${cert.name}**, ${cert.issuer} ${cert.date ? `(${cert.date})` : ""}\n\n`;
        });
      }
      
      if (data.achievements && data.achievements.length > 0) {
        md += `**Achievements**\n\n`;
        data.achievements.forEach((ach: string) => {
          md += `- ${ach}\n\n`;
        });
      }

      const company = displayKeywordData?.companyName ? `_${displayKeywordData.companyName.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
      exportToDocx(md.trim(), `satwik${company}.docx`);
    } else if (activeTab === "cover-letter" && coverLetter) {
      const company = displayKeywordData?.companyName ? `_${displayKeywordData.companyName.replace(/[^a-zA-Z0-9]/g, "_")}` : "";
      exportToDocx(coverLetter, `Cover_Letter_satwik${company}.docx`);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 print:block print:h-auto print:bg-white">
      <header className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center no-print">
        <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">ResumeAI</h1>
              <p className="text-[10px] leading-tight text-muted-foreground">ATS Optimizer</p>
            </div>
          </div>

        <TabsList className="hidden md:flex">
          <TabsTrigger value="original">Original Resume</TabsTrigger>
          <TabsTrigger value="score">ATS Score</TabsTrigger>
          <TabsTrigger value="optimized">Optimized Resume</TabsTrigger>
          <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
        </TabsList>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={downloadDocx} className="gap-2" disabled={!optimizedResume && !coverLetter}>
            <Download className="w-4 h-4" /> DOCX
          </Button>
          <Button variant="default" size="sm" onClick={downloadPdf} className="gap-2" disabled={!optimizedResume && !coverLetter}>
            <Download className="w-4 h-4" /> Print PDF
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden print:block print:overflow-visible">
        {/* Left Sidebar */}
        <aside className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col no-print transition-all duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'w-[450px]' : 'w-0 opacity-0 overflow-hidden border-r-0'}`}>
          <div className="w-[450px] h-full overflow-y-auto custom-scrollbar flex flex-col">
            <div className="p-6 space-y-6">
            
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Gemini API Key
              </Label>
              <Input 
                id="api-key" 
                type="password" 
                value={apiKey} 
                onChange={handleApiKeyChange}
                placeholder="AIzaSy..." 
                className="font-mono text-xs"
              />
            </div>

            <Separator />

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-muted-foreground" />
                Upload Resume (PDF)
              </Label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                <Input 
                  type="file" 
                  accept=".pdf" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground pointer-events-none">
                  <FileText className="w-6 h-6 mb-1 text-slate-400" />
                  {resumeFile ? (
                    <span className="font-medium text-primary">{resumeFile.name}</span>
                  ) : (
                    <>
                      <span className="font-medium">Click to upload</span>
                      <span className="text-xs">PDF format only</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <Label htmlFor="jd" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Job Description
              </Label>
              <Textarea 
                id="jd" 
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job description here..."
                className="min-h-[200px] text-sm resize-y"
              />
            </div>

            {/* Advanced Settings */}
            <div className="space-y-2">
              <button 
                onClick={() => setIsCustomPromptOpen(!isCustomPromptOpen)}
                className="flex items-center justify-between w-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  AI Instructions
                </span>
                <span>{isCustomPromptOpen ? '▼' : '►'}</span>
              </button>
              
              {isCustomPromptOpen && (
                <Textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[250px] font-mono text-xs mt-2"
                />
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Button 
                className="w-full font-semibold" 
                size="lg"
                onClick={handleProcessApplication}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing Application (5-10s)..." : "Process Application"}
              </Button>
            </div>
            
          </div>
        </div>
      </aside>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 print:block print:bg-white relative">
          
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
                ) : (
                  <div className="flex-1 w-full overflow-y-auto p-6 bg-white dark:bg-slate-950 font-mono text-sm whitespace-pre-wrap custom-scrollbar rounded-md border border-slate-200 dark:border-slate-800">
                    {resumeText || <span className="text-muted-foreground italic">Upload a resume to see the preview.</span>}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="score" className="h-full m-0 mt-0 data-[state=active]:block data-[state=inactive]:hidden print:block print:h-auto relative">
                <div className="absolute inset-0 w-full h-full overflow-y-auto p-4 md:p-8 custom-scrollbar grid grid-cols-1 md:grid-cols-3 gap-6 items-start print:static print:h-auto print:overflow-visible print:p-0">
                  
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>{displayKeywordData?.isOptimizedScore ? "Optimized ATS Score" : "Original ATS Score"}</CardTitle>
                      <CardDescription>{displayKeywordData?.isOptimizedScore ? "Score after AI integration" : "Based on Job Description"}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                      <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-slate-100 dark:border-slate-800">
                        {displayKeywordData ? (
                          <div className="text-4xl font-bold text-primary">
                            {displayKeywordData.matchPercentage}%
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-sm">N/A</div>
                        )}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" 
                            className="text-primary transition-all duration-1000 ease-out" 
                            strokeDasharray={`${displayKeywordData ? (displayKeywordData.matchPercentage / 100) * 289 : 0} 289`}
                          />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Keyword Analysis</CardTitle>
                      <CardDescription>Keywords found and missing from your resume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Found Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {displayKeywordData?.matchedKeywords?.map(kw => (
                              <span key={kw} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full font-medium">
                                {kw}
                              </span>
                            )) || <span className="text-sm text-muted-foreground">Run optimization to analyze keywords.</span>}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Missing Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {displayKeywordData?.missingKeywords?.map(kw => (
                              <span key={kw} className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded-full font-medium">
                                {kw}
                              </span>
                            )) || <span className="text-sm text-muted-foreground">Run optimization to analyze keywords.</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="optimized" className="h-full m-0 mt-0 data-[state=active]:block data-[state=inactive]:hidden print:block print:h-auto relative">
                <div className="absolute inset-0 w-full h-full overflow-y-auto p-4 md:p-8 custom-scrollbar print:static print:h-auto print:overflow-visible print:p-0">
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground min-h-[400px]">
                      <Wand2 className="w-8 h-8 animate-pulse text-primary" />
                      <p>Processing job application (this takes about 5-10s)...</p>
                    </div>
                  ) : optimizedResume ? (
                    <ResumePreview data={optimizedResume} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground italic min-h-[400px]">
                      Click "Process Application" to generate.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="cover-letter" className="h-full m-0 mt-0 data-[state=active]:block data-[state=inactive]:hidden print:block print:h-auto relative">
                <div className="absolute inset-0 w-full h-full overflow-y-auto p-4 md:p-8 custom-scrollbar print:static print:h-auto print:overflow-visible print:p-0">
                  {isProcessing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground min-h-[400px]">
                      <Wand2 className="w-8 h-8 animate-pulse text-primary" />
                      <p>Processing job application (this takes about 5-10s)...</p>
                    </div>
                  ) : coverLetter ? (
                    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-10 shadow-sm print:shadow-none print:border-none print:p-0">
                      <div className="prose dark:prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-semibold">
                        <ReactMarkdown>
                          {coverLetter}
                        </ReactMarkdown>
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
        }
      `}} />
    </Tabs>
  );
}
