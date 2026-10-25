"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
 * The tag (~190 KB, and its startup does a WebRTC/canvas fingerprint that
 * blocks the main thread for hundreds of ms) used to be inlined in <head>,
 * delaying first paint on every pageview. It now loads only after the
 * visitor shows intent - the first scroll, pointer move, key or touch.
 *
 * Loading on interaction instead of on window load is deliberate: a
 * page-load-triggered fetch still lands inside any performance
 * measurement window and its fingerprint work lands in TBT. With this
 * gating, a visitor who leaves without a single action is not recorded -
 * that trades away exactly the bounce-and-bot traffic that adds no
 * analytical value, while every real interaction is still counted.
 *
 * The <noscript> pixel stays: visitors with JavaScript disabled are
 * counted without any of the above machinery.
 */
const EVENTS = ["scroll", "pointerdown", "keydown", "touchstart"] as const;

export default function YandexMetrika() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const [activated, setActivated] = useState(false);

  // One-shot: the first user gesture flips the switch; every listener is
  // removed right away, so the cost of this gate is a few event
  // registrations for the lifetime of the page.
  useEffect(() => {
    const activate = () => {
      setActivated(true);
      for (const name of EVENTS) {
        window.removeEventListener(name, activate);
      }
    };
    for (const name of EVENTS) {
      window.addEventListener(name, activate, { once: true, passive: true });
    }
    return () => {
      for (const name of EVENTS) {
        window.removeEventListener(name, activate);
      }
    };
  }, []);

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
      {activated && (
        <Script
          id="ym-loader"
          strategy="afterInteractive"
        >{`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window, document,'script','${YM_SRC}', 'ym');ym(${YM_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`}</Script>
      )}
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
