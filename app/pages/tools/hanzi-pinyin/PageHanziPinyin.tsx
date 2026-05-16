import { useState } from "react";
import { pinyin } from "pinyin-pro";

type ToneType = "symbol" | "num" | "none";

const FORMAT_OPTIONS: { value: ToneType; label: string; example: string }[] = [
  { value: "symbol", label: "Toned", example: "nǐ hǎo" },
  { value: "num",    label: "Numeric", example: "ni3 hao3" },
  { value: "none",   label: "Plain", example: "ni hao" },
];

export function PageHanziPinyin() {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<ToneType>("symbol");
  const [copied, setCopied] = useState(false);

  const output = input
    ? pinyin(input, { toneType: format, separator: " " })
    : "";

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClear() {
    setInput("");
    setCopied(false);
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Hanzi → Pinyin
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Convert Chinese characters to pinyin in toned, numeric, or plain format.
          Non-Chinese characters are passed through unchanged.
        </p>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Chinese text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入中文，例如：你好世界"
            rows={6}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {/* Format toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Format
          </label>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900">
            {FORMAT_OPTIONS.map(({ value, label, example }) => (
              <button
                key={value}
                onClick={() => setFormat(value)}
                title={example}
                className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  format === value
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            e.g. {FORMAT_OPTIONS.find((f) => f.value === format)?.example}
          </p>
        </div>

        {/* Output */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Pinyin
          </label>
          <textarea
            readOnly
            value={output}
            rows={6}
            placeholder="Pinyin will appear here…"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 text-sm font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            disabled={!output}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white text-sm font-medium transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
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
