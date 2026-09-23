const PREFIX = 'Made with ';
const HEART = '❤️';
const CONNECTOR = ' by ';
const NAME = 'Was';

function SignatureCharacters({ text, startIndex }: { text: string; startIndex: number }) {
  return [...text].map((character, index) => (
    <span
      key={`${character}-${startIndex + index}`}
      className="creator-signature__character"
      style={{ animationDelay: `${0.45 + (startIndex + index) * 0.065}s` }}
    >
      {character === ' ' ? '\u00a0' : character}
    </span>
  ));
}

export default function CreatorSignature() {
  return (
    // `aria-label` isn't valid on a <p>, and a real link must never sit inside
    // an aria-hidden ancestor (still focusable, but invisible to assistive
    // tech). The animated glyphs stay decorative and hidden; the link carries
    // its own name and is never wrapped by aria-hidden.
    <p className="creator-signature" dir="ltr">
      <span aria-hidden="true">
        <SignatureCharacters text={PREFIX} startIndex={0} />
        <span
          className="creator-signature__character creator-signature__heart"
          style={{ animationDelay: `${0.45 + PREFIX.length * 0.065}s` }}
        >
          {HEART}
        </span>
        <SignatureCharacters text={CONNECTOR} startIndex={PREFIX.length + 1} />
      </span>
      <a
        href="https://waseemp.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="creator-signature__link"
        aria-label="Was — open creator website"
      >
        <span aria-hidden="true">
          <SignatureCharacters text={NAME} startIndex={PREFIX.length + CONNECTOR.length + 1} />
        </span>
      </a>
    </p>
  );
}
