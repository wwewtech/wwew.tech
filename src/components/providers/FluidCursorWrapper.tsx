'use client';

import dynamic from 'next/dynamic';
import { useFluidCursor } from '@/context/AppContext';
import { useState } from 'react';

// Ленивая загрузка тяжёлого WebGL компонента - ТОЛЬКО когда включён
const FluidCursor = dynamic(
  () => import('@/components/ui/FluidCursor').then(mod => mod.FluidCursor),
  {
    ssr: false,
    loading: () => null
  }
);

// Latch derived state: once the user enables the cursor, keep the component
// mounted so its WebGL context isn't recreated on subsequent toggles.
// See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
export const FluidCursorWrapper = () => {
  const { isFluidCursorEnabled } = useFluidCursor();
  const [hasEverBeenEnabled, setHasEverBeenEnabled] = useState(false);

  if (isFluidCursorEnabled && !hasEverBeenEnabled) {
    setHasEverBeenEnabled(true);
  }

  if (!hasEverBeenEnabled) {
    return null;
  }

  return <FluidCursor />;
};
