/**
 * In-app navigation trail (client-only module state), so a "Back" button can
 * return to the previous page *on this site* without ever sending a visitor
 * who landed directly (e.g. from a search result) off-site. A move to the
 * second-to-last entry is treated as going back and pops the trail; anything
 * else pushes. Resets on a full page load, which is the safe default.
 */
const trail: string[] = [];
let replaceNext = false;

export function recordLocation(url: string): void {
  if (replaceNext) {
    replaceNext = false;
    if (trail.length > 0) trail[trail.length - 1] = url;
    else trail.push(url);
    return;
  }
  if (trail.length >= 2 && trail[trail.length - 2] === url) trail.pop();
  else if (trail[trail.length - 1] !== url) trail.push(url);
}

/** The next navigation replaces the current entry (an "up one level" step, not a new page). */
export function markReplace(): void {
  replaceNext = true;
}

export function canGoBackInApp(): boolean {
  return trail.length > 1;
}

/** Test helper. */
export function resetTrail(): void {
  trail.length = 0;
  replaceNext = false;
}
