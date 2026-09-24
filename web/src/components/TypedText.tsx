/**
 * Reveals its text with a left-to-right "typing" effect. Pure CSS (staggered
 * per-character opacity) and fully server-rendered, so the complete text is in
 * the DOM for search engines and assistive tech, and no-JS/reduced-motion
 * visitors just see it in full. Characters stay inline (opacity only, no
 * transform) so the paragraph still wraps normally at spaces.
 */
const CHAR_DELAY = 0.022;
const MAX_DELAY = 4.5;
// The text types itself in once on load; no blinking caret follows (it read as
// a line flickering forever), so nothing on the hero animates continuously.

export default function TypedText({ text, className }: { text: string; className?: string }) {
  const chars = [...text];
  return (
    <p className={className}>
      <span className="typed-text">
        {chars.map((char, index) => (
          <span key={index} className="typed-char" style={{ animationDelay: `${Math.min(index * CHAR_DELAY, MAX_DELAY)}s` }}>
            {char}
          </span>
        ))}
      </span>
    </p>
  );
}
