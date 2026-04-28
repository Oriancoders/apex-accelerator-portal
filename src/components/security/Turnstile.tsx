import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          size?: "flexible" | "compact";
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const COMPACT_WIDTH_THRESHOLD = 300;

function loadTurnstileScript() {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
  if (existing) return;

  const script = document.createElement("script");
  script.src = TURNSTILE_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function Turnstile({ onToken, resetKey = 0 }: { onToken: (token: string) => void; resetKey?: number }) {
  const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim();
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [widgetSize, setWidgetSize] = useState<"flexible" | "compact">(() => {
    if (typeof window === "undefined") return "flexible";
    return window.innerWidth < 380 ? "compact" : "flexible";
  });

  useEffect(() => {
    if (!siteKey || !shellRef.current || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const nextSize = entry.contentRect.width < COMPACT_WIDTH_THRESHOLD ? "compact" : "flexible";
      setWidgetSize((currentSize) => currentSize === nextSize ? currentSize : nextSize);
    });

    observer.observe(shellRef.current);
    return () => observer.disconnect();
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) return;
    onToken("");
    loadTurnstileScript();

    let cancelled = false;
    const timer = window.setInterval(() => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size: widgetSize,
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
      window.clearInterval(timer);
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
      onToken("");
    };
  }, [onToken, siteKey, widgetSize]);

  useEffect(() => {
    onToken("");
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [onToken, resetKey]);

  if (!siteKey) return null;

  return (
    <div
      ref={shellRef}
      className="flex w-full max-w-full items-center justify-center overflow-hidden rounded-ds-md border border-border-subtle bg-card/70 px-2 py-3"
      style={{ minHeight: widgetSize === "compact" ? 164 : 89 }}
    >
      <div ref={containerRef} className="max-w-full" />
    </div>
  );
}
