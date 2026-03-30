import { ChevronLeft, Maximize, Minimize, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Song } from "../types";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

function extractYouTubeId(url: string): string {
  if (!url) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    return u.searchParams.get("v") || url;
  } catch {
    return url;
  }
}

interface VideoPlayerProps {
  song: Song;
  onClose: () => void;
  dataSaver?: boolean;
}

export function VideoPlayer({ song, onClose, dataSaver }: VideoPlayerProps) {
  const videoId = extractYouTubeId(song.youtubeUrl || "");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(70);
  const [playerReady, setPlayerReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerDivId = "yt-video-player";

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Load YT IFrame API and create player
  useEffect(() => {
    const initPlayer = () => {
      playerRef.current = new window.YT.Player(playerDivId, {
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          playsinline: 1,
          ...(dataSaver ? { vq: "large" } : {}),
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(70);
            setPlayerReady(true);
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, [videoId, dataSaver]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(val);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const isHighVolume = volume > 80;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8"
      style={{
        background: "oklch(0.158 0.010 265 / 0.96)",
        backdropFilter: "blur(16px)",
      }}
      data-ocid="video_player.modal"
    >
      <div
        ref={containerRef}
        className="w-full max-w-4xl rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "oklch(0.192 0.012 270)",
          border: "1px solid oklch(0.96 0.005 265 / 8%)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
            data-ocid="video_player.close_button"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          <h2 className="text-sm font-semibold text-foreground truncate px-4 flex-1 text-center">
            {song.title}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              data-ocid="video_player.toggle"
            >
              {isFullscreen ? (
                <Minimize size={18} className="text-muted-foreground" />
              ) : (
                <Maximize size={18} className="text-muted-foreground" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close player"
              data-ocid="video_player.cancel_button"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Video embed via YT Player API */}
        <div className="relative" style={{ paddingBottom: "56.25%" }}>
          <div id={playerDivId} className="absolute inset-0 w-full h-full" />
        </div>

        {/* Volume control */}
        <div
          className="px-5 py-4"
          style={{
            background: "oklch(0.17 0.010 265)",
            borderTop: "1px solid oklch(0.96 0.005 265 / 8%)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Volume2
              size={16}
              style={{
                color: isHighVolume
                  ? "#f87171"
                  : "oklch(var(--muted-foreground))",
              }}
              className="flex-shrink-0"
            />
            <span
              className="text-xs font-semibold"
              style={{
                color: isHighVolume
                  ? "#f87171"
                  : "oklch(var(--muted-foreground))",
              }}
            >
              Volume
            </span>
            <span
              className="text-xs font-bold ml-auto"
              style={{
                color: isHighVolume ? "#f87171" : "oklch(var(--foreground))",
              }}
            >
              {volume}%
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={handleVolumeChange}
            data-ocid="video_player.toggle"
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none"
            style={{
              background: `linear-gradient(to right, ${
                isHighVolume
                  ? "#f87171"
                  : "var(--accent-color, oklch(0.72 0.19 290))"
              } ${volume}%, oklch(0.28 0.010 265) ${volume}%)`,
              accentColor: isHighVolume
                ? "#f87171"
                : "var(--accent-color, oklch(0.72 0.19 290))",
            }}
          />

          {/* Warning */}
          {isHighVolume && (
            <p
              className="mt-2 text-xs font-medium flex items-center gap-1.5"
              style={{ color: "#f87171" }}
              data-ocid="video_player.error_state"
            >
              ⚠️ High volume may damage your hearing
            </p>
          )}

          {!playerReady && (
            <p
              className="mt-2 text-xs"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              Loading player...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
