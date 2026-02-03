'use client';

import dynamic from 'next/dynamic';
import { useFluidCursor } from '@/lib/context';
import { useEffect, useState } from 'react';

// Ленивая загрузка тяжёлого WebGL компонента - ТОЛЬКО когда включён
const FluidCursor = dynamic(
  () => import('./FluidCursor').then(mod => mod.FluidCursor),
  { 
    ssr: false,
    loading: () => null
  }
);

export const FluidCursorWrapper = () => {
  const { isFluidCursorEnabled } = useFluidCursor();
  const [hasEverBeenEnabled, setHasEverBeenEnabled] = useState(false);

  // Загружаем компонент только когда пользователь впервые включит эффект
  useEffect(() => {
    if (isFluidCursorEnabled && !hasEverBeenEnabled) {
      setHasEverBeenEnabled(true);
    }
  }, [isFluidCursorEnabled, hasEverBeenEnabled]);

  // Не загружаем компонент вообще пока эффект не был включён хотя бы раз
  if (!hasEverBeenEnabled) {
    return null;
  }

  return <FluidCursor />;
};
