import { ClientHomePage } from '@/components/ClientHomePage';

export default function Home() {
  return (
    <>
      <noscript>
        <style>{`
          .hero-ssr-skeleton { display: none !important; }
        `}</style>
      </noscript>
      <ClientHomePage />
    </>
  );
}

