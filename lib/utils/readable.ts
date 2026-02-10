/**
 * Helpers to make agent-generated content (MBC-20 JSON, hashes, numbers) human-readable.
 */

/** Try to parse MBC-20 style JSON from text and return a short human description */
export function summarizeMbc20(text: string): string | null {
  const jsonMatch = text.match(/\{[^{}]*"p"\s*:\s*"mbc-20"[^{}]*\}/);
  if (!jsonMatch) return null;
  try {
    const obj = JSON.parse(jsonMatch[0]) as { op?: string; tick?: string; amt?: string; p?: string };
    const op = (obj.op ?? '').toLowerCase();
    const tick = obj.tick ?? '?';
    const amt = obj.amt ?? '?';
    if (op === 'mint') return `Mint ${amt} ${tick} (MBC-20)`;
    if (op === 'transfer') return `Transfer ${amt} ${tick}`;
    if (op === 'deploy') return `Deploy ${tick}`;
    return `${op}: ${tick} × ${amt}`;
  } catch {
    return null;
  }
}

/** Format a long number with commas (e.g. 60940 → "60,940") */
export function formatNumber(s: string | number): string {
  const n = typeof s === 'string' ? parseInt(s, 10) : s;
  if (Number.isNaN(n)) return String(s);
  return n.toLocaleString();
}

/** If title looks like "DATA F1AF | Name | 60940", extract a short readable part */
export function humanizeTitle(title: string): { display: string; hint?: string } {
  const trimmed = title.trim();
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    const last = parts[parts.length - 1];
    const num = parseInt(last, 10);
    if (parts.length >= 3 && !Number.isNaN(num)) {
      return {
        display: parts.slice(0, -1).join(' · '),
        hint: `ID ${formatNumber(num)}`,
      };
    }
    return { display: parts.join(' · ') };
  }
  return { display: trimmed };
}

/** First ~200 chars of content, and optional human summary (e.g. MBC-20 one-liner) */
export function humanizeContent(content: string, maxLength = 200): { summary: string | null; snippet: string } {
  const mbc = summarizeMbc20(content);
  let snippet = content
    .replace(/\s+/g, ' ')
    .trim();
  if (snippet.length > maxLength) snippet = snippet.slice(0, maxLength) + '…';
  return { summary: mbc, snippet };
}
