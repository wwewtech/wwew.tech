"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const YM_ID = 113599475;

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
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}", "ym");
          ym(${YM_ID}, "init", {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${YM_ID}`}
            style={{ position: "absolute", left: -9999 }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
