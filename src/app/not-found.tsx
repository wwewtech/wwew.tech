import type { Metadata } from 'next';
import { NotFoundView } from '@/components/sections/NotFoundView';

/**
 * Fallback for URLs that match no route and are not handled by
 * `global-not-found`. The latter is the file that actually serves 404s in
 * this app (it carries the document shell and the locale header), so this
 * file is a safety net rather than the primary path.
 */
export const metadata: Metadata = {
  title: '404',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return <NotFoundView />;
}
