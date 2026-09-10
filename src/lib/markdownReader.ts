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

/*
 * Styles are written out as `style="…"`, not as classes.
 *
 * They used to be Tailwind classes. Tailwind is in package.json and wired into
 * PostCSS, but no stylesheet imports it, so it compiles to nothing and every
 * class here named a rule that did not exist. The documents rendered as the
 * browser's defaults: Times, black on white, edge to edge.
 */
const STYLE = {
  h1: 'color:#4a7a5f;font-size:26px;font-weight:700;line-height:1.3;margin:0 0 16px',
  h2: 'color:#4a7a5f;font-size:20px;font-weight:600;line-height:1.35;margin:32px 0 12px',
  h3: 'color:#4a7a5f;font-size:16px;font-weight:600;line-height:1.4;margin:24px 0 8px',
  p: 'color:#374151;font-size:15px;line-height:1.7;margin:0 0 14px',
  list: 'color:#374151;font-size:15px;line-height:1.7;margin:0 0 14px;padding-left:22px',
  li: 'margin-bottom:4px',
  hr: 'border:none;border-top:1px solid #e5e7eb;margin:32px 0',
  strong: 'font-weight:600;color:#1f2937',
  a: 'color:#4a7a5f;text-decoration:underline',
} as const;

/** Bold and links, applied to the text inside a block. */
function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="${STYLE.strong}">$1</strong>`)
    .replace(/\[(.+?)\]\((.+?)\)/g, `<a href="$2" style="${STYLE.a}">$1</a>`);
}

/**
 * The legal pages' markdown, turned into HTML.
 *
 * This existed already and the pages never called it — they rendered the raw
 * file, so visitors read `**Last Updated**` and `## 3.1 Account Creation` as
 * literal text — which is what a reviewer opening the privacy policy link saw.
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
  /* Which kind of list is open — bullets and numbers cannot share one block. */
  let listTag: 'ul' | 'ol' = 'ul';
  let para: string[] = [];

  const flushList = () => {
    if (list.length === 0) return;
    out.push(`<${listTag} style="${STYLE.list}">${list.join('')}</${listTag}>`);
    list = [];
  };
  const flushPara = () => {
    if (para.length === 0) return;
    out.push(`<p style="${STYLE.p}">${inline(para.join(' '))}</p>`);
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
      const style = level === 1 ? STYLE.h1 : level === 2 ? STYLE.h2 : STYLE.h3;
      out.push(`<h${level} style="${style}">${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flush();
      out.push(`<hr style="${STYLE.hr}" />`);
      continue;
    }

    /*
     * Numbered steps are a list too. The refund policy walks through how to ask
     * for one in three numbered steps, and with only bullets recognised those
     * three ran together into a single paragraph reading "1. Email Us ... 2.
     * Include Information ... 3. Response Time".
     */
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (numbered) {
      flushPara();
      if (listTag !== 'ol') flushList();
      listTag = 'ol';
      list.push(`<li style="${STYLE.li}">${inline(numbered[1])}</li>`);
      continue;
    }

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      if (listTag !== 'ul') flushList();
      listTag = 'ul';
      list.push(`<li style="${STYLE.li}">${inline(bullet[1])}</li>`);
      continue;
    }

    flushList();
    para.push(line.trim());
  }

  flush();
  return out.join('\n');
}
