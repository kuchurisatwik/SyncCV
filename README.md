# ResumeAI ATS Optimizer

ResumeAI is an intelligent, Next.js-powered application that uses Google's Gemini AI to automatically optimize your resume for specific job descriptions. It ensures your resume beats Applicant Tracking Systems (ATS) by seamlessly weaving missing keywords into your experience and skills, while also generating a tailored cover letter.

## Features

- **Smart ATS Optimization**: Automatically analyzes a Job Description (JD) and injects missing keywords into your existing resume without making up fake experiences.
- **Dynamic Keyword Analysis**: See exactly which keywords were missing and watch your ATS match score increase in real-time.
- **Tailored Cover Letter**: Generates a professional, concise cover letter based on your newly optimized resume and the JD.
- **Export Options**:
  - **Save as PDF**: Clean, print-ready PDF export (fits perfectly on a single A4 page with no ugly browser headers/footers).
  - **Download DOCX**: Export a formatted `.docx` file for easy editing in Microsoft Word.
- **Privacy First**: Everything runs locally in your browser. Your data is sent directly to Google's Gemini API and is never stored on a database.

---

## Understanding the UI

The application is split into two simple panels:

### 1. Left Panel (Your Inputs)

- **Resume Tab**: Paste your original resume text here.
- **Job Description Tab**: Paste the job description you are applying for.

### 2. Right Panel (Your Results)

- **Original**: A clean preview of your original, unedited resume.
- **Score**: Shows your ATS Match Percentage. It lists the keywords found in your resume versus the keywords missing from the JD.
- **Optimized**: The final, AI-enhanced resume preview. Watch as missing keywords are dynamically moved to the "Found" bucket, boosting your score to 100%!
- **Cover Letter**: A personalized cover letter ready to be copied or downloaded.

### Actions

- **Settings Gear (Top Right)**: Click this to enter your Gemini API Key.
- **Process Application**: Sends your data to the AI. Takes about 5-10 seconds.
- **Export Buttons**: Appear after processing to download your new files.

---

## How to Run Locally

Follow these simple steps to run the application on your own machine.

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your computer.
- A free [Google Gemini API Key](https://aistudio.google.com/app/apikey).

### 1. Clone the repository and navigate into the project

```bash
git clone https://github.com/satwik-kuchuri/resume-ai-ats-optimizer.git
cd resume-ai-ats-optimizer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Open the app

Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

### 5. Add your API Key

Click the **Gear Icon** in the top right corner of the app, paste your Gemini API key, and hit save. You are now ready to optimize!

---

## Tech Stack

- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS & Shadcn UI
- **AI Engine**: Google Gemini API
- **Icons**: Lucide React
- **Export**: `docx` (for Word documents)
