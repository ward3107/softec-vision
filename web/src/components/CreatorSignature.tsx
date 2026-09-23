const PREFIX = 'Made with ';
const HEART = '❤️';
const CONNECTOR = ' by ';
const NAME = 'Was';
const SIGNATURE = `${PREFIX}${HEART}${CONNECTOR}${NAME}`;

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
    <p className="creator-signature" aria-label={SIGNATURE} dir="ltr">
      <span aria-hidden="true">
        <SignatureCharacters text={PREFIX} startIndex={0} />
        <span
          className="creator-signature__character creator-signature__heart"
          style={{ animationDelay: `${0.45 + PREFIX.length * 0.065}s` }}
        >
          {HEART}
        </span>
        <SignatureCharacters text={CONNECTOR} startIndex={PREFIX.length + 1} />
        <a
          href="https://waseemp.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="creator-signature__link"
          aria-label="Was — open creator website"
        >
          <SignatureCharacters text={NAME} startIndex={PREFIX.length + CONNECTOR.length + 1} />
        </a>
      </span>
      <span className="creator-signature__cursor" aria-hidden="true" />
    </p>
  );
}
