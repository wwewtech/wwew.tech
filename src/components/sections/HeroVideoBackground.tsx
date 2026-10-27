'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Looping video stand-in for the Prism WebGL shader, served to devices that
 * asked for reduced motion or are on a data-saving connection (see
 * HeroBackground for the detection rationale).
 *
 * The clip is the real shader recorded from the live page
 * (scripts/record_hero.py), so the visual matches the WebGL hero closely;
 * playback is muted, looping, plays inline and pauses when the tab is
 * hidden or the hero is scrolled away, mirroring the shader's own
 * suspendWhenOffscreen behaviour.
 *
 * Naming note: the in-view state is called `onScreen` deliberately -
 * Tailwind v4 scans source files for candidate class names, and a certain
 * bare word for "can be seen" in this file once emitted a stray CSS
 * utility into the production stylesheet (the same class of problem the
 * locale-cookie tests hit with a test fixture variable whose name matched
 * an HTML display keyword).
 */
export const HeroVideoBackground: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [onScreen, setOnScreen] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(Boolean(entry?.isIntersecting)),
      { threshold: 0.05 },
    );
    if (videoRef.current) io.observe(videoRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onVisibility = () => {
      if (document.hidden) video.pause();
      else if (onScreen) void video.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    // Drive play/pause from the same listener set instead of a second
    // effect with a synchronous setState-style call pattern.
    if (onScreen && !document.hidden) void video.play().catch(() => {});
    else video.pause();
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [onScreen]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover"
      src={isDark ? '/hero-bg-dark.webm' : '/hero-bg-light.webm'}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      aria-hidden="true"
    />
  );
};
