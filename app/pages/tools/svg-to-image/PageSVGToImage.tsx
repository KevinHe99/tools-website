import { useState, useEffect, useRef } from "react";

type Format = "png" | "jpeg" | "webp";
type Scale = 1 | 2 | 3;

const FORMATS: Format[] = ["png", "jpeg", "webp"];
const SCALES: Scale[] = [1, 2, 3];

export function PageSVGToImage() {
  const [svgInput, setSvgInput] = useState("");
  const [format, setFormat] = useState<Format>("png");
  const [scale, setScale] = useState<Scale>(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!svgInput.trim()) {
      setPreviewUrl(null);
      setError(null);
      return;
    }
    if (!svgInput.includes("<svg")) {
      setPreviewUrl(null);
      setError("Input doesn't appear to be valid SVG markup.");
      return;
    }
    setError(null);
    const blob = new Blob([svgInput], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [svgInput]);

  async function toDataUrl(): Promise<string> {
    const img = imgRef.current!;
    await new Promise<void>((resolve, reject) => {
      if (img.complete && img.naturalWidth > 0) { resolve(); return; }
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load SVG."));
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    const ctx = canvas.getContext("2d")!;
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(`image/${format}`);
  }

  async function handleDownload() {
    try {
      const dataUrl = await toDataUrl();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `image.${format}`;
      a.click();
    } catch {
      setError("Conversion failed. Make sure your SVG has explicit width and height attributes.");
    }
  }

  async function handleCopy() {
    try {
      const dataUrl = await toDataUrl();
      await navigator.clipboard.writeText(dataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed. Make sure your SVG has explicit width and height attributes.");
    }
  }

  function handleClear() {
    setSvgInput("");
    setPreviewUrl(null);
    setError(null);
    setCopied(false);
  }

  const canConvert = !!previewUrl && !error;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          SVG to Image
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Paste SVG markup and download it as a raster image using the browser
          canvas API — no uploads, no dependencies.
        </p>

        {/* SVG input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            SVG markup
          </label>
          <textarea
            value={svgInput}
            onChange={(e) => setSvgInput(e.target.value)}
            placeholder={'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">\n  …\n</svg>'}
            rows={10}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${
              error
                ? "border-red-300 dark:border-red-700"
                : "border-gray-200 dark:border-gray-700"
            }`}
          />
          {error && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Format toggle */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Output format
          </label>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors uppercase ${
                  format === f
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Scale selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Scale
          </label>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900">
            {SCALES.map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  scale === s
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={handleDownload}
            disabled={!canConvert}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white text-sm font-medium transition-colors"
          >
            Download {format.toUpperCase()}
          </button>
          <button
            onClick={handleCopy}
            disabled={!canConvert}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 text-sm font-medium transition-colors"
          >
            {copied ? "Copied!" : "Copy data URL"}
          </button>
          <button
            onClick={handleClear}
            disabled={!svgInput}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 text-sm font-medium transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </p>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center min-h-32">
              <img
                ref={imgRef}
                src={previewUrl}
                alt="SVG preview"
                className="max-w-full max-h-96 object-contain"
                onError={() => setError("Failed to render SVG. Check that the markup is valid.")}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
