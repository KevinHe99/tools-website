import { useState, useCallback } from "react";

type Mode = "encode" | "decode";

export function PageBase64Convertor() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const output = useCallback(() => {
    if (!input) return "";
    try {
      if (mode === "encode") {
        return btoa(encodeURIComponent(input));
      } else {
        return decodeURIComponent(atob(input));
      }
    } catch {
      return "Invalid input";
    }
  }, [input, mode])();

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setInput("");
    setCopied(false);
  }

  async function handleCopy() {
    if (!output || output === "Invalid input") return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClear() {
    setInput("");
    setCopied(false);
  }

  const isError = output === "Invalid input";

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Base64 Converter
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Encode text to Base64 or decode Base64 back to text.
        </p>

        {/* Mode toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 mb-6 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={() => handleModeChange("encode")}
            className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "encode"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Encode
          </button>
          <button
            onClick={() => handleModeChange("decode")}
            className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "decode"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Decode
          </button>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {mode === "encode" ? "Plain text" : "Base64"}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "Enter text to encode…"
                : "Enter Base64 to decode…"
            }
            rows={6}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3.5 py-2.5 text-sm font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {/* Output */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {mode === "encode" ? "Base64" : "Plain text"}
          </label>
          <textarea
            readOnly
            value={output}
            rows={6}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono resize-y bg-gray-50 dark:bg-gray-900 focus:outline-none ${
              isError
                ? "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                : "border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            }`}
            placeholder="Output will appear here…"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            disabled={!output || isError}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white text-sm font-medium transition-colors"
          >
            {copied ? "Copied!" : "Copy output"}
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
