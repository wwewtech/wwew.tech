import type { Metadata } from 'next';
import { NotFoundView } from '@/components/sections/NotFoundView';

// 404 responses must not be cached as a permanent page.
export const metadata: Metadata = {
  title: '404',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LocaleNotFound() {
  return <NotFoundView />;
}
