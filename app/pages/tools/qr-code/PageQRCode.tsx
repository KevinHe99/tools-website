import { useState, useRef, useCallback } from "react";
import QRCode from "react-qr-code";

type Size = 128 | 256 | 512;

const SIZES: Size[] = [128, 256, 512];

export function PageQRCode() {
    const [input, setInput] = useState("");
    const [size, setSize] = useState<Size>(256);
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    const hasInput = input.trim().length > 0;

    const getSvgElement = useCallback((): SVGSVGElement | null => {
        return qrRef.current?.querySelector("svg") ?? null;
    }, []);

    async function renderToCanvas(): Promise<HTMLCanvasElement | null> {
        const svg = getSvgElement();
        if (!svg) return null;

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d")!;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                URL.revokeObjectURL(url);
                resolve(canvas);
            };
            img.src = url;
        });
    }

    async function handleDownload() {
        const canvas = await renderToCanvas();
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = "qr-code.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    async function handleCopyImage() {
        const canvas = await renderToCanvas();
        if (!canvas) return;
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }, "image/png");
    }

    function handleClear() {
        setInput("");
        setCopied(false);
    }

    return (
        <main className="min-h-screen bg-white dark:bg-gray-950 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    QR Code Generator
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    Generate a QR code from any URL or text.
                </p>

                {/* Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Text or URL
                    </label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter a URL or text…"
                        rows={4}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 text-sm font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    />
                </div>

                {/* Size toggle */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Size
                    </label>
                    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900">
                        {SIZES.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSize(s)}
                                className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    size === s
                                        ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                }`}
                            >
                                {s}px
                            </button>
                        ))}
                    </div>
                </div>

                {/* QR preview */}
                <div className="mb-8 flex justify-center">
                    <div
                        ref={qrRef}
                        className={`p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white inline-block transition-opacity ${
                            hasInput ? "opacity-100" : "opacity-30"
                        }`}
                    >
                        <QRCode
                            value={hasInput ? input : "placeholder"}
                            size={size}
                            bgColor="#ffffff"
                            fgColor="#000000"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={handleDownload}
                        disabled={!hasInput}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white text-sm font-medium transition-colors"
                    >
                        Download PNG
                    </button>
                    <button
                        onClick={handleCopyImage}
                        disabled={!hasInput}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white text-sm font-medium transition-colors"
                    >
                        {copied ? "Copied!" : "Copy image"}
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={!input}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </main>
    );
}
