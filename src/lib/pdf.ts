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
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => 'str' in item ? item.str : '').join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}
