/** Escapes LIKE wildcards so a search for "50%" matches the text literally. */
export function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
