import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript() {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
  if (existing) return;

  const script = document.createElement("script");
  script.src = TURNSTILE_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    onToken("");
    loadTurnstileScript();

    let cancelled = false;
    const timer = window.setInterval(() => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
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
  }, [onToken, siteKey]);

  if (!siteKey) return null;

  return (
    <div className="flex min-h-[65px] items-center justify-center rounded-ds-md border border-border-subtle bg-card/70">
      <div ref={containerRef} />
    </div>
  );
}
