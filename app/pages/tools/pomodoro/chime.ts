let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (audioCtx) return audioCtx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
    return audioCtx;
}

function tone(ctx: AudioContext, freq: number, startOffset: number, durationMs: number) {
    const t = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain).connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
    osc.start(t);
    osc.stop(t + durationMs / 1000 + 0.02);
}

export function playChime(kind: "focus" | "break") {
    try {
        const ctx = getCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();
        if (kind === "focus") {
            tone(ctx, 880, 0, 180);
            tone(ctx, 1318.5, 0.18, 220);
        } else {
            tone(ctx, 660, 0, 180);
            tone(ctx, 880, 0.18, 220);
        }
    } catch {}
}
