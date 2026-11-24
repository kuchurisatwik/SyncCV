export const MASTER_PROMPT = `You are an expert ATS Resume Optimization Specialist and Technical Recruiter.

Your task is to analyze the Job Description against the Candidate Resume, and generate a SINGLE structured JSON response containing:
1. Keyword Analysis (ATS Score)
2. An Optimized Resume
3. A Personalized Cover Letter

STRICT RULES FOR RESUME OPTIMIZATION:
1. Do not invent entirely new jobs or companies, but you MAY aggressively adjust the technologies, skills, and descriptions to match the Job Description.
2. AGGRESSIVE KEYWORD MATCHING: You MUST extract all missing keywords from the Job Description and seamlessly weave them into the Skills, Experience, and Projects sections.
3. SKILL ENHANCEMENT: Preserve the candidate's existing core skills. Append the missing keywords from the Job Description to the relevant skill categories rather than deleting the original skillset. Organize skills into 4-6 clearly labeled categories.
4. HEADLINE: Generate "basics.headline" as a short, pipe-separated professional title tailored to the target role: exactly 3 segments, under 9 words total (e.g., "DevOps Engineer | AWS Cloud | CI/CD & Infrastructure as Code"). Base it on the candidate's real role and the top Job Description keywords.
5. PRESERVE EVERYTHING — THIS IS THE MOST IMPORTANT RULE: The optimized resume MUST mirror the original resume's structure and length EXACTLY. Output the SAME number of experience entries, projects, education entries, certifications, and achievements as the original, AND the SAME number of bullet points inside every single job and project. NEVER drop, merge, summarize away, or omit any role, project, achievement, certification, or bullet — not even to save space or to fit a page. The finished resume must be the same length as the uploaded resume.
6. Never change company names or job titles. Never modify numerical metrics. Keep all dates unchanged.
7. CONTACT INFO INTEGRITY: Populate exact, full URLs for LinkedIn, GitHub, Portfolio, and project links. The resume text may end with a "HYPERLINKS EXTRACTED FROM RESUME" list of the real clickable URLs — treat it as the authoritative source and map by domain/context: a github.com/<user> profile to basics.github, a linkedin.com/in/<...> link to basics.linkedin, a personal site/portfolio domain to basics.portfolio, and each github.com/<user>/<repo> link to the matching projects[].url (by repo or project name). Use those URLs verbatim. Never shorten them, never use placeholders like "LinkedIn URL", and never fabricate a URL. If no real URL exists for a field, omit that field entirely.

STRICT RULES FOR LENGTH (match the uploaded resume's length — do NOT shorten it):
8. Do NOT cut, compress, trim, or shorten the resume to fit a page. The original already fits on one page, so a faithful rewrite of the same length fits too. Your job is to REWORD for keywords, not to remove anything.
9. Keep the summary about the same length as the original summary. Keep each rewritten bullet about the same length (one concise sentence) as the original bullet it replaces.
10. KEYWORD WEAVING WITHOUT LENGTH CHANGE: Rewrite the existing bullets and summary to naturally include Job Description keywords, but keep the SAME number of bullets per job and per project as the original. For each project, also provide a "technologies" list of 3-6 items taken from that real project. Do NOT invent fake metrics, outcomes, or technologies the candidate did not use.
11. The counts of sections, entries, and bullets in your output MUST equal the original resume. Only wording may change; quantity may not.

STRICT RULES FOR COVER LETTER:
1. STRICT LENGTH CONSTRAINT: Keep it extremely short, punchy, and under 200 words. (Maximum 3 brief paragraphs).
2. Be highly concise. Recruiters don't have time to read novels.
3. ATS friendly and professional tone.
4. Mention relevant skills found in both resume and JD.
5. Highlight 1-2 major achievements from the resume.
6. No fake claims and no generic buzzwords.
7. Output the cover letter as a raw Markdown string within the JSON.

OUTPUT FORMAT:
Return the complete analysis, optimized resume, and cover letter strictly as a JSON object adhering to the following structure. Do not wrap in markdown \`\`\`json blocks. Return ONLY the raw JSON object.
{
  "keywordAnalysis": {
    "companyName": "Extracted Company Name from JD (or null if not found)",
    "matchedKeywords": ["skill1", "skill2"],
    "missingKeywords": ["skill3", "skill4"],
    "matchPercentage": 75
  },
  "optimizedResume": {
    "basics": {
      "name": "Full Name",
      "headline": "Role | Focus Area | Specialty",
      "email": "email@address.com",
      "phone": "Phone Number",
      "location": "City, State",
      "linkedin": "LinkedIn URL",
      "github": "GitHub URL",
      "portfolio": "Portfolio URL",
      "summary": "Optimized professional summary (2-3 lines)."
    },
    "skills": [
      {
        "category": "e.g., Languages, Frameworks, Cloud",
        "keywords": ["Skill 1", "Skill 2"]
      }
    ],
    "experience": [
      {
        "company": "Company Name",
        "position": "Job Title",
        "location": "Location",
        "startDate": "Start Date",
        "endDate": "End Date",
        "highlights": [
          "Optimized bullet point 1 using strong action verbs and metrics.",
          "Optimized bullet point 2."
        ]
      }
    ],
    "projects": [
      {
        "name": "Project Name",
        "url": "Project/GitHub URL (omit entirely if not in the original resume)",
        "description": "Optional one-line descriptor",
        "technologies": ["Tech 1", "Tech 2", "Tech 3"],
        "highlights": ["Informative project bullet 1.", "Informative project bullet 2."]
      }
    ],
    "education": [
      {
        "institution": "University Name",
        "area": "Major",
        "studyType": "Degree Type",
        "startDate": "Start",
        "endDate": "End",
        "gpa": "GPA if applicable"
      }
    ],
    "certifications": [
      {
        "name": "Cert Name",
        "date": "Date",
        "issuer": "Issuer"
      }
    ],
    "achievements": [
      "Achievement 1",
      "Achievement 2"
    ]
  },
  "coverLetter": "Dear Hiring Manager,\\n\\nI am writing to apply...\\n\\nSincerely,\\n[Name]"
}
Do not explain. Return only the raw JSON.
`;

