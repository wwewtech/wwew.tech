import React from 'react';

interface ShinyTextProps {
  text: string;
  className?: string;
  /** Duration of one shine sweep in seconds */
  speed?: number;
}

/**
 * ShinyText component - renders text with animated shine effect.
 * 
 * CRITICAL FOR LCP FIX:
 * - During SSR and before hydration: Text is shown with HIGH CONTRAST solid color (--foreground)
 * - This ensures Lighthouse detects the H1 as the LCP element immediately
 * - After hydration: The shiny gradient effect is applied
 * 
 * The key insight: `color: transparent` with `background-clip: text` may not be
 * recognized as "contentful" by Lighthouse. We need VISIBLE text first.
 */
export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  className = '',
  speed = 5,
}) => {
  return (
    <span
      className={`shiny-text ${className}`}
      style={{ 
        '--shiny-speed': `${speed}s`,
      } as React.CSSProperties}
    >
      {text}
    </span>
  );
};

export default ShinyText;
