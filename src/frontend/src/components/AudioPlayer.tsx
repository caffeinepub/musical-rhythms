import { ChevronLeft, Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Song } from "../types";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const LOGO_PATH = "/assets/unnamed-019d39d0-d234-7035-b935-2f8115eca61d.png";

/**
 * Extracts just the YouTube video ID from any YouTube URL format.
 * - https://youtu.be/VIDEO_ID?si=... → VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&... → VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID → VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID → VIDEO_ID
 * - If already just an ID (11-char alphanumeric with dashes/underscores, no dots or slashes)
 */
function extractVideoId(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();

  // Already a bare ID (11-char alphanumeric with dashes/underscores, no dots or slashes)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);

    // youtu.be short URL: youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace(/^\//, "").split("/")[0];
    }

    // youtube.com/watch?v=VIDEO_ID
    const vParam = parsed.searchParams.get("v");
    if (vParam) return vParam;

    // youtube.com/embed/VIDEO_ID or youtube.com/v/VIDEO_ID
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (
      pathParts.length >= 2 &&
      (pathParts[0] === "embed" || pathParts[0] === "v")
    ) {
      return pathParts[1];
    }
  } catch {
    // Not a valid URL — fall through and return as-is
  }

  return trimmed;
}

const WAVE_BARS = [
  { id: "b01", maxH: 22, dur: 0.62, del: -0.3 },
  { id: "b02", maxH: 38, dur: 0.88, del: -0.7 },
  { id: "b03", maxH: 14, dur: 0.55, del: -0.1 },
  { id: "b04", maxH: 44, dur: 1.0, del: -0.9 },
  { id: "b05", maxH: 30, dur: 0.72, del: -0.5 },
  { id: "b06", maxH: 18, dur: 0.65, del: -0.2 },
  { id: "b07", maxH: 46, dur: 0.95, del: -0.8 },
  { id: "b08", maxH: 26, dur: 0.8, del: -0.4 },
  { id: "b09", maxH: 10, dur: 0.58, del: -0.0 },
  { id: "b10", maxH: 40, dur: 0.9, del: -1.0 },
  { id: "b11", maxH: 32, dur: 0.75, del: -0.6 },
  { id: "b12", maxH: 20, dur: 0.68, del: -0.25 },
  { id: "b13", maxH: 48, dur: 1.05, del: -0.95 },
  { id: "b14", maxH: 16, dur: 0.6, del: -0.15 },
  { id: "b15", maxH: 36, dur: 0.85, del: -0.75 },
  { id: "b16", maxH: 28, dur: 0.78, del: -0.45 },
  { id: "b17", maxH: 12, dur: 0.52, del: -0.05 },
  { id: "b18", maxH: 42, dur: 0.92, del: -0.85 },
  { id: "b19", maxH: 24, dur: 0.7, del: -0.35 },
  { id: "b20", maxH: 34, dur: 0.82, del: -0.65 },
  { id: "b21", maxH: 8, dur: 0.5, del: -0.0 },
  { id: "b22", maxH: 44, dur: 0.98, del: -0.88 },
  { id: "b23", maxH: 18, dur: 0.63, del: -0.22 },
  { id: "b24", maxH: 38, dur: 0.87, del: -0.72 },
  { id: "b25", maxH: 26, dur: 0.74, del: -0.42 },
  { id: "b26", maxH: 14, dur: 0.56, del: -0.12 },
  { id: "b27", maxH: 46, dur: 1.02, del: -0.92 },
  { id: "b28", maxH: 30, dur: 0.76, del: -0.52 },
];

function WaveVisualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div
      className="flex items-end justify-center gap-[3px]"
      style={{ height: 60, width: "100%" }}
    >
      {WAVE_BARS.map(({ id, maxH, dur, del }) => (
        <div
          key={id}
          style={
            {
              width: 4,
              borderRadius: 3,
              background: "var(--accent-color)",
              opacity: isPlaying ? 0.85 : 0.35,
              height: isPlaying ? maxH : 6,
              transition: isPlaying ? "none" : "height 0.4s ease",
              animation: isPlaying
                ? `audioBar ${dur}s ${del}s ease-in-out infinite alternate`
                : "none",
              "--bar-min": "4px",
              "--bar-max": `${maxH}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <style>
        {
          "@keyframes audioBar { from { height: var(--bar-min,4px); } to { height: var(--bar-max,40px); } }"
        }
      </style>
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || Number.isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Detect if a URL is a direct audio file (not YouTube) */
function isDirectAudioUrl(url: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase().trim();
  // Common audio file extensions
  if (u.match(/\.(mp3|ogg|wav|m4a|aac|flac|opus|webm)(\?.*)?$/)) return true;
  // Firebase Storage audio URLs
  if (u.includes("firebasestorage.googleapis.com") && u.includes("alt=media"))
    return true;
  // Dropbox direct links
  if (u.includes("dropbox.com") && u.includes("dl=1")) return true;
  // Google Drive direct links
  if (u.includes("drive.google.com") && u.includes("/uc?")) return true;
  return false;
}

interface AudioPlayerProps {
  song: Song;
  onClose: () => void;
}

// ─── HTML5 Audio Player ───────────────────────────────────────────────────────
function NativeAudioPlayer({ song, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => {
      setDuration(audio.duration);
      setIsReady(true);
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    const onErr = () => {
      setHasError(true);
      setIsReady(true);
    };
    const onCanPlay = () => setIsReady(true);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onErr);
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    }
  };

  const handleRewind = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(duration || 999, audio.currentTime + 10);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerShell
      song={song}
      onClose={onClose}
      isPlaying={isPlaying}
      isReady={isReady}
    >
      {/* Native audio element */}
      <audio ref={audioRef} src={song.youtubeUrl} preload="metadata">
        <track kind="captions" />
      </audio>

      {hasError && (
        <p
          className="text-xs text-center mb-4"
          style={{ color: "oklch(0.7 0.15 25)" }}
        >
          Could not load audio. Check the URL or try a different link.
        </p>
      )}

      <PlayerControls
        isPlaying={isPlaying}
        isReady={isReady}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        onPlayPause={handlePlayPause}
        onRewind={handleRewind}
        onForward={handleForward}
        onSeekChange={(val) => setCurrentTime(val)}
        onSeekCommit={(val) => {
          if (audioRef.current) audioRef.current.currentTime = val;
        }}
      />
    </PlayerShell>
  );
}

// ─── YouTube IFrame Audio Player ──────────────────────────────────────────────
function YouTubeAudioPlayer({ song, onClose }: AudioPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerId = `yt-audio-${song.id}`;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const pendingPlayRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  // Extract the bare video ID from whatever URL format the user pasted
  const videoId = extractVideoId(song.youtubeUrl);

  useEffect(() => {
    let destroyed = false;

    const initPlayer = () => {
      if (destroyed) return;
      // Ensure the container element exists in the DOM before creating the player
      const container = document.getElementById(containerId);
      if (!container) {
        // Retry after a short delay if DOM isn't ready yet
        setTimeout(() => {
          if (!destroyed) initPlayer();
        }, 100);
        return;
      }
      playerRef.current = new window.YT.Player(containerId, {
        width: "320",
        height: "180",
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            if (destroyed) return;
            const dur = e.target.getDuration();
            if (dur) setDuration(dur);
            setIsReady(true);
            if (pendingPlayRef.current) {
              pendingPlayRef.current = false;
              try {
                e.target.playVideo();
              } catch {}
            }
          },
          onStateChange: (e: any) => {
            if (destroyed) return;
            if (e.data === window.YT?.PlayerState?.PLAYING) {
              setIsPlaying(true);
              const dur = e.target.getDuration();
              if (dur) setDuration(dur);
            } else if (
              e.data === window.YT?.PlayerState?.PAUSED ||
              e.data === window.YT?.PlayerState?.ENDED
            ) {
              setIsPlaying(false);
            }
          },
          onError: () => {
            if (!destroyed) setIsReady(true);
          },
        },
      });
    };

    const tryInit = () => {
      if (window.YT?.Player) {
        initPlayer();
      } else {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prev === "function") prev();
          if (!destroyed) initPlayer();
        };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const s = document.createElement("script");
          s.src = "https://www.youtube.com/iframe_api";
          document.head.appendChild(s);
        }
      }
    };

    const t = setTimeout(tryInit, 50);

    return () => {
      destroyed = true;
      clearTimeout(t);
      clearInterval(timerRef.current);
      try {
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, [videoId, containerId]);

  // Poll current time when playing
  useEffect(() => {
    clearInterval(timerRef.current);
    if (isPlaying && isReady) {
      timerRef.current = setInterval(() => {
        try {
          const ct = playerRef.current?.getCurrentTime?.() ?? 0;
          const dur = playerRef.current?.getDuration?.() ?? 0;
          if (!isSeeking) setCurrentTime(ct);
          if (dur && !duration) setDuration(dur);
        } catch {}
      }, 500);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, isReady, isSeeking, duration]);

  const handlePlayPause = () => {
    try {
      if (typeof playerRef.current?.playVideo !== "function") {
        // Player not ready yet — queue the play action
        pendingPlayRef.current = true;
        return;
      }
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch {
      pendingPlayRef.current = true;
    }
  };

  const handleRewind = () => {
    try {
      const t = Math.max(0, (playerRef.current?.getCurrentTime?.() ?? 0) - 10);
      playerRef.current.seekTo(t, true);
      setCurrentTime(t);
    } catch {}
  };

  const handleForward = () => {
    try {
      const t = Math.min(
        duration || 999,
        (playerRef.current?.getCurrentTime?.() ?? 0) + 10,
      );
      playerRef.current.seekTo(t, true);
      setCurrentTime(t);
    } catch {}
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerShell
      song={song}
      onClose={onClose}
      isPlaying={isPlaying}
      isReady={isReady}
    >
      {/* YouTube iframe rendered off-screen with proper dimensions so the API can init */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: 320,
          height: 180,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div id={containerId} />
      </div>

      {!isPlaying && (
        <p
          className="text-xs text-center mb-2"
          style={{ color: "oklch(0.55 0.01 265)" }}
        >
          Tap ▶ to play
        </p>
      )}

      <PlayerControls
        isPlaying={isPlaying}
        isReady={isReady}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
        onPlayPause={handlePlayPause}
        onRewind={handleRewind}
        onForward={handleForward}
        onSeekChange={(val) => {
          setCurrentTime(val);
          setIsSeeking(true);
        }}
        onSeekCommit={(val) => {
          try {
            playerRef.current.seekTo(val, true);
            setCurrentTime(val);
          } catch {}
          setIsSeeking(false);
        }}
        ytMode
      />
    </PlayerShell>
  );
}

// ─── Shared Shell ─────────────────────────────────────────────────────────────
function PlayerShell({
  song,
  onClose,
  isPlaying,
  isReady,
  children,
}: AudioPlayerProps & {
  isPlaying: boolean;
  isReady: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "oklch(0.10 0.015 265 / 0.97)",
        backdropFilter: "blur(20px)",
      }}
      data-ocid="audio_player.modal"
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden flex flex-col items-center"
        style={{
          background: "oklch(0.16 0.018 270)",
          border: "1px solid oklch(0.96 0.005 265 / 10%)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          padding: "28px 28px 32px",
        }}
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="audio_player.back_button"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "var(--accent-color)", opacity: 0.7 }}
          >
            Now Playing
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close"
            data-ocid="audio_player.close_button"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Logo circle */}
        <div
          className="relative flex items-center justify-center mb-6"
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "oklch(0.22 0.025 270)",
            border: "3px solid var(--accent-color)",
            boxShadow: isPlaying
              ? "0 0 0 8px oklch(var(--primary) / 0.12), 0 0 40px oklch(var(--primary) / 0.3)"
              : "0 0 0 8px oklch(var(--primary) / 0.06)",
            transition: "box-shadow 0.5s ease",
          }}
        >
          <img
            src={LOGO_PATH}
            alt="MR Logo"
            style={{
              width: 110,
              height: 110,
              objectFit: "contain",
              borderRadius: "50%",
            }}
          />
          {!isReady && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{ background: "oklch(0.22 0.025 270 / 0.7)" }}
            >
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "var(--accent-color)",
                  borderTopColor: "transparent",
                }}
              />
            </div>
          )}
        </div>

        <h2
          className="text-center font-bold text-lg leading-tight mb-1 px-2"
          style={{ color: "oklch(0.96 0.005 265)", maxWidth: "100%" }}
          data-ocid="audio_player.song_title"
        >
          {song.title}
        </h2>
        <p className="text-xs text-muted-foreground mb-4 tracking-wide">
          Musical Rhythms
        </p>

        <div className="w-full mb-4 px-2">
          <WaveVisualizer isPlaying={isPlaying} />
        </div>

        {children}
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--accent-color); cursor: pointer;
          box-shadow: 0 0 6px oklch(var(--primary) / 0.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--accent-color); cursor: pointer; border: none;
        }
      `}</style>
    </div>
  );
}

// ─── Shared Controls ──────────────────────────────────────────────────────────
function PlayerControls({
  isPlaying,
  isReady,
  currentTime,
  duration,
  progress,
  onPlayPause,
  onRewind,
  onForward,
  onSeekChange,
  onSeekCommit,
  ytMode,
}: {
  isPlaying: boolean;
  isReady: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  onPlayPause: () => void;
  onRewind: () => void;
  onForward: () => void;
  onSeekChange: (v: number) => void;
  onSeekCommit: (v: number) => void;
  ytMode?: boolean;
}) {
  // For YouTube mode: play/pause always enabled, rewind/forward only when duration known
  // For native mode: all buttons respect isReady
  const seekDisabled = ytMode ? duration === 0 : !isReady;
  const playDisabled = ytMode ? false : !isReady;

  return (
    <>
      <div
        className="w-full flex justify-between text-xs font-medium mb-2 px-1"
        style={{ color: "oklch(0.6 0.01 265)" }}
      >
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div className="w-full mb-7 px-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          step={0.5}
          onChange={(e) => onSeekChange(Number(e.target.value))}
          onMouseUp={(e) =>
            onSeekCommit(Number((e.target as HTMLInputElement).value))
          }
          onTouchEnd={(e) =>
            onSeekCommit(Number((e.target as HTMLInputElement).value))
          }
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--accent-color) ${progress}%, oklch(0.30 0.01 265) ${progress}%)`,
          }}
          data-ocid="audio_player.seek_slider"
        />
      </div>
      <div className="flex items-center justify-center gap-8">
        <button
          type="button"
          onClick={onRewind}
          disabled={seekDisabled}
          className="flex flex-col items-center gap-1 p-3 rounded-full hover:bg-white/5 transition-colors disabled:opacity-40"
          aria-label="Rewind 10s"
          data-ocid="audio_player.rewind_button"
        >
          <RotateCcw size={22} style={{ color: "oklch(0.75 0.01 265)" }} />
          <span
            className="text-[9px] font-semibold"
            style={{ color: "oklch(0.5 0.01 265)" }}
          >
            10s
          </span>
        </button>
        <button
          type="button"
          onClick={onPlayPause}
          disabled={playDisabled}
          className="flex items-center justify-center rounded-full transition-all disabled:opacity-40"
          style={{
            width: 64,
            height: 64,
            background: "var(--accent-color)",
            boxShadow: isPlaying
              ? "0 0 24px oklch(var(--primary) / 0.5)"
              : "none",
            transition: "box-shadow 0.3s ease",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
          data-ocid="audio_player.play_pause_button"
        >
          {isPlaying ? (
            <Pause size={26} fill="white" style={{ color: "white" }} />
          ) : (
            <Play
              size={26}
              fill="white"
              style={{ color: "white", marginLeft: 3 }}
            />
          )}
        </button>
        <button
          type="button"
          onClick={onForward}
          disabled={seekDisabled}
          className="flex flex-col items-center gap-1 p-3 rounded-full hover:bg-white/5 transition-colors disabled:opacity-40"
          aria-label="Forward 10s"
          data-ocid="audio_player.forward_button"
        >
          <RotateCw size={22} style={{ color: "oklch(0.75 0.01 265)" }} />
          <span
            className="text-[9px] font-semibold"
            style={{ color: "oklch(0.5 0.01 265)" }}
          >
            10s
          </span>
        </button>
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function AudioPlayer({ song, onClose }: AudioPlayerProps) {
  if (isDirectAudioUrl(song.youtubeUrl)) {
    return <NativeAudioPlayer song={song} onClose={onClose} />;
  }
  return <YouTubeAudioPlayer song={song} onClose={onClose} />;
}
