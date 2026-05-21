"use client";

import { useEffect } from "react";

type TrackedFont = {
  label: string;
  cssVar: string;
  sampleWeight?: string;
  sampleStyle?: string;
};

type WindowWithFontDebug = Window & {
  __CF_FONT_DEBUG_HAS_RUN__?: boolean;
  __CF_RUN_FONT_DEBUG__?: () => void;
};

const TRACKED_FONTS: TrackedFont[] = [
  { label: "Woodford Bourne Pro", cssVar: "--font-woodford-bourne-pro", sampleWeight: "400" },
  { label: "Anton", cssVar: "--font-geist-anton", sampleWeight: "400" },
  { label: "Oswald", cssVar: "--font-oswald", sampleWeight: "600" },
  { label: "League Spartan", cssVar: "--font-league-spartan", sampleWeight: "400" },
  { label: "Inter", cssVar: "--font-inter", sampleWeight: "400" },
];

const stripWrappingQuotes = (value: string): string => value.replace(/^['"]+|['"]+$/g, "");

const firstFamilyFromVar = (value: string): string => {
  const first = value.split(",")[0]?.trim() ?? "";
  return stripWrappingQuotes(first);
};

const hasCssSuffix = (url: string): boolean => /\.css(\?|$)/i.test(url);

const listLoadedFontResources = (): string[] => {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") {
    return [];
  }

  return performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((name) => /\.(woff2?|ttf|otf)(\?|$)/i.test(name));
};

export default function FontDebugMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof document === "undefined" || !document.fonts) return;

    const debugWindow = window as WindowWithFontDebug;
    if (debugWindow.__CF_FONT_DEBUG_HAS_RUN__) return;
    debugWindow.__CF_FONT_DEBUG_HAS_RUN__ = true;

    const runDiagnostics = async (phase: string) => {
      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);

      const rows = TRACKED_FONTS.map((font) => {
        const rawFromBody = bodyStyle.getPropertyValue(font.cssVar).trim();
        const rawFromRoot = rootStyle.getPropertyValue(font.cssVar).trim();
        const rawValue = rawFromBody || rawFromRoot;
        const primaryFamily = firstFamilyFromVar(rawValue);
        const descriptor = `${font.sampleStyle ?? "normal"} ${font.sampleWeight ?? "400"} 16px "${primaryFamily}"`;

        return {
          font: font.label,
          cssVar: font.cssVar,
          cssVarValue: rawValue || "(empty)",
          primaryFamily: primaryFamily || "(unresolved)",
          loaded: false,
          descriptor,
        };
      });

      // Force-load declared fonts before checking, to avoid false negatives when a font
      // is declared but not yet used on the current route.
      await Promise.all(
        rows
          .filter((row) => row.primaryFamily !== "(unresolved)")
          .map(async (row) => {
            try {
              await document.fonts.load(row.descriptor, "BESbswy123");
            } catch {
              // Continue diagnostics even if one load fails.
            }
          })
      );

      const rowsWithStatus = rows.map((row) => {
        if (row.primaryFamily === "(unresolved)") return row;
        const isLoaded = document.fonts.check(row.descriptor, "BESbswy123");
        return { ...row, loaded: isLoaded };
      });

      const failed = rowsWithStatus.filter((row) => !row.loaded || row.primaryFamily === "(unresolved)");
      const fontFaces = Array.from(document.fonts.values()).map((face) => ({
        family: face.family,
        style: face.style,
        weight: String(face.weight),
        stretch: face.stretch,
        status: face.status,
      }));

      const cssAsScriptSources = Array.from(document.scripts)
        .map((script) => script.src)
        .filter((src) => src && hasCssSuffix(src));

      const loadedFontResources = listLoadedFontResources();

      console.group(`[CF Font Debug] ${phase} @ ${window.location.pathname}`);
      console.table(rowsWithStatus);
      console.log("[CF Font Debug] document.fonts.status:", document.fonts.status);
      console.log("[CF Font Debug] body.fontFamily:", bodyStyle.fontFamily);
      console.log("[CF Font Debug] html.className:", document.documentElement.className);
      console.log("[CF Font Debug] body.className:", document.body.className);
      console.table(fontFaces);
      console.log("[CF Font Debug] font resources:", loadedFontResources);
      console.log("[CF Font Debug] script tags ending with .css:", cssAsScriptSources);

      if (failed.length > 0) {
        console.error("[CF Font Debug] Some tracked fonts are not loaded/applied.", failed);
      } else {
        console.info("[CF Font Debug] All tracked fonts look loaded.");
      }

      console.groupEnd();
    };

    const onFontLoadingError = () => {
      console.error("[CF Font Debug] Browser reported a font loading error event.");
      void runDiagnostics("loadingerror-event");
    };

    const onResourceError = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const candidateUrl =
        (target as HTMLLinkElement).href ||
        (target as HTMLScriptElement).src ||
        "";

      if (/\.(woff2?|ttf|otf)(\?|$)/i.test(candidateUrl)) {
        console.error("[CF Font Debug] Resource failed to load:", candidateUrl);
      }

      if (hasCssSuffix(candidateUrl)) {
        console.error("[CF Font Debug] A CSS file failed as a script/resource:", candidateUrl);
      }
    };

    document.fonts.addEventListener("loadingerror", onFontLoadingError);
    window.addEventListener("error", onResourceError, true);
    debugWindow.__CF_RUN_FONT_DEBUG__ = () => {
      void runDiagnostics("manual-trigger");
    };

    const scriptObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLScriptElement)) return;
          if (!node.src || !hasCssSuffix(node.src)) return;
          console.error("[CF Font Debug] Detected CSS URL injected as <script src=...>:", node.src, node.outerHTML);
        });
      });
    });
    scriptObserver.observe(document.documentElement, { childList: true, subtree: true });

    // First snapshot ASAP, second after the browser finishes font loading.
    void runDiagnostics("initial");
    void document.fonts.ready.then(() => runDiagnostics("fonts-ready"));

    return () => {
      document.fonts.removeEventListener("loadingerror", onFontLoadingError);
      window.removeEventListener("error", onResourceError, true);
      scriptObserver.disconnect();
      delete debugWindow.__CF_RUN_FONT_DEBUG__;
    };
  }, []);

  return null;
}
