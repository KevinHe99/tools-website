import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playChime } from "./chime";
import { extractPlaylistId, loadYouTubeApi, type YTPlayer } from "./youtube";

type Phase = "focus" | "shortBreak" | "longBreak";

interface Preset {
    name: string;
    focusMin: number;
    shortBreakMin: number;
    longBreakMin: number;
    longBreakAfter: number;
}

const BUILTIN_PRESETS: Preset[] = [
    { name: "Classic", focusMin: 25, shortBreakMin: 5, longBreakMin: 15, longBreakAfter: 4 },
    { name: "50 / 10", focusMin: 50, shortBreakMin: 10, longBreakMin: 30, longBreakAfter: 3 },
    { name: "90 / 15", focusMin: 90, shortBreakMin: 15, longBreakMin: 30, longBreakAfter: 2 },
];

const PHASE_LABEL: Record<Phase, string> = {
    focus: "Focus",
    shortBreak: "Short break",
    longBreak: "Long break",
};

const PHASE_PILL_CLASS: Record<Phase, string> = {
    focus: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    shortBreak: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    longBreak: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};

const STORAGE = {
    presets: "pomodoro:presets",
    config: "pomodoro:config",
    today: "pomodoro:today",
    focusUrl: "pomodoro:focus-url",
    breakUrl: "pomodoro:break-url",
    volume: "pomodoro:volume",
};

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

function phaseDurationMs(phase: Phase, config: Preset): number {
    const mins = phase === "focus" ? config.focusMin : phase === "shortBreak" ? config.shortBreakMin : config.longBreakMin;
    return Math.max(1, mins) * 60_000;
}

