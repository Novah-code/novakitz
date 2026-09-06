import fs from 'fs';
import path from 'path';

export function readMarkdownFile(filename: string): string {
  const filePath = path.join(process.cwd(), 'public', 'legal', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Bold and links, applied to the text inside a block. */
function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-[#5a9370] underline">$1</a>'
    );
}

/**
 * The legal pages' markdown, turned into HTML.
 *
 * This existed already and the pages never called it — they rendered the raw
 * file, so visitors read `**Last Updated**` and `## 3.1 Account Creation` as
 * literal text. The Tailwind typography plugin is not installed either, so the
 * `prose-*` classes those pages carried styled nothing. Both are why a reviewer
 * opening the privacy policy link saw a wall of asterisks and hashes.
 *
 * It is written line by line rather than with a stack of global regexes. The
 * previous version wrapped list items with `/(<li>.*<\/li>)/s` — greedy, and
 * dot-matches-newline — so one `<ul>` swallowed everything between the first
 * and last bullet on the page, headings included.
 *
 * The input is our own file in `public/legal/`, never anything a user typed,
 * but it is escaped before any tag is added regardless: the cost is nothing and
 * it means the safety of the page does not depend on that staying true.
 */
export function convertMarkdownToHtml(markdown: string): string {
  const out: string[] = [];
  let list: string[] = [];
  let para: string[] = [];

  const flushList = () => {
    if (list.length === 0) return;
    out.push(
      `<ul class="list-disc pl-6 space-y-1 my-4 text-gray-700">${list.join('')}</ul>`
    );
    list = [];
  };
  const flushPara = () => {
    if (para.length === 0) return;
    out.push(
      `<p class="text-gray-700 leading-relaxed my-4">${inline(para.join(' '))}</p>`
    );
    para = [];
  };
  const flush = () => {
    flushPara();
    flushList();
  };

  for (const raw of markdown.split('\n')) {
    const line = raw.trimEnd();

    if (line.trim() === '') {
      flush();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1].length;
      const size =
        level === 1
          ? 'text-3xl font-bold mt-8 mb-4'
          : level === 2
            ? 'text-2xl font-semibold mt-8 mb-3'
            : 'text-lg font-semibold mt-6 mb-2';
      out.push(
        `<h${level} class="text-[#4a7a5f] ${size}">${inline(heading[2])}</h${level}>`
      );
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flush();
      out.push('<hr class="my-8 border-gray-200" />');
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      list.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }

    flushList();
    para.push(line.trim());
  }

  flush();
  return out.join('\n');
}
