/**
 * Omatchy — Omarchy ↔ Hermes Dashboard Theme Bridge
 *
 * A hidden slot-only plugin that polls the Omarchy theme state and mirrors
 * it into the Hermes dashboard via direct CSS variable injection.
 *
 * Registers in the header-right slot showing the current Omarchy theme name.
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
  const { useState, useEffect } = SDK.hooks;
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
    const root = document.documentElement;
    const p = def.palette;
    const vars = {};

    // Palette layers
    Object.assign(vars, layerVar("background", p.background));
    Object.assign(vars, layerVar("midground", p.midground));
    Object.assign(vars, layerVar("foreground", p.foreground));
    vars["--warm-glow"] = p.warmGlow;
    vars["--noise-opacity-mul"] = String(p.noiseOpacity);

    // Typography
    if (def.typography) {
      vars["--theme-font-sans"] = def.typography.fontSans || "";
      vars["--theme-font-mono"] = def.typography.fontMono || "";
    }

    // Color overrides
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
            // Only update if Omarchy theme actually changed
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
  // Header-right badge slot
  // -----------------------------------------------------------------------

  function OmatchyBadge() {
    const { status, error } = useOmatchyStatus();

    const themeLabel = status ? status.omarchyTheme : "…";
    const installed = status ? status.installed : false;

    // Pretty-print theme name: "catppuccin-dark" → "Catppuccin Dark"
    const pretty = themeLabel
      .replace(/(^|-)([a-z])/g, function (_, dash, letter) {
        return (dash ? " " : "") + letter.toUpperCase();
      })
      .replace(/\bDark\b/g, "dark")  // keep branding lowercase if desired
      .trim();

    return React.createElement(
      "span",
      {
        title: error
          ? "Omatchy: " + error
          : installed
            ? "Omatchy bridge active — " + themeLabel
            : "Omatchy: Omarchy not detected",
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: "0.72rem",
          fontFamily: "var(--theme-font-mono, monospace)",
          letterSpacing: "0.04em",
          opacity: installed ? 0.8 : 0.4,
          padding: "0.15rem 0.4rem",
          borderRadius: "0.25rem",
          border: "1px solid var(--color-border, rgba(255,255,255,0.1))",
          background: installed
            ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
            : "transparent",
          color: installed ? "var(--color-primary)" : "inherit",
          transition: "background 300ms, color 300ms, border-color 300ms",
        },
      },
      React.createElement("span", { style: { fontSize: "0.8rem" } }, "🔗"),
      React.createElement("span", null, "Omatchy"),
      React.createElement("span", { style: { opacity: 0.5 } }, "·"),
      React.createElement("span", { style: { fontWeight: 600 } }, pretty),
    );
  }

  // -----------------------------------------------------------------------
  // Hidden page (rarely rendered, but provides a sensible fallback)
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
  // Registration
  // -----------------------------------------------------------------------

  const NAME = "omatchy";
  PLUGINS.register(NAME, OmatchyPage);
  PLUGINS.registerSlot(NAME, "header-right", OmatchyBadge);

  console.log("[Omatchy] Plugin registered");
})();
