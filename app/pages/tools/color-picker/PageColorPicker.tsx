import { useEffect, useMemo, useState } from "react";
import { RgbaColorPicker, HexColorInput } from "react-colorful";
import {
    type Hsl,
    type Rgb,
    analogous,
    complementary,
    contrastRatio,
    formatCmyk,
    formatHex,
    formatHsl,
    formatHsla,
    formatHsv,
    formatOklch,
    formatRgb,
    formatRgba,
    hexToRgb,
    hslToRgb,
    rgbToHex,
    rgbToHsl,
    tetradic,
    tintsAndShades,
    triadic,
    wcagLevel,
} from "./colorUtils";

declare global {
    interface Window {
        EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
    }
}

const PALETTE_KEY = "color-picker:palette";

function Swatch({
    color,
    onClick,
    title,
    size = "md",
}: {
    color: string;
    onClick?: () => void;
    title?: string;
    size?: "sm" | "md" | "lg";
}) {
    const dim = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-10 h-10";
    return (
        <button
            type="button"
            onClick={onClick}
            title={title ?? color}
            className={`${dim} rounded-md border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-105 transition-transform cursor-pointer`}
            style={{ backgroundColor: color }}
        />
    );
}

function PassPill({ label, pass }: { label: string; pass: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                pass
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
        >
            {pass ? "✓" : "✗"} {label}
        </span>
    );
}

