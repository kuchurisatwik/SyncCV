export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  if (typeof window !== 'undefined') {
    // Served locally from public/ so it works on the website, offline, and in the
    // Android app (the previous unpkg CDN URL failed for some users and in the APK).
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  const links = new Set<string>();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);

    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => ('str' in item ? item.str : '')).join(' ');
    fullText += pageText + '\n';

    // GitHub/LinkedIn/portfolio/project links are usually clickable hyperlinks
    // behind text, so their URLs are NOT in the visible text above. Pull them
    // from the page's link annotations so the AI gets the real URLs.
    try {
      const annotations = await page.getAnnotations();
      for (const a of annotations as Array<Record<string, unknown>>) {
        const url = (typeof a?.url === 'string' && a.url) || (typeof a?.unsafeUrl === 'string' && a.unsafeUrl) || '';
        if (url && /^https?:\/\//i.test(url)) {
          links.add(url.trim());
        }
      }
    } catch {
      // Annotations are best-effort; ignore if unavailable.
    }
  }

  if (links.size > 0) {
    fullText +=
      '\n\nHYPERLINKS EXTRACTED FROM RESUME (exact clickable URLs — use these verbatim for basics.github/linkedin/portfolio and projects[].url, matched by domain/context):\n' +
      Array.from(links).join('\n');
  }

  return fullText;
}
