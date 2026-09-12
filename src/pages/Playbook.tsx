import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Toaster } from 'sonner';
import PlaybookHeader from '@/components/playbook/PlaybookHeader';
import ChapterRow from '@/components/playbook/ChapterRow';
import MastersGallery from '@/components/playbook/MastersGallery';
import Unprinciple from '@/components/playbook/Unprinciple';
import NextSteps from '@/components/playbook/NextSteps';
import { CHAPTERS } from '@/lib/playbook';

/**
 * Playbook — `/playbook` (playbook.md). Ten research-principle chapters with
 * citations, masters, copyable lines and do/don't; a masters-gallery marquee
 * interlude between chapters 5 and 6; the ethics closer; next steps.
 */
export default function Playbook() {
  const { hash } = useLocation();

  // Honor deep links (e.g. /playbook#chapter-03 from the Science index).
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (!el) return;
    const t = window.setTimeout(
      () => el.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      120,
    );
    return () => window.clearTimeout(t);
  }, [hash]);

  return (
    <>
      <PlaybookHeader />
      {CHAPTERS.slice(0, 5).map((c) => (
        <ChapterRow key={c.n} chapter={c} />
      ))}
      <MastersGallery />
      {CHAPTERS.slice(5).map((c) => (
        <ChapterRow key={c.n} chapter={c} />
      ))}
      <Unprinciple />
      <NextSteps />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#241E17',
            border: '1px solid #D08C46',
            color: '#F0E7D3',
            fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
            fontSize: '12px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          },
        }}
      />
    </>
  );
}