export function PageColorPicker() {
    const [color, setColor] = useState<string>("#3b82f6");
    const [compareColor, setCompareColor] = useState<string>("#ffffff");
    const [palette, setPalette] = useState<string[]>([]);
    const [hydrated, setHydrated] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [eyedropperSupported, setEyedropperSupported] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(PALETTE_KEY);
            if (raw) setPalette(JSON.parse(raw));
        } catch {}
        setHydrated(true);
        setEyedropperSupported(typeof window !== "undefined" && "EyeDropper" in window);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(PALETTE_KEY, JSON.stringify(palette));
        } catch {}
    }, [palette, hydrated]);

    const rgb: Rgb = useMemo(() => hexToRgb(color), [color]);
    const hsl: Hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
    const compareRgb: Rgb = useMemo(() => hexToRgb(compareColor), [compareColor]);
    const ratio = useMemo(() => contrastRatio(rgb, compareRgb), [rgb, compareRgb]);
    const wcag = useMemo(() => wcagLevel(ratio), [ratio]);

    const formats: { label: string; value: string }[] = useMemo(
        () => [
            { label: "HEX", value: formatHex(rgb) },
            { label: "RGB", value: formatRgb(rgb) },
            { label: "RGBA", value: formatRgba(rgb) },
            { label: "HSL", value: formatHsl(rgb) },
            { label: "HSLA", value: formatHsla(rgb) },
            { label: "HSV", value: formatHsv(rgb) },
            { label: "CMYK", value: formatCmyk(rgb) },
            { label: "OKLCH", value: formatOklch(rgb) },
        ],
        [rgb]
    );

    function copyValue(label: string, value: string) {
        navigator.clipboard.writeText(value);
        setCopied(label);
        setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
    }

    function pickFromHsl(h: Hsl) {
        const r = hslToRgb(h);
        setColor(rgbToHex(r));
    }

    async function openEyedropper() {
        if (!window.EyeDropper) return;
        try {
            const result = await new window.EyeDropper().open();
            setColor(result.sRGBHex);
        } catch {}
    }

    function savePalette() {
        const hex = formatHex(rgb).toLowerCase();
        if (palette.includes(hex)) return;
        setPalette([hex, ...palette].slice(0, 24));
    }

    function removeSwatch(hex: string) {
        setPalette(palette.filter((p) => p !== hex));
    }

    const harmonyGroups: { label: string; colors: Hsl[] }[] = [
        { label: "Complementary", colors: [hsl, ...complementary(hsl)] },
        { label: "Analogous", colors: [analogous(hsl)[0], hsl, analogous(hsl)[1]] },
        { label: "Triadic", colors: [hsl, ...triadic(hsl)] },
        { label: "Tetradic", colors: [hsl, ...tetradic(hsl)] },
    ];

    const scale = tintsAndShades(hsl, 5);

    return (
        <main className="min-h-screen bg-white dark:bg-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Color Picker
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    Pick a color and convert to every common format. Generate harmonies, tints & shades, and check WCAG contrast.
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                        <div className="color-picker-wrap">
                            <RgbaColorPicker
                                color={rgb}
                                onChange={(c) => setColor(rgbToHex({ ...c }))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">#</span>
                            <HexColorInput
                                color={color}
                                onChange={setColor}
                                alpha
                                prefixed={false}
                                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                            />
                            {eyedropperSupported && (
                                <button
                                    type="button"
                                    onClick={openEyedropper}
                                    title="Pick color from screen"
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-medium transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m2 22 1-1h3l9-9" />
                                        <path d="M3 21v-3l9-9" />
                                        <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div
                            className="w-full aspect-square rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                            style={{
                                backgroundColor: color,
                                backgroundImage: rgb.a < 1
                                    ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                                    : undefined,
                                backgroundSize: rgb.a < 1 ? "16px 16px" : undefined,
                                backgroundPosition: rgb.a < 1 ? "0 0, 0 8px, 8px -8px, -8px 0px" : undefined,
                            }}
                        >
                            <div className="w-full h-full rounded-xl" style={{ backgroundColor: color }} />
                        </div>
                        <button
                            type="button"
                            onClick={savePalette}
                            className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                        >
                            Save to palette
                        </button>
                    </div>
                </div>

                <section className="mb-10">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Formats</h2>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {formats.map(({ label, value }, i) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => copyValue(label, value)}
                                className={`w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                                    i > 0 ? "border-t border-gray-200 dark:border-gray-700" : ""
                                }`}
                            >
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-14 shrink-0">{label}</span>
                                <span className="flex-1 font-mono text-sm text-gray-900 dark:text-gray-100 truncate">{value}</span>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                    copied === label
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : "text-gray-400 dark:text-gray-500"
                                }`}>
                                    {copied === label ? "Copied" : "Copy"}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="mb-10">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Color harmonies</h2>
                    <div className="space-y-4">
                        {harmonyGroups.map((group) => (
                            <div key={group.label}>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{group.label}</div>
                                <div className="flex gap-2 flex-wrap">
                                    {group.colors.map((h, i) => {
                                        const hex = rgbToHex(hslToRgb(h));
                                        return (
                                            <Swatch
                                                key={`${group.label}-${i}`}
                                                color={hex}
                                                onClick={() => pickFromHsl(h)}
                                                title={hex.toUpperCase()}
                                                size="md"
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-10">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tints & shades</h2>
                    <div className="flex gap-1 flex-wrap">
                        {scale.map((h, i) => {
                            const hex = rgbToHex(hslToRgb(h));
                            const isBase = i === 5;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => pickFromHsl(h)}
                                    title={hex.toUpperCase()}
                                    className={`flex-1 min-w-12 h-14 rounded-md border shadow-sm hover:scale-105 transition-transform cursor-pointer ${
                                        isBase
                                            ? "border-gray-900 dark:border-gray-100 border-2"
                                            : "border-gray-200 dark:border-gray-700"
                                    }`}
                                    style={{ backgroundColor: hex }}
                                />
                            );
                        })}
                    </div>
                </section>

                <section className="mb-10">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">WCAG contrast</h2>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Swatch color={color} size="md" />
                                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{formatHex(rgb)}</span>
                            </div>
                            <span className="text-gray-400 dark:text-gray-600">vs</span>
                            <div className="flex items-center gap-2">
                                <Swatch color={compareColor} size="md" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">#</span>
                                <HexColorInput
                                    color={compareColor}
                                    onChange={setCompareColor}
                                    prefixed={false}
                                    className="w-28 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                />
                            </div>
                            <div className="ml-auto text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                {ratio.toFixed(2)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">: 1</span>
                            </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <PassPill label="AA" pass={wcag.aaNormal} />
                            <PassPill label="AA Large" pass={wcag.aaLarge} />
                            <PassPill label="AAA" pass={wcag.aaaNormal} />
                            <PassPill label="AAA Large" pass={wcag.aaaLarge} />
                        </div>

                        <div
                            className="rounded-lg p-4"
                            style={{ backgroundColor: compareColor, color }}
                        >
                            <div className="text-lg font-semibold">Large sample text</div>
                            <div className="text-sm">The quick brown fox jumps over the lazy dog.</div>
                        </div>
                    </div>
                </section>

                <section className="mb-4">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Saved palette</h2>
                    {hydrated && palette.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No saved colors yet. Click "Save to palette" above.</p>
                    ) : (
                        <div className="flex gap-2 flex-wrap">
                            {palette.map((hex) => (
                                <div key={hex} className="relative group">
                                    <Swatch
                                        color={hex}
                                        onClick={() => setColor(hex)}
                                        size="md"
                                        title={hex.toUpperCase()}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSwatch(hex)}
                                        title="Remove"
                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <style>{`
                .color-picker-wrap .react-colorful {
                    width: 100%;
                    height: 240px;
                }
                .color-picker-wrap .react-colorful__saturation {
                    border-radius: 12px 12px 0 0;
                }
                .color-picker-wrap .react-colorful__last-control {
                    border-radius: 0 0 12px 12px;
                }
            `}</style>
        </main>
    );
}
