import Image from 'next/image';

const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer'
} as const;

/** Waseem's permanent creator mark, using the supplied artwork intact. */
export default function CreatorSignature() {
  return (
    <div className="relative w-full max-w-[373px] overflow-hidden rounded-xl bg-[#020716]" dir="ltr">
      <Image
        src="/brand/vasia-dev-signature.png"
        alt="Vasia dev. — digital solutions, branding and website design"
        width={373}
        height={259}
        sizes="(max-width: 480px) calc(100vw - 72px), 373px"
        className="h-auto w-full"
      />

      <a
        href="https://www.vasia.dev/"
        {...externalLinkProps}
        className="absolute left-[27%] top-[15%] h-[31%] w-[46%] rounded focus-visible:outline-white"
        aria-label="Open the Vasia dev. website"
      />
      <a
        href="mailto:vasyaward@gmail.com"
        className="absolute bottom-[3%] left-0 h-[22%] w-1/6 rounded focus-visible:outline-white"
        aria-label="Email Vasia dev."
      />
      <a
        href="https://wa.me/972544742520"
        {...externalLinkProps}
        className="absolute bottom-[3%] left-1/6 h-[22%] w-1/6 rounded focus-visible:outline-white"
        aria-label="Message Vasia dev. on WhatsApp"
      />
      <a
        href="https://github.com/ward3107"
        {...externalLinkProps}
        className="absolute bottom-[3%] left-2/3 h-[22%] w-1/6 rounded focus-visible:outline-white"
        aria-label="Open Waseem's GitHub profile"
      />
      <a
        href="https://www.linkedin.com/in/waseem-abu-akel-334486374/"
        {...externalLinkProps}
        className="absolute bottom-[3%] left-5/6 h-[22%] w-1/6 rounded focus-visible:outline-white"
        aria-label="Open Waseem's LinkedIn profile"
      />
    </div>
  );
}
