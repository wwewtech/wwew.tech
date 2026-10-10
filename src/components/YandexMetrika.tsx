"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { YM_ID } from "@/lib/metrika";

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

export default function YandexMetrika() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.ym?.(YM_ID, "hit", window.location.href);
  }, [pathname]);

  return (
    <noscript>
      <div>
        <img
          src={`https://mc.yandex.ru/watch/${YM_ID}`}
          style={{ position: "absolute", left: -9999 }}
          alt=""
        />
      </div>
    </noscript>
  );
}
