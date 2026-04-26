"use client";
import { useEffect, useState } from "react";

export function SavedToast({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setFading(false);
    setVisible(true);
    const fadeOut = setTimeout(() => setFading(true), 1400);
    const hide = setTimeout(() => setVisible(false), 1900);
    return () => { clearTimeout(fadeOut); clearTimeout(hide); };
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-gray-900 text-white text-sm shadow-xl"
      style={{
        transition: "opacity 400ms ease, transform 400ms ease",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateX(-50%) translateY(8px)" : "translateX(-50%) translateY(0px)",
      }}
    >
      <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Changes saved
    </div>
  );
}
