/**
 * Tags, compared the way a person compares them.
 *
 * Tags reach a dream from two places that do not agree on case. The emotion
 * comes from the morning picker capitalised — "Peaceful" — because that is how
 * it is shown on the button. The keywords come back from the interpretation
 * model in lowercase. `new Set` was being used to remove duplicates, and it
 * compares exactly, so a card printed `#Peaceful #peaceful` side by side and
 * the filter dropdown listed the same word twice.
 *
 * Nobody reading the card thinks those are two tags, so nothing here should
 * either.
 */

/** The key two tags are the same under: trimmed and lowercased. */
export function tagKey(tag: string): string {
  return tag.trim().toLowerCase();
}

/**
 * Remove duplicates without caring about case, keeping the first spelling.
 *
 * First wins so the emotion the person actually chose keeps its capital — the
 * lists here are built with it in front for that reason.
 */
export function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const key = tagKey(tag);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(tag.trim());
  }
  return out;
}

/** Whether a list carries a tag, ignoring case. */
export function hasTag(tags: string[] | undefined, tag: string): boolean {
  if (!tags) return false;
  const key = tagKey(tag);
  return tags.some((t) => tagKey(t) === key);
}
