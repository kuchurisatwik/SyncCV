import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function exportToDocx(markdownText: string, filename: string) {
  const paragraphs = markdownText.split('\n\n').map(text => {
    const runs: TextRun[] = [];
    const boldParts = text.split(/\*\*(.*?)\*\*/g);
    boldParts.forEach((part, index) => {
      if (index % 2 === 1) {
        runs.push(new TextRun({ text: part, bold: true }));
      } else if (part) {
        runs.push(new TextRun({ text: part }));
      }
    });

    return new Paragraph({
      children: runs,
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
