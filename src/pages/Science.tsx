import ScienceHeader from '@/components/science/ScienceHeader';
import CitationIndex from '@/components/science/CitationIndex';
import EnginePipeline from '@/components/science/EnginePipeline';
import Privacy from '@/components/science/Privacy';
import EthicsManifesto from '@/components/science/EthicsManifesto';
import Faq from '@/components/science/Faq';
import Colophon from '@/components/science/Colophon';

/**
 * Science — `/science` (science.md). The trust page: full citation index,
 * engine pipeline diagram, privacy guarantees, ethics manifesto, FAQ, and
 * colophon — typeset like a journal appendix.
 */
export default function Science() {
  return (
    <>
      <ScienceHeader />
      <CitationIndex />
      <EnginePipeline />
      <Privacy />
      <EthicsManifesto />
      <Faq />
      <Colophon />
    </>
  );
}
