interface PageStubProps {
  number: string;
  eyebrow: string;
  title: string;
  accent: string;
  note: string;
}

/** Minimal centered placeholder for routes owned by page agents. */
export default function PageStub({ number, eyebrow, title, accent, note }: PageStubProps) {
  return (
    <section className="flex min-h-[calc(100dvh-72px)] items-center justify-center px-6">
      <div className="max-w-[680px] text-center">
        <p className="mono-label text-[12px] text-amber">
          N°{number} — {eyebrow}
        </p>
        <h1 className="mt-6 font-display text-[44px] font-medium leading-[1.05] tracking-[-0.02em] text-cream md:text-[56px]">
          {title} <em className="font-normal italic text-amber-bright">{accent}</em>
        </h1>
        <p className="mt-6 text-[16px] leading-[1.6] text-cream-dim">{note}</p>
        <p className="mono-label mt-10 text-[11px] text-cream-faint">
          THIS PAGE IS BEING TYPESET — CHECK BACK SHORTLY.
        </p>
      </div>
    </section>
  );
}
