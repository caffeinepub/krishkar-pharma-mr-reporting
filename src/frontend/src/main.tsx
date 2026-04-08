import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// ── PWA Install Banner ────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if dismissed within the last 7 days
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedAt = Number.parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < sevenDays) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setVisible(true);
      console.log(
        "[PWA] beforeinstallprompt captured — showing install banner",
      );
    };

    const installedHandler = () => {
      console.log("[PWA] appinstalled event fired — hiding banner");
      setVisible(false);
      deferredPrompt.current = null;
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    try {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      console.log("[PWA] Install prompt outcome:", outcome);
    } catch (err) {
      console.error("[PWA] Install prompt error:", err);
    }
    deferredPrompt.current = null;
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    setVisible(false);
    console.log("[PWA] Install banner dismissed by user");
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#1e3a5f",
        color: "#ffffff",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ flex: 1, fontSize: "14px", lineHeight: "1.4" }}>
        📱 <strong>Install Krishkar MR App</strong> — Add to your home screen
        for quick access
      </span>
      <button
        type="button"
        onClick={handleInstall}
        style={{
          backgroundColor: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        data-ocid="pwa-install-btn"
      >
        Install
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        style={{
          backgroundColor: "transparent",
          color: "#fff",
          border: "none",
          fontSize: "20px",
          cursor: "pointer",
          lineHeight: 1,
          padding: "4px",
        }}
        data-ocid="pwa-install-dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
      <PWAInstallBanner />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);

// ── Service Worker Registration ───────────────────────────────────────────────

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[SW] Registered successfully. Scope:", registration.scope);
      })
      .catch((error) => {
        console.error("[SW] Registration failed:", error);
      });
  });
}