/**
 * "Thinking" (hidden reasoning) is the main source of latency on Flash models.
 * The control differs by generation: Gemini 2.5 uses thinkingBudget (0 = off);
 * Gemini 3.x uses thinkingLevel ("low" minimizes it — thinkingBudget is ignored
 * there). Newer/unknown generations get no thinking field (setting an
 * unsupported one returns a 400, which just falls through to the next model).
 */
function thinkingConfigFor(model: string): Record<string, unknown> | undefined {
  if (model.startsWith("gemini-2.5")) return { thinkingBudget: 0 };
  if (model.startsWith("gemini-3")) return { thinkingLevel: "low" };
  return undefined;
}

async function callGemini(apiKey: string, prompt: string) {
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];
  let lastError = null;

  for (const model of models) {
    try {
      const thinkingConfig = thinkingConfigFor(model);
      const requestBody: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
      };
      if (thinkingConfig) requestBody.generationConfig = { thinkingConfig };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to call Gemini API with model ${model}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (err: any) {
      console.warn(`Model ${model} failed or rate limited. Falling back to next model...`, err.message);
      lastError = err;

      // If the API key is completely invalid, don't bother trying other models
      if (err.message.includes("API key not valid") || err.message.includes("API key is invalid")) {
        throw err;
      }

      // Otherwise, loop continues and tries the next model in the list
    }
  }

  throw new Error(lastError?.message || 'Failed to call Gemini API across all fallback models.');
}

export async function processJobApplication(apiKey: string, resumeText: string, jdText: string) {
  const fullPrompt = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jdText}\n\n${MASTER_PROMPT}`;
  const responseText = await callGemini(apiKey, fullPrompt);

  const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse the job application JSON response:", cleanJson);
    throw new Error("Failed to parse the AI response into a structured format.");
  }
}
