// {{var}} placeholders are resolved later (tauriApi interpolate): encoding their braces would stop the match.
const encodeKeepingVars = (text: string): string =>
  text
    .split(/(\{\{\s*[^}\s]+\s*\}\})/)
    .map((part, i) => (i % 2 === 1 ? part : encodeURIComponent(part)))
    .join('');

/** Appends key=value to the query string, before any #fragment (a param after it never reaches the server). */
export const appendQueryParam = (url: string, key: string, value: string): string => {
  const hashAt = url.indexOf('#');
  const base = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  const sep = !base.includes('?') ? '?' : base.endsWith('?') || base.endsWith('&') ? '' : '&';
  return `${base}${sep}${encodeKeepingVars(key)}=${encodeKeepingVars(value)}${hash}`;
};
