export type Rgb = { r: number; g: number; b: number; a: number };
export type Hsl = { h: number; s: number; l: number; a: number };
export type Hsv = { h: number; s: number; v: number; a: number };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number, p = 0) => {
    const m = Math.pow(10, p);
    return Math.round(n * m) / m;
};

export function hexToRgb(hex: string): Rgb {
    let h = hex.trim().replace(/^#/, "");
    if (h.length === 3 || h.length === 4) {
        h = h.split("").map((c) => c + c).join("");
    }
    if (h.length === 6) h += "ff";
    if (h.length !== 8 || /[^0-9a-fA-F]/.test(h)) {
        return { r: 0, g: 0, b: 0, a: 1 };
    }
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: parseInt(h.slice(6, 8), 16) / 255,
    };
}

export function rgbToHex({ r, g, b, a }: Rgb): string {
    const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
    const base = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    if (a >= 1) return base;
    const alpha = clamp(Math.round(a * 255), 0, 255).toString(16).padStart(2, "0");
    return `${base}${alpha}`;
}

export function rgbToHsl({ r, g, b, a }: Rgb): Hsl {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
            case gn: h = (bn - rn) / d + 2; break;
            case bn: h = (rn - gn) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100, a };
}

export function hslToRgb({ h, s, l, a }: Hsl): Rgb {
    const hn = ((h % 360) + 360) % 360 / 360;
    const sn = clamp(s, 0, 100) / 100;
    const ln = clamp(l, 0, 100) / 100;
    if (sn === 0) {
        const v = ln * 255;
        return { r: v, g: v, b: v, a };
    }
    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    const hue2rgb = (t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    return {
        r: hue2rgb(hn + 1 / 3) * 255,
        g: hue2rgb(hn) * 255,
        b: hue2rgb(hn - 1 / 3) * 255,
        a,
    };
}

export function rgbToHsv({ r, g, b, a }: Rgb): Hsv {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const d = max - min;
    const v = max;
    const s = max === 0 ? 0 : d / max;
    let h = 0;
    if (d !== 0) {
        switch (max) {
            case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
            case gn: h = (bn - rn) / d + 2; break;
            case bn: h = (rn - gn) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100, a };
}

export function hsvToRgb({ h, s, v, a }: Hsv): Rgb {
    const hn = ((h % 360) + 360) % 360 / 60;
    const sn = clamp(s, 0, 100) / 100;
    const vn = clamp(v, 0, 100) / 100;
    const c = vn * sn;
    const x = c * (1 - Math.abs((hn % 2) - 1));
    const m = vn - c;
    let r = 0, g = 0, b = 0;
    if (hn < 1) { r = c; g = x; b = 0; }
    else if (hn < 2) { r = x; g = c; b = 0; }
    else if (hn < 3) { r = 0; g = c; b = x; }
    else if (hn < 4) { r = 0; g = x; b = c; }
    else if (hn < 5) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255, a };
}

export function rgbToCmyk({ r, g, b }: Rgb): { c: number; m: number; y: number; k: number } {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const k = 1 - Math.max(rn, gn, bn);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    const c = (1 - rn - k) / (1 - k);
    const m = (1 - gn - k) / (1 - k);
    const y = (1 - bn - k) / (1 - k);
    return { c: c * 100, m: m * 100, y: y * 100, k: k * 100 };
}

function srgbToLinear(c: number): number {
    const n = c / 255;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

export function rgbToOklch({ r, g, b }: Rgb): { l: number; c: number; h: number } {
    const rl = srgbToLinear(r);
    const gl = srgbToLinear(g);
    const bl = srgbToLinear(b);

    const l_ = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
    const m_ = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
    const s_ = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

    const l = Math.cbrt(l_);
    const m = Math.cbrt(m_);
    const s = Math.cbrt(s_);

    const okL = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    const okA = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    const okB = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

    const C = Math.sqrt(okA * okA + okB * okB);
    let H = Math.atan2(okB, okA) * (180 / Math.PI);
    if (H < 0) H += 360;

    return { l: okL, c: C, h: H };
}

export function formatHex(rgb: Rgb): string {
    return rgbToHex(rgb).toUpperCase();
}

export function formatRgb(rgb: Rgb): string {
    return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
}

export function formatRgba(rgb: Rgb): string {
    return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${round(rgb.a, 2)})`;
}

export function formatHsl(rgb: Rgb): string {
    const { h, s, l } = rgbToHsl(rgb);
    return `hsl(${round(h)}, ${round(s)}%, ${round(l)}%)`;
}

export function formatHsla(rgb: Rgb): string {
    const { h, s, l, a } = rgbToHsl(rgb);
    return `hsla(${round(h)}, ${round(s)}%, ${round(l)}%, ${round(a, 2)})`;
}

export function formatHsv(rgb: Rgb): string {
    const { h, s, v } = rgbToHsv(rgb);
    return `hsv(${round(h)}, ${round(s)}%, ${round(v)}%)`;
}

export function formatCmyk(rgb: Rgb): string {
    const { c, m, y, k } = rgbToCmyk(rgb);
    return `cmyk(${round(c)}%, ${round(m)}%, ${round(y)}%, ${round(k)}%)`;
}

export function formatOklch(rgb: Rgb): string {
    const { l, c, h } = rgbToOklch(rgb);
    return `oklch(${round(l * 100, 2)}% ${round(c, 3)} ${round(h, 2)})`;
}

function shiftHue(hsl: Hsl, delta: number): Hsl {
    return { ...hsl, h: ((hsl.h + delta) % 360 + 360) % 360 };
}

export function complementary(hsl: Hsl): Hsl[] {
    return [shiftHue(hsl, 180)];
}

export function analogous(hsl: Hsl): Hsl[] {
    return [shiftHue(hsl, -30), shiftHue(hsl, 30)];
}

export function triadic(hsl: Hsl): Hsl[] {
    return [shiftHue(hsl, 120), shiftHue(hsl, 240)];
}

export function tetradic(hsl: Hsl): Hsl[] {
    return [shiftHue(hsl, 90), shiftHue(hsl, 180), shiftHue(hsl, 270)];
}

export function tintsAndShades(hsl: Hsl, steps = 5): Hsl[] {
    const out: Hsl[] = [];
    for (let i = steps; i >= 1; i--) {
        const t = i / (steps + 1);
        out.push({ ...hsl, l: hsl.l + (100 - hsl.l) * t });
    }
    out.push(hsl);
    for (let i = 1; i <= steps; i++) {
        const t = i / (steps + 1);
        out.push({ ...hsl, l: hsl.l * (1 - t) });
    }
    return out;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
    const rl = srgbToLinear(r);
    const gl = srgbToLinear(g);
    const bl = srgbToLinear(b);
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function contrastRatio(a: Rgb, b: Rgb): number {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const [light, dark] = la > lb ? [la, lb] : [lb, la];
    return (light + 0.05) / (dark + 0.05);
}

export function wcagLevel(ratio: number) {
    return {
        aaNormal: ratio >= 4.5,
        aaLarge: ratio >= 3,
        aaaNormal: ratio >= 7,
        aaaLarge: ratio >= 4.5,
    };
}
