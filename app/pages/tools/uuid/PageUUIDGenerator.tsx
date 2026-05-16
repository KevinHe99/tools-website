import { useState } from "react";

const COUNT_OPTIONS = [1, 5, 10];

export function PageUUIDGenerator() {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  function handleGenerate() {
    setUuids(Array.from({ length: count }, () => crypto.randomUUID()));
    setCopiedIndex(null);
    setCopiedAll(false);
  }

  async function handleCopyOne(uuid: string, index: number) {
    await navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  async function handleCopyAll() {
    if (!uuids.length) return;
    await navigator.clipboard.writeText(uuids.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function handleClear() {
    setUuids([]);
    setCopiedIndex(null);
    setCopiedAll(false);
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          UUID Generator
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Generate version 4 UUIDs using the built-in{" "}
          <code className="font-mono">crypto.randomUUID()</code> API.
        </p>

        {/* Count selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            How many?
          </label>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    count === n
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value))))}
              className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Generate button */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={handleGenerate}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Generate
          </button>
          {uuids.length > 0 && (
            <>
              <button
                onClick={handleCopyAll}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-medium transition-colors"
              >
                {copiedAll ? "Copied!" : "Copy all"}
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 text-sm font-medium transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>

        {/* UUID list */}
        {uuids.length > 0 && (
          <ul className="space-y-2">
            {uuids.map((uuid, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3.5 py-2.5"
              >
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100 select-all">
                  {uuid}
                </span>
                <button
                  onClick={() => handleCopyOne(uuid, i)}
                  className="shrink-0 px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  {copiedIndex === i ? "Copied!" : "Copy"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
