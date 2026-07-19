/** Converts a hex color string to HSL components. */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Converts HSL to a hex color string. */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return (
    "#" +
    [f(0), f(8), f(4)]
      .map((x) => Math.round(x * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Applies a hex brand color as CSS variables on the document root.
 * Sets color, shadow, and glow variables used across the site.
 */
export function applyBrandColor(hex: string) {
  const hsl = hexToHsl(hex);
  const rgb = hexToRgb(hex);
  if (!hsl || !rgb) return;
  const hslValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
  const shadowColor = `${hsl.h} ${Math.min(100, Math.max(20, hsl.s))}% ${Math.max(12, hsl.l - 18)}%`;

  const darkLuminosity = Math.max(15, hsl.l - 20);
  const lightLuminosity = 97;
  const borderLuminosity = 90;
  const viaLuminosity = Math.min(85, hsl.l + 20);

  const darkHsl = `${hsl.h} ${hsl.s}% ${darkLuminosity}%`;
  const lightHsl = `${hsl.h} ${Math.min(30, hsl.s)}% ${lightLuminosity}%`;
  const borderHsl = `${hsl.h} ${Math.min(40, hsl.s)}% ${borderLuminosity}%`;
  const viaHsl = `${hsl.h} ${hsl.s}% ${viaLuminosity}%`;

  document.documentElement.style.setProperty("--primary", hslValue);
  document.documentElement.style.setProperty("--primary-hex", hex);
  document.documentElement.style.setProperty("--primary-dark", darkHsl);
  document.documentElement.style.setProperty("--primary-light", lightHsl);
  document.documentElement.style.setProperty("--primary-border-light", borderHsl);
  document.documentElement.style.setProperty("--primary-via", viaHsl);

  document.documentElement.style.setProperty("--ring", hslValue);
  document.documentElement.style.setProperty("--chart-1", hslValue);
  document.documentElement.style.setProperty("--accent", `${hsl.h} ${Math.min(100, hsl.s + 5)}% ${Math.min(82, hsl.l + 26)}%`);
  document.documentElement.style.setProperty("--shadow-color", shadowColor);
  document.documentElement.style.setProperty("--primary-shadow", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
  document.documentElement.style.setProperty("--primary-glow", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.24)`);
  document.documentElement.style.setProperty("--shadow-2xs", `0px 2px 0px 0px hsl(${shadowColor} / 0.05)`);
  document.documentElement.style.setProperty("--shadow-xs", `0px 2px 0px 0px hsl(${shadowColor} / 0.1)`);
  document.documentElement.style.setProperty("--shadow-sm", `0px 2px 0px 0px hsl(${shadowColor} / 0.06), 0px 1px 2px -1px hsl(${shadowColor} / 0.16)`);
  document.documentElement.style.setProperty("--shadow", `0px 2px 0px 0px hsl(${shadowColor} / 0.08), 0px 1px 2px -1px hsl(${shadowColor} / 0.18)`);
  document.documentElement.style.setProperty("--shadow-md", `0px 2px 0px 0px hsl(${shadowColor} / 0.08), 0px 2px 4px -1px hsl(${shadowColor} / 0.2)`);
  document.documentElement.style.setProperty("--shadow-lg", `0px 2px 0px 0px hsl(${shadowColor} / 0.08), 0px 4px 10px -2px hsl(${shadowColor} / 0.22)`);
  document.documentElement.style.setProperty("--shadow-xl", `0px 2px 0px 0px hsl(${shadowColor} / 0.08), 0px 10px 24px -6px hsl(${shadowColor} / 0.28)`);
  document.documentElement.style.setProperty("--shadow-2xl", `0px 18px 48px -16px hsl(${shadowColor} / 0.38)`);
}
