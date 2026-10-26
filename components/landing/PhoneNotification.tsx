"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/Wordmark";

/**
 * A phone lock screen where an EchoSense push notification slides in when the phone
 * scrolls into view. The page's one orchestrated animation; reduced motion shows it
 * already in place (the global reduced-motion rule shortens the animation to nothing).
 */
export default function PhoneNotification() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = setTimeout(() => setShown(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Example: a phone lock screen showing an EchoSense notification. High alert, Grade 6, the words “bobo ka” were heard, just now."
      className="dark mx-auto w-[260px] shrink-0 sm:w-[290px]"
    >
      {/* Fixed aspect ratio so nothing shifts while the notification arrives. */}
      <div className="relative aspect-[9/19] rounded-[44px] border border-[#2a2a2a] bg-[#0a0a0a] p-[10px] shadow-[0_30px_80px_-30px_rgb(0_0_0_/_0.6)]">
        <div className="relative h-full overflow-hidden rounded-[34px] bg-[radial-gradient(120%_70%_at_50%_0%,#163d2b_0%,#07130d_45%,#000_100%)]">
          <div aria-hidden="true" className="absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div aria-hidden="true" className="pt-16 text-center text-white">
            <p className="text-[13px] font-medium text-white/70">Monday, 26 October</p>
            <p className="num mt-1 text-[64px] font-medium leading-none tracking-[-0.03em]">8:15</p>
          </div>

          <div aria-hidden="true" className="absolute inset-x-3 top-[46%]">
            <div
              className={`rounded-[18px] bg-[#1c1c1e]/95 p-3 text-white ring-1 ring-white/10 ${
                shown ? "es-notify" : "opacity-0"
              }`}
            >
              <div className="flex items-center gap-2">
                <LogoMark className="h-5 w-5" />
                <span className="text-[12px] font-medium tracking-wide text-white/60">EchoSense</span>
                <span className="ml-auto text-[12px] text-white/50">now</span>
              </div>
              <p className="mt-2 text-[14px] font-semibold leading-5">High · Grade 6</p>
              <p className="text-[14px] leading-5 text-white/85">“bobo ka” · just now</p>
              <p className="mt-1 text-[12px] leading-4 text-white/55">Possible concern. Open to review.</p>
            </div>
          </div>

          <div aria-hidden="true" className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/60" />
        </div>
      </div>
    </div>
  );
}
