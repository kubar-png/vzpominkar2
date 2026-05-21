"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause } from "lucide-react";
import { saveAudioMemory } from "@/lib/memories/actions";
import { SeniorButton } from "@/components/senior/SeniorButton";

type Phase = "idle" | "recording" | "review" | "uploading";

const MAX_SECONDS = 600; // 10 min cap
const COUNTDOWN_FROM = 480; // start showing remaining at 8 min

export function AudioMemoryForm({ assignmentId }: { assignmentId: string | null }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0); // 0..1, smoothed mic level
  const [supported, setSupported] = useState<boolean | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Detect codec support up-front so the user gets a clear message before
  // they start (instead of a generic mic-permission error mid-flow).
  useEffect(() => {
    setSupported(typeof MediaRecorder !== "undefined" && pickMime() !== null);
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Auto-stop at the cap so we never produce a 100MB file.
  useEffect(() => {
    if (phase === "recording" && seconds >= MAX_SECONDS) {
      stopRecording();
    }
  }, [phase, seconds]);

  async function startRecording() {
    setError(null);
    const mime = pickMime();
    if (!mime) {
      setError("Váš prohlížeč nepodporuje nahrávání. Otevřete aplikaci v Chrome nebo Safari.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const out = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setBlob(out);
        setPreviewUrl(URL.createObjectURL(out));
        setPhase("review");
        stream.getTracks().forEach((t) => t.stop());
        teardownAnalyser();
      };
      // Wire a level analyser so the visual indicator reflects real input.
      setupAnalyser(stream);
      recorder.start();
      setPhase("recording");
      setSeconds(0);
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Nepodařilo se získat mikrofon. Povolte ho prosím v nastavení prohlížeče.");
    }
  }

  function setupAnalyser(stream: MediaStream) {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRef.current = analyser;

      const buf = new Uint8Array(analyser.frequencyBinCount);
      let smoothed = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        // RMS over the time-domain samples → 0..1 level
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = ((buf[i] ?? 128) - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        smoothed = smoothed * 0.85 + rms * 0.15;
        // Boost so quiet speech still moves the indicator.
        setLevel(Math.min(1, smoothed * 4));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // analyser is optional UX; failures shouldn't block recording
    }
  }

  function teardownAnalyser() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  }

  function stopRecording() {
    if (tickRef.current) clearInterval(tickRef.current);
    recorderRef.current?.stop();
  }

  function reset() {
    setBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    setPhase("idle");
  }

  function save() {
    if (!blob) return;
    setPhase("uploading");
    startTransition(async () => {
      const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
      const fd = new FormData();
      fd.set("audio", new File([blob], `recording.${ext}`, { type: blob.type || "audio/webm" }));
      fd.set("duration", String(seconds));
      fd.set("assignmentId", assignmentId ?? "");
      const result = await saveAudioMemory(null, fd);
      if (result?.ok === false) {
        setError(result.error);
        setPhase("review");
      } else {
        router.push("/my-memories?saved=1");
      }
    });
  }

  const remaining = MAX_SECONDS - seconds;

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Center - context only: instructions, timer, audio preview */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-6 text-center">
        {phase === "idle" && (
          <>
            <p className="text-[length:var(--text-senior)] text-paper-600 max-w-xs">
              Stiskněte tlačítko, mluvte přirozeně, pak stiskněte Hotovo.
            </p>
            {supported === false && (
              <p
                role="alert"
                className="w-full max-w-sm rounded-[var(--radius-senior-input)] border-2 border-red-200 bg-red-50 p-4 text-[length:var(--text-senior)] text-red-700"
              >
                Váš prohlížeč nepodporuje nahrávání. Otevřete prosím Chrome nebo Safari.
              </p>
            )}
          </>
        )}

        {phase === "recording" && (
          <>
            <LiveLevelIndicator level={level} />
            <p className="text-[length:var(--text-senior-h2)] font-mono font-semibold tabular-nums text-navy-900">
              {formatTime(seconds)}
            </p>
            <p className="text-[length:var(--text-senior-sm)] text-paper-500">
              {seconds >= COUNTDOWN_FROM
                ? `Zbývá ${formatTime(remaining)} - pak nahrávání samo skončí`
                : "Nahrávám - mluvte klidně dál"}
            </p>
          </>
        )}

        {phase === "review" && previewUrl && (
          <BigAudioPlayer src={previewUrl} duration={seconds} />
        )}

        {phase === "uploading" && (
          <p className="text-[length:var(--text-senior)] text-paper-600">Nahráváme do bezpečí…</p>
        )}

        {error && (
          <p
            role="alert"
            className="w-full max-w-sm rounded-[var(--radius-senior-input)] border-2 border-red-200 bg-red-50 p-4 text-[length:var(--text-senior)] text-red-700"
          >
            {error}
          </p>
        )}
      </div>

      {/* Fixed bottom bar - always visible, button reflects current phase */}
      <div className="shrink-0 flex items-center justify-center gap-3 px-6 py-2 border-t border-paper-200 bg-paper-50">
        {phase === "idle" && (
          <SeniorButton
            variant="accent"
            size="md"
            onClick={startRecording}
            disabled={supported === false}
          >
            Začít nahrávat
          </SeniorButton>
        )}
        {phase === "recording" && (
          <SeniorButton variant="primary" size="md" onClick={stopRecording}>
            Hotovo
          </SeniorButton>
        )}
        {phase === "review" && (
          <>
            <SeniorButton variant="secondary" size="md" onClick={reset} disabled={pending}>
              Začít znovu
            </SeniorButton>
            <SeniorButton variant="primary" size="md" onClick={save} disabled={pending}>
              {pending ? "Ukládáme…" : "Uložit vzpomínku"}
            </SeniorButton>
          </>
        )}
        {phase === "uploading" && (
          <SeniorButton variant="primary" size="md" disabled>
            Nahráváme…
          </SeniorButton>
        )}
      </div>

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Live mic-level indicator: pulses match real input, not just elapsed time   */
/* -------------------------------------------------------------------------- */

function LiveLevelIndicator({ level }: { level: number }) {
  // Outer ring scales with level (1.0 → 1.6×); inner pulse always animates.
  const scale = 1 + level * 0.6;
  const ringOpacity = 0.15 + level * 0.45;
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-red-500 transition-transform duration-100 ease-out"
        style={{ transform: `scale(${scale})`, opacity: ringOpacity }}
      />
      <span className="absolute inset-4 animate-ping rounded-full bg-red-500/30 [animation-delay:300ms]" />
      <span
        className="relative h-16 w-16 rounded-full bg-red-600 shadow-[var(--shadow-xl)]"
        aria-label="Nahrávám"
        role="img"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Custom large audio player - bigger play/pause + scrub than native controls */
/* -------------------------------------------------------------------------- */

function BigAudioPlayer({ src, duration }: { src: string; duration: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [actualDuration, setActualDuration] = useState(duration);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setPos(a.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setPos(0);
    };
    const onMeta = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) setActualDuration(Math.round(a.duration));
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);
    a.addEventListener("loadedmetadata", onMeta);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  const total = actualDuration || 1;
  const pct = Math.min(100, (pos / total) * 100);

  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-[length:var(--text-senior)] text-paper-600">
        Poslechněte si nahrávku:
      </p>

      <div className="flex items-center gap-4 rounded-[var(--radius-senior-input)] border-2 border-paper-300 bg-white p-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pozastavit" : "Přehrát"}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
        >
          {playing ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>
        <div className="flex-1 space-y-2">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-paper-200"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-navy-700 transition-[width] duration-100" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm font-mono tabular-nums text-paper-500">
            {formatTime(Math.round(pos))} / {formatTime(actualDuration)}
          </p>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return null;
}
