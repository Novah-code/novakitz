import fs from 'fs';
import path from 'path';

export function readMarkdownFile(filename: string): string {
  const filePath = path.join(process.cwd(), 'public', 'legal', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
}

export function convertMarkdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul class="list-disc ml-6 space-y-1">$1</ul>');

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<li') || para.trim() === '' || para.startsWith('---')) {
      return para;
    }
    return `<p>${para}</p>`;
  }).join('\n');

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
}
