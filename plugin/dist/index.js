/**
 * Omatchy — Omarchy ↔ Hermes Dashboard Theme Bridge
 *
 * Registers two slots:
 *   - header-right: Minimal desktop icon (footer bar, inherits sidebar colour)
 *   - overlay:      Toast notification on theme change
 *
 * Polls /status every 3s. Injects CSS variables into :root on every update.
 * Shows toast only when omarchyTheme actually changes.
 */
(function () {
  "use strict";

  const SDK = window.__HERMES_PLUGIN_SDK__;
  const PLUGINS = window.__HERMES_PLUGINS__;
  if (!SDK || !PLUGINS || !PLUGINS.registerSlot) {
    console.warn("[Omatchy] Plugin SDK not available — skipping init");
    return;
  }

  const { React } = SDK;
  const { useState, useEffect, useRef } = SDK.hooks;
  const { fetchJSON } = SDK;

  // -----------------------------------------------------------------------
  // CSS variable builders (mirrors web/src/themes/context.tsx)
  // -----------------------------------------------------------------------

  function layerVar(name, layer) {
    const pct = Math.round(layer.alpha * 100);
    return {
      [`--${name}`]: `color-mix(in srgb, ${layer.hex} ${pct}%, transparent)`,
      [`--${name}-base`]: layer.hex,
      [`--${name}-alpha`]: String(layer.alpha),
    };
  }

  function applyThemeVars(def) {
    if (typeof document === "undefined") return;
    const active =
      typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem("hermes-dashboard-theme")
        : null;
    if (active && active !== "omatchy") return;

    const root = document.documentElement;
    const p = def.palette;
    const vars = {};

    Object.assign(vars, layerVar("background", p.background));
    Object.assign(vars, layerVar("midground", p.midground));
    Object.assign(vars, layerVar("foreground", p.foreground));
    vars["--warm-glow"] = p.warmGlow;
    vars["--noise-opacity-mul"] = String(p.noiseOpacity);

    if (def.typography) {
      vars["--theme-font-sans"] = def.typography.fontSans || "";
      vars["--theme-font-mono"] = def.typography.fontMono || "";
    }

    const OVERRIDE_MAP = {
      card: "--color-card",
      cardForeground: "--color-card-foreground",
      popover: "--color-popover",
      popoverForeground: "--color-popover-foreground",
      primary: "--color-primary",
      primaryForeground: "--color-primary-foreground",
      secondary: "--color-secondary",
      secondaryForeground: "--color-secondary-foreground",
      muted: "--color-muted",
      mutedForeground: "--color-muted-foreground",
      accent: "--color-accent",
      accentForeground: "--color-accent-foreground",
      destructive: "--color-destructive",
      destructiveForeground: "--color-destructive-foreground",
      success: "--color-success",
      warning: "--color-warning",
      border: "--color-border",
      input: "--color-input",
      ring: "--color-ring",
    };

    if (def.colorOverrides) {
      for (const key of Object.keys(def.colorOverrides)) {
        const cssVar = OVERRIDE_MAP[key];
        if (cssVar) {
          vars[cssVar] = def.colorOverrides[key];
        }
      }
    }

    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v);
    }
  }

  // -----------------------------------------------------------------------
  // Polling hook
  // -----------------------------------------------------------------------

  function useOmatchyStatus() {
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);

    useEffect(function () {
      let cancelled = false;

      async function poll() {
        try {
          const s = await fetchJSON("/api/plugins/omatchy/status");
          if (cancelled) return;
          setStatus(function (prev) {
            if (prev && prev.omarchyTheme === s.omarchyTheme) {
              return prev;
            }
            return s;
          });
          setError(null);
        } catch (e) {
          if (!cancelled) setError(e.message || "poll failed");
        }
      }

      poll();
      const id = setInterval(poll, 3000);
      return function () {
        cancelled = true;
        clearInterval(id);
      };
    }, []);

    useEffect(function () {
      if (status) {
        applyThemeVars(status);
      }
    }, [status]);

    return { status, error };
  }

  // -----------------------------------------------------------------------
  // Previous-value hook (for detecting changes)
  // -----------------------------------------------------------------------

  function usePrevious(value) {
    const ref = useRef(null);
    useEffect(function () {
      ref.current = value;
    });
    return ref.current;
  }

  // -----------------------------------------------------------------------
  // Pretty-print theme name
  // -----------------------------------------------------------------------

  function prettyTheme(name) {
    if (!name || name === "…") return name;
    return name
      .replace(/(^|-)([a-z])/g, function (_, dash, letter) {
        return (dash ? " " : "") + letter.toUpperCase();
      })
      .trim();
  }

  // -----------------------------------------------------------------------
  // Slot 1: header-right — minimal desktop icon (footer bar)
  // -----------------------------------------------------------------------

  function OmatchyIcon() {
    const { status, error } = useOmatchyStatus();

    const themeLabel = status ? status.omarchyTheme : "…";
    const installed = status ? status.installed : false;
    const fallback = status ? status.fallback : false;
    const pretty = prettyTheme(themeLabel);

    const tooltip = error
      ? "Omatchy: " + error
      : !installed
        ? "Omatchy: Omarchy not detected"
        : fallback
          ? "Omatchy bridge active — " + pretty + " (fallback colors)"
          : "Omatchy bridge active — " + pretty;

    // Neutral inline-flex peer: let the parent's `items-center` and `gap-2`
    // handle alignment.  We match the ThemeSwitcher button height (1.5rem)
    // so our optical center lines up with the adjacent text+icons.
    return React.createElement(
      "span",
      {
        title: tooltip,
        style: {
          display: "inline-flex",
          alignItems: "center",
          opacity: installed ? 0.6 : 0.3,
          transition: "opacity 300ms",
          cursor: "default",
        },
      },
      React.createElement(
        "svg",
        {
          width: "14",
          height: "14",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        React.createElement("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }),
        React.createElement("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
        React.createElement("line", { x1: "12", y1: "17", x2: "12", y2: "21" }),
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Slot 2: overlay — toast on theme change
  // -----------------------------------------------------------------------

  function OmatchyToast() {
    const { status } = useOmatchyStatus();
    const prevTheme = usePrevious(status ? status.omarchyTheme : null);
    const [toast, setToast] = useState(null);

    useEffect(function () {
      if (!status || !status.installed) return;
      const active =
        typeof window !== "undefined" && window.localStorage
          ? window.localStorage.getItem("hermes-dashboard-theme")
          : null;
      if (active && active !== "omatchy") return;
      const current = status.omarchyTheme;

      // Show toast when theme actually changes (not on initial load)
      if (prevTheme && prevTheme !== current) {
        setToast({
          message: "Theme " + prettyTheme(current) + " synced by Omatchy",
          type: "success",
        });
        const timer = setTimeout(function () {
          setToast(null);
        }, 3500);
        return function () {
          clearTimeout(timer);
        };
      }
    }, [status ? status.omarchyTheme : null]);

    if (!toast) return null;

    return React.createElement(
      "div",
      {
        role: "status",
        "aria-live": "polite",
        style: {
          position: "fixed",
          top: "4rem",
          right: "1rem",
          zIndex: 9999,
          border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
          background: "color-mix(in srgb, var(--color-primary) 12%, var(--background))",
          color: "var(--color-primary)",
          padding: "0.65rem 1rem",
          borderRadius: "0.375rem",
          fontFamily: "var(--theme-font-mono, monospace)",
          fontSize: "0.75rem",
          letterSpacing: "0.04em",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: "omatchy-toast-in 250ms ease-out forwards",
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          maxWidth: "320px",
          wordBreak: "break-word",
        },
      },
      toast.message,
    );
  }

  // -----------------------------------------------------------------------
  // Hidden page fallback
  // -----------------------------------------------------------------------

  function OmatchyPage() {
    const { status, error } = useOmatchyStatus();
    return React.createElement(
      "div",
      {
        style: {
          padding: "2rem",
          maxWidth: 640,
          lineHeight: 1.6,
        },
      },
      React.createElement("h2", null, "Omatchy Bridge"),
      React.createElement(
        "p",
        null,
        status
          ? "Omarchy theme: " + status.omarchyTheme
          : error
            ? "Error: " + error
            : "Loading…",
      ),
      React.createElement(
        "p",
        { style: { opacity: 0.6, fontSize: "0.85rem" } },
        "This plugin runs in the background. It polls your Omarchy desktop theme every 3 seconds and mirrors it into the Hermes dashboard.",
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Global toast animation keyframes (inject once)
  // -----------------------------------------------------------------------

  (function injectKeyframes() {
    if (typeof document === "undefined") return;
    const id = "omatchy-toast-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent =
      "@keyframes omatchy-toast-in {" +
      "  from { opacity: 0; transform: translateY(-8px); }" +
      "  to   { opacity: 1; transform: translateY(0); }" +
      "}";
    document.head.appendChild(style);
  })();

  // -----------------------------------------------------------------------
  // Registration
  // -----------------------------------------------------------------------

  const NAME = "omatchy";
  PLUGINS.register(NAME, OmatchyPage);
  PLUGINS.registerSlot(NAME, "header-right", OmatchyIcon);
  PLUGINS.registerSlot(NAME, "overlay", OmatchyToast);

  console.log("[Omatchy] Plugin registered (header-right icon + toast)");
})();
