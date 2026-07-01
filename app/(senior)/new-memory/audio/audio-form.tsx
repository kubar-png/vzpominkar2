"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause } from "lucide-react";
import { saveAudioMemory } from "@/lib/memories/actions";

type Phase = "idle" | "recording" | "review" | "uploading";

const MAX_SECONDS = 600; // 10 min cap
const COUNTDOWN_FROM = 480; // start showing remaining at 8 min

/**
 * Audio memory form — editorial reskin.
 *
 * The MediaRecorder pipeline, the live-level analyser, codec detection,
 * upload + Server Action call all stay 1:1 with the previous version.
 * Only the visual shell changed: oxblood pulsing ring instead of red, big
 * gold/outline pills instead of the SeniorButton chip set.
 */
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
      // Record voice as mono with browser cleanup on — speech doesn't need
      // stereo, and a low bitrate keeps files small (storage recurs forever
      // for the QR-code playback). Opus at ~32 kbps mono is transparent for
      // spoken word, so quality stays fine while size roughly halves.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      const recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 });
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
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = ((buf[i] ?? 128) - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        smoothed = smoothed * 0.85 + rms * 0.15;
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
    <div className="es-card">
      <div className="es-rec-stage">
        {phase === "idle" && (
          <>
            <p className="text-[19px] text-[var(--ink)] max-w-md">
              Stiskněte tlačítko níže, vyprávějte přirozeně svým tempem,
              a až budete hotoví, stiskněte <strong>Hotovo</strong>.
            </p>
            {supported === false && (
              <div role="alert" className="es-banner es-banner-error max-w-md">
                Váš prohlížeč nepodporuje nahrávání. Otevřete prosím Chrome nebo Safari.
              </div>
            )}
          </>
        )}

        {phase === "recording" && (
          <>
            <LiveLevelIndicator level={level} />
            <div className="es-timer" aria-live="polite">
              {formatTime(seconds)}
            </div>
            <p className="text-[18px] text-[var(--ink-soft)]">
              {seconds >= COUNTDOWN_FROM
                ? `Zbývá ${formatTime(remaining)} — pak nahrávání samo skončí`
                : "Nahrávám — mluvte klidně dál"}
            </p>
          </>
        )}

        {phase === "review" && previewUrl && (
          <BigAudioPlayer src={previewUrl} duration={seconds} />
        )}

        {phase === "uploading" && (
          <p className="text-[19px] text-[var(--ink-soft)]">
            Nahráváme do bezpečí…
          </p>
        )}

        {error && (
          <div role="alert" className="es-banner es-banner-error max-w-md">
            {error}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {phase === "idle" && (
          <button
            type="button"
            onClick={startRecording}
            disabled={supported === false}
            className="es-btn es-btn-red"
            aria-label="Začít nahrávat"
          >
            Začít nahrávat <span className="arrow" aria-hidden>●</span>
          </button>
        )}
        {phase === "recording" && (
          <button
            type="button"
            onClick={stopRecording}
            className="es-btn es-btn-gold"
            aria-label="Ukončit nahrávání"
          >
            Hotovo <span className="arrow" aria-hidden>↗</span>
          </button>
        )}
        {phase === "review" && (
          <>
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="es-btn es-btn-outline"
            >
              Začít znovu
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="es-btn es-btn-gold"
            >
              {pending ? "Ukládám…" : "Uložit vzpomínku"}
              <span className="arrow" aria-hidden>↗</span>
            </button>
          </>
        )}
        {phase === "uploading" && (
          <button type="button" disabled className="es-btn es-btn-gold">
            Nahráváme…
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Live mic-level indicator: oxblood ring that grows with the speaker's voice.*/
/* -------------------------------------------------------------------------- */

function LiveLevelIndicator({ level }: { level: number }) {
  const scale = 1 + level * 0.5;
  const haloOpacity = 0.15 + level * 0.35;
  return (
    <div className="es-rec-ring" role="img" aria-label="Nahrávám">
      <span
        className="es-rec-ring-halo"
        style={{ transform: `scale(${scale})`, opacity: haloOpacity }}
        aria-hidden
      />
      <span className="es-rec-ring-pulse" aria-hidden />
      <span className="es-rec-dot" aria-hidden />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Custom large audio player for the review phase.                            */
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
    <div className="w-full max-w-md">
      <p className="text-[18px] text-[var(--ink-soft)] mb-4 text-center">
        Poslechněte si nahrávku:
      </p>

      <div
        className="flex items-center gap-4 rounded-xl border-2 p-4"
        style={{ borderColor: "var(--line-2)", background: "#fff" }}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pozastavit" : "Přehrát"}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--ink)", color: "#FEF7D7" }}
        >
          {playing ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>
        <div className="flex-1 space-y-2">
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ background: "var(--bg-soft)" }}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full transition-[width] duration-100"
              style={{ width: `${pct}%`, background: "var(--ink)" }}
            />
          </div>
          <p
            className="font-mono tabular-nums text-[15px]"
            style={{ color: "var(--ink-mute)" }}
          >
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
