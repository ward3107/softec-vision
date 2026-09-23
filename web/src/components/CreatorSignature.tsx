const SIGNATURE = 'Made with love by Was';

export default function CreatorSignature() {
  return (
    <p className="creator-signature" aria-label={SIGNATURE} dir="ltr">
      <span aria-hidden="true">
        {[...SIGNATURE].map((character, index) => (
          <span
            key={`${character}-${index}`}
            className="creator-signature__character"
            style={{ animationDelay: `${0.45 + index * 0.065}s` }}
          >
            {character === ' ' ? '\u00a0' : character}
          </span>
        ))}
      </span>
      <span className="creator-signature__cursor" aria-hidden="true" />
    </p>
  );
}
