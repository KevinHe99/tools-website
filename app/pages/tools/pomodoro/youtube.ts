export interface YTPlayer {
    loadPlaylist(opts: { list: string; listType: "playlist"; index?: number }): void;
    cuePlaylist(opts: { list: string; listType: "playlist"; index?: number }): void;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    setVolume(volume: number): void;
    mute(): void;
    unMute(): void;
    destroy(): void;
}

interface YTPlayerOptions {
    width?: string | number;
    height?: string | number;
    playerVars?: Record<string, unknown>;
    events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: (e: { data: number }) => void;
    };
}

interface YTNamespace {
    Player: new (elementId: string | HTMLElement, options: YTPlayerOptions) => YTPlayer;
}

declare global {
    interface Window {
        YT?: YTNamespace;
        onYouTubeIframeAPIReady?: () => void;
    }
}

let apiPromise: Promise<YTNamespace> | null = null;

export function loadYouTubeApi(): Promise<YTNamespace> {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("YouTube API requires a browser"));
    }
    if (window.YT?.Player) {
        return Promise.resolve(window.YT);
    }
    if (apiPromise) return apiPromise;

    apiPromise = new Promise<YTNamespace>((resolve) => {
        const existing = document.querySelector<HTMLScriptElement>(
            'script[src="https://www.youtube.com/iframe_api"]'
        );

        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prevCallback?.();
            if (window.YT) resolve(window.YT);
        };

        if (!existing) {
            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            document.head.appendChild(script);
        }
    });

    return apiPromise;
}

export function extractPlaylistId(url: string): string | null {
    const trimmed = url.trim();
    if (!trimmed) return null;

    if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes("/")) {
        return trimmed;
    }

    try {
        const u = new URL(trimmed);
        const list = u.searchParams.get("list");
        if (list) return list;
    } catch {
        return null;
    }
    return null;
}

export function newPlayer(
    elementId: string,
    options: YTPlayerOptions,
    YT: YTNamespace
): YTPlayer {
    return new YT.Player(elementId, options);
}
