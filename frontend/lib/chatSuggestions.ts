/**
 * Parse assistant message to find suggested dates, times, and services for clickable buttons.
 * Does not change any API or logic — only extracts tokens to display as buttons.
 */

const DATE_WORDS = ["today", "tomorrow"];
const SERVICES = ["Haircut", "Consultation", "Massage", "Dental Checkup"];
const ISO_DATE = /\b(\d{4}-\d{1,2}-\d{1,2})\b/g;
const TIME_24 = /\b(\d{1,2}:\d{2})\b/g;

export function getSuggestionsFromMessage(content: string): string[] {
  if (!content?.trim()) return [];
  const lower = content.toLowerCase();
  const suggestions: string[] = [];

  for (const word of DATE_WORDS) {
    if (lower.includes(word)) suggestions.push(word);
  }
  for (const s of SERVICES) {
    if (lower.includes(s.toLowerCase())) suggestions.push(s);
  }
  let m: RegExpExecArray | null;
  const isoSet = new Set<string>();
  ISO_DATE.lastIndex = 0;
  while ((m = ISO_DATE.exec(content)) !== null) isoSet.add(m[1]);
  isoSet.forEach((d) => suggestions.push(d));

  const timeSet = new Set<string>();
  TIME_24.lastIndex = 0;
  while ((m = TIME_24.exec(content)) !== null) {
    const t = m[1];
    const [h, min] = t.split(":").map(Number);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) timeSet.add(t);
  }
  timeSet.forEach((t) => suggestions.push(t));

  return [...new Set(suggestions)];
}