function formatTime(ms: number): string {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PagePomodoro() {
    const [hydrated, setHydrated] = useState(false);
    const [config, setConfig] = useState<Preset>(BUILTIN_PRESETS[0]);
    const [customPresets, setCustomPresets] = useState<Preset[]>([]);
    const [phase, setPhase] = useState<Phase>("focus");
    const [cycleCount, setCycleCount] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [todayDate, setTodayDate] = useState(todayKey());

    const [isRunning, setIsRunning] = useState(false);
    const [endsAt, setEndsAt] = useState<number | null>(null);
    const [remainingMs, setRemainingMs] = useState(BUILTIN_PRESETS[0].focusMin * 60_000);
    const [, setNow] = useState(Date.now());

    const [focusPlaylistUrl, setFocusPlaylistUrl] = useState("");
    const [breakPlaylistUrl, setBreakPlaylistUrl] = useState("");
    const [volume, setVolume] = useState(60);
    const [muted, setMuted] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);

    const [draftName, setDraftName] = useState("");
    const [draftFocus, setDraftFocus] = useState(25);
    const [draftShort, setDraftShort] = useState(5);
    const [draftLong, setDraftLong] = useState(15);
    const [draftAfter, setDraftAfter] = useState(4);

    const playerRef = useRef<YTPlayer | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        try {
            const presets = localStorage.getItem(STORAGE.presets);
            if (presets) setCustomPresets(JSON.parse(presets));
            const cfg = localStorage.getItem(STORAGE.config);
            if (cfg) {
                const parsed: Preset = JSON.parse(cfg);
                setConfig(parsed);
                setRemainingMs(parsed.focusMin * 60_000);
                setDraftFocus(parsed.focusMin);
                setDraftShort(parsed.shortBreakMin);
                setDraftLong(parsed.longBreakMin);
                setDraftAfter(parsed.longBreakAfter);
            }
            const today = localStorage.getItem(STORAGE.today);
            if (today) {
                const { date, count } = JSON.parse(today);
                if (date === todayKey()) setTodayCount(count);
            }
            const f = localStorage.getItem(STORAGE.focusUrl);
            if (f) setFocusPlaylistUrl(f);
            const b = localStorage.getItem(STORAGE.breakUrl);
            if (b) setBreakPlaylistUrl(b);
            const v = localStorage.getItem(STORAGE.volume);
            if (v) setVolume(Number(v));
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                setNotificationsEnabled(true);
            }
        } catch {}
        setHydrated(true);
    }, []);

    useEffect(() => { if (hydrated) localStorage.setItem(STORAGE.presets, JSON.stringify(customPresets)); }, [customPresets, hydrated]);
    useEffect(() => { if (hydrated) localStorage.setItem(STORAGE.config, JSON.stringify(config)); }, [config, hydrated]);
    useEffect(() => { if (hydrated) localStorage.setItem(STORAGE.today, JSON.stringify({ date: todayDate, count: todayCount })); }, [todayCount, todayDate, hydrated]);
    useEffect(() => { if (hydrated) localStorage.setItem(STORAGE.focusUrl, focusPlaylistUrl); }, [focusPlaylistUrl, hydrated]);
    useEffect(() => { if (hydrated) localStorage.setItem(STORAGE.breakUrl, breakPlaylistUrl); }, [breakPlaylistUrl, hydrated]);
    useEffect(() => { if (hydrated) localStorage.setItem(STORAGE.volume, String(volume)); }, [volume, hydrated]);

    useEffect(() => {
        if (!hydrated) return;
        let cancelled = false;
        loadYouTubeApi()
            .then((YT) => {
                if (cancelled || !containerRef.current) return;
                playerRef.current = new YT.Player(containerRef.current, {
                    width: "100%",
                    height: "100%",
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        modestbranding: 1,
                        rel: 0,
                    },
                    events: {
                        onReady: () => {
                            setPlayerReady(true);
                            playerRef.current?.setVolume(muted ? 0 : volume);
                        },
                    },
                });
            })
            .catch(() => {});
        return () => {
            cancelled = true;
            try { playerRef.current?.destroy(); } catch {}
            playerRef.current = null;
        };
    }, [hydrated]);

    useEffect(() => {
        if (!playerReady) return;
        try {
            if (muted) playerRef.current?.setVolume(0);
            else playerRef.current?.setVolume(volume);
        } catch {}
    }, [volume, muted, playerReady]);

    const advancePhaseRef = useRef<() => void>(() => {});

    useEffect(() => {
        if (!isRunning || endsAt === null) return;
        const id = window.setInterval(() => {
            if (Date.now() >= endsAt) {
                advancePhaseRef.current();
            } else {
                setNow(Date.now());
            }
        }, 250);
        return () => window.clearInterval(id);
    }, [isRunning, endsAt]);

    const displayMs = isRunning && endsAt !== null ? Math.max(0, endsAt - Date.now()) : remainingMs;

    const notify = useCallback((title: string, body: string) => {
        if (typeof Notification === "undefined") return;
        if (Notification.permission !== "granted") return;
        try { new Notification(title, { body }); } catch {}
    }, []);

    const switchPlaylist = useCallback((phaseToPlay: Phase, autoplay: boolean) => {
        const url = phaseToPlay === "focus" ? focusPlaylistUrl : (phaseToPlay === "shortBreak" || phaseToPlay === "longBreak") ? breakPlaylistUrl : "";
        const id = extractPlaylistId(url);
        const p = playerRef.current;
        if (!p) return;
        try {
            if (!id) { p.pauseVideo(); return; }
            if (autoplay) p.loadPlaylist({ list: id, listType: "playlist" });
            else p.cuePlaylist({ list: id, listType: "playlist" });
        } catch {}
    }, [focusPlaylistUrl, breakPlaylistUrl]);

    const advancePhase = useCallback(() => {
        const today = todayKey();
        let nextPhase: Phase;
        if (phase === "focus") {
            const newCycle = cycleCount + 1;
            const isLong = newCycle % config.longBreakAfter === 0;
            nextPhase = isLong ? "longBreak" : "shortBreak";
            setCycleCount(isLong ? 0 : newCycle);
            if (today !== todayDate) {
                setTodayDate(today);
                setTodayCount(1);
            } else {
                setTodayCount((c) => c + 1);
            }
            playChime("break");
            notify("Focus complete", "Time for a break.");
        } else {
            nextPhase = "focus";
            playChime("focus");
            notify("Break complete", "Back to focus.");
        }
        setPhase(nextPhase);
        const nextMs = phaseDurationMs(nextPhase, config);
        setRemainingMs(nextMs);
        setEndsAt(Date.now() + nextMs);
        switchPlaylist(nextPhase, true);
    }, [phase, cycleCount, config, todayDate, switchPlaylist, notify]);

    useEffect(() => {
        advancePhaseRef.current = advancePhase;
    }, [advancePhase]);

    function handleStart() {
        if (isRunning) return;
        const ends = Date.now() + remainingMs;
        setEndsAt(ends);
        setIsRunning(true);
        switchPlaylist(phase, true);
    }

    function handlePause() {
        if (!isRunning || endsAt === null) return;
        setRemainingMs(Math.max(0, endsAt - Date.now()));
        setEndsAt(null);
        setIsRunning(false);
        try { playerRef.current?.pauseVideo(); } catch {}
    }

    function handleReset() {
        setIsRunning(false);
        setEndsAt(null);
        setPhase("focus");
        setCycleCount(0);
        setRemainingMs(config.focusMin * 60_000);
        try { playerRef.current?.stopVideo(); } catch {}
    }

    function handleSkip() {
        advancePhase();
        if (!isRunning) setIsRunning(true);
    }

    function applyPreset(p: Preset) {
        setConfig(p);
        setIsRunning(false);
        setEndsAt(null);
        setPhase("focus");
        setCycleCount(0);
        setRemainingMs(p.focusMin * 60_000);
        setDraftFocus(p.focusMin);
        setDraftShort(p.shortBreakMin);
        setDraftLong(p.longBreakMin);
        setDraftAfter(p.longBreakAfter);
    }

    function handleSavePreset() {
        const name = draftName.trim() || `${draftFocus}/${draftShort}`;
        const p: Preset = {
            name,
            focusMin: Math.max(1, Math.floor(draftFocus)),
            shortBreakMin: Math.max(1, Math.floor(draftShort)),
            longBreakMin: Math.max(1, Math.floor(draftLong)),
            longBreakAfter: Math.max(1, Math.floor(draftAfter)),
        };
        setCustomPresets((list) => {
            const without = list.filter((x) => x.name !== p.name);
            return [...without, p];
        });
        setDraftName("");
        applyPreset(p);
    }

    function handleDeletePreset(name: string) {
        setCustomPresets((list) => list.filter((p) => p.name !== name));
    }

    async function enableNotifications() {
        if (typeof Notification === "undefined") return;
        const res = await Notification.requestPermission();
        if (res === "granted") setNotificationsEnabled(true);
    }

    function applyFocusUrl() { switchPlaylist("focus", true); }
    function applyBreakUrl() { switchPlaylist("shortBreak", true); }

    const formats = useMemo(() => formatTime(displayMs), [displayMs]);
    const cyclePosition = `${cycleCount}/${config.longBreakAfter}`;

    return (
        <main className="min-h-screen bg-white dark:bg-gray-950 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Pomodoro Timer
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    Focus timer with custom intervals and YouTube playlist integration.
                </p>

                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${PHASE_PILL_CLASS[phase]}`}>
                            {PHASE_LABEL[phase]}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Cycle {cyclePosition}</span>
                    </div>
                    <div className="text-7xl font-mono font-semibold tabular-nums text-gray-900 dark:text-gray-100 tracking-tight">
                        {formats}
                    </div>
                </div>

                <div className="flex gap-3 justify-center flex-wrap mb-3">
                    {isRunning ? (
                        <button
                            onClick={handlePause}
                            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                        >
                            Pause
                        </button>
                    ) : (
                        <button
                            onClick={handleStart}
                            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                        >
                            Start
                        </button>
                    )}
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-medium transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSkip}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-medium transition-colors"
                    >
                        Skip →
                    </button>
                </div>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-10">
                    {hydrated ? `${todayCount} pomodoro${todayCount === 1 ? "" : "s"} completed today` : ""}
                </p>

                <section className="mb-8">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Presets</h2>
                    <div className="flex gap-2 flex-wrap">
                        {BUILTIN_PRESETS.map((p) => (
                            <button
                                key={p.name}
                                onClick={() => applyPreset(p)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                                    config.name === p.name
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            >
                                {p.name} <span className="opacity-60">· {p.focusMin}/{p.shortBreakMin}/{p.longBreakMin}</span>
                            </button>
                        ))}
                        {hydrated && customPresets.map((p) => (
                            <div key={p.name} className="relative group inline-block">
                                <button
                                    onClick={() => applyPreset(p)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                                        config.name === p.name
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                                >
                                    {p.name} <span className="opacity-60">· {p.focusMin}/{p.shortBreakMin}/{p.longBreakMin}</span>
                                </button>
                                <button
                                    onClick={() => handleDeletePreset(p.name)}
                                    title="Delete preset"
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Custom intervals</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <NumberField label="Focus (min)" value={draftFocus} onChange={setDraftFocus} />
                        <NumberField label="Short break (min)" value={draftShort} onChange={setDraftShort} />
                        <NumberField label="Long break (min)" value={draftLong} onChange={setDraftLong} />
                        <NumberField label="Long break after" value={draftAfter} onChange={setDraftAfter} />
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            placeholder="Preset name (optional)"
                            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSavePreset}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                        >
                            Save preset
                        </button>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Music</h2>
                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Focus playlist URL</label>
                            <div className="flex gap-2">
                                <input
                                    value={focusPlaylistUrl}
                                    onChange={(e) => setFocusPlaylistUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/playlist?list=..."
                                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={applyFocusUrl}
                                    disabled={!playerReady}
                                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 text-sm font-medium transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Break playlist URL</label>
                            <div className="flex gap-2">
                                <input
                                    value={breakPlaylistUrl}
                                    onChange={(e) => setBreakPlaylistUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/playlist?list=..."
                                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={applyBreakUrl}
                                    disabled={!playerReady}
                                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 text-sm font-medium transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 w-16 shrink-0">Volume</label>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-8 text-right">{volume}</span>
                        <button
                            onClick={() => setMuted((m) => !m)}
                            className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 text-xs font-medium transition-colors"
                        >
                            {muted ? "Unmute" : "Mute"}
                        </button>
                    </div>

                    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                        <div className="aspect-video">
                            <div ref={containerRef} className="w-full h-full" />
                        </div>
                    </div>
                </section>

                <section className="mb-4">
                    {!notificationsEnabled && (
                        <button
                            onClick={enableNotifications}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Enable browser notifications
                        </button>
                    )}
                </section>
            </div>
        </main>
    );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
            <input
                type="number"
                min={1}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}
