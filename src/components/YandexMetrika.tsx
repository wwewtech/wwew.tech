"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Script from "next/script";
import { YM_ID, YM_SRC } from "@/lib/metrika";

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

/**
 * Loads the Yandex Metrika tag off the critical path.
 *
 * The tag used to be inlined in <head>, fetching ~70 KB of script on every
 * pageview and competing with the app's own chunks for the connection during
 * first paint. next/script with the default afterInteractive strategy injects
 * it after hydration instead, so the analytics load stops delaying the page.
 */
export default function YandexMetrika() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Client-side navigations are not a page load from Metrika's perspective;
  // send a hit manually, skipping the initial one the tag fires by itself.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.ym?.(YM_ID, "hit", window.location.href);
  }, [pathname]);

  return (
    <>
      {/*
        lazyOnload instead of afterInteractive: analytics does not need to
        run during hydration. afterInteractive injects the tag while React
        is still hydrating, which showed up as extra main-thread work on a
        throttled CPU; lazyOnload waits until the window load event, so the
        page becomes interactive first and the tag loads strictly after.
      */}
      <Script
        id="ym-loader"
        strategy="lazyOnload"
      >{`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window, document,'script','${YM_SRC}', 'ym');ym(${YM_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`}</Script>
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
