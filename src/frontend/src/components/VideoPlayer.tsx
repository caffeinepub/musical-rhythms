import { ChevronLeft, Maximize, Minimize, Pause, Play, X } from "lucide-react";
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

function RewindIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Rewind 10 seconds"
    >
      <path
        d="M7.5 14 A6.5 6.5 0 1 1 10.5 19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <polyline
        points="5,11 7.5,14 10.5,12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="14"
        y="16.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="currentColor"
        fontFamily="system-ui"
      >
        10
      </text>
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Forward 10 seconds"
    >
      <path
        d="M20.5 14 A6.5 6.5 0 1 0 17.5 19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <polyline
        points="23,11 20.5,14 17.5,12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <text
        x="14"
        y="16.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="currentColor"
        fontFamily="system-ui"
      >
        10
      </text>
    </svg>
  );
}

interface VideoPlayerProps {
  song: Song;
  onClose: () => void;
  dataSaver?: boolean;
}

export function VideoPlayer({ song, onClose, dataSaver }: VideoPlayerProps) {
  const videoId = extractYouTubeId(song.youtubeUrl || "");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerDivId = `yt-video-player-${videoId}`;

  useEffect(() => {
    const handleFsChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: videoId triggers player re-init when song changes
  useEffect(() => {
    const attachPlayer = () => {
      if (!iframeRef.current) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: (event: any) => {
            event.target.setVolume(100);
            event.target.playVideo();
            setPlayerReady(true);
            setIsPlaying(true);
          },
          onStateChange: (event: any) => {
            if (event.data === 1) setIsPlaying(true);
            else if (event.data === 2 || event.data === 0) setIsPlaying(false);
          },
        },
      });
    };

    if (window.YT?.Player) {
      attachPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = attachPlayer;
    }

    return () => {
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
      playerRef.current = null;
      setPlayerReady(false);
      setIsPlaying(false);
    };
  }, [videoId]);

  const toggleFullscreen = () => {
    if (!isFullscreen)
      containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const handlePlayPause = () => {
    if (!playerReady || !playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const handleRewind = () => {
    if (!playerReady || !playerRef.current) return;
    playerRef.current.seekTo(
      Math.max(0, playerRef.current.getCurrentTime() - 10),
      true,
    );
  };

  const handleForward = () => {
    if (!playerReady || !playerRef.current) return;
    playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true);
  };

  // Build embed URL with all parameters to hide YouTube UI and autoplay
  const qualityParam = dataSaver ? "&vq=large" : "";
  const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&showinfo=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}${qualityParam}`;

  const bar = {
    background: "oklch(0.17 0.010 265)",
    borderTop: "1px solid oklch(0.96 0.005 265 / 8%)",
  };

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
            <ChevronLeft size={16} /> Back
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

        {/* Video embed — muted autoplay with all YouTube UI hidden */}
        <div className="relative" style={{ paddingBottom: "56.25%" }}>
          <iframe
            ref={iframeRef}
            id={playerDivId}
            src={iframeSrc}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ border: "none" }}
            title={song.title}
          />
        </div>

        {/* Playback controls */}
        <div
          className="flex items-center justify-center gap-8 py-3"
          style={bar}
        >
          <button
            type="button"
            onClick={handleRewind}
            disabled={!playerReady}
            aria-label="Rewind 10 seconds"
            data-ocid="video_player.secondary_button"
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: 44,
              height: 44,
              opacity: playerReady ? 1 : 0.4,
              cursor: playerReady ? "pointer" : "not-allowed",
              color: "oklch(0.72 0.05 265)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              if (playerReady)
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(0.96 0.005 265 / 10%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <RewindIcon />
          </button>

          <button
            type="button"
            onClick={handlePlayPause}
            disabled={!playerReady}
            aria-label={isPlaying ? "Pause" : "Play"}
            data-ocid="video_player.primary_button"
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: 52,
              height: 52,
              background: playerReady
                ? "var(--accent-color, oklch(0.72 0.19 290))"
                : "oklch(0.35 0.010 265)",
              opacity: playerReady ? 1 : 0.4,
              cursor: playerReady ? "pointer" : "not-allowed",
              boxShadow: playerReady
                ? "0 4px 16px oklch(0.72 0.19 290 / 40%)"
                : "none",
              flexShrink: 0,
            }}
          >
            {isPlaying ? (
              <Pause size={22} color="white" fill="white" />
            ) : (
              <Play
                size={22}
                color="white"
                fill="white"
                style={{ marginLeft: 2 }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={handleForward}
            disabled={!playerReady}
            aria-label="Forward 10 seconds"
            data-ocid="video_player.secondary_button"
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: 44,
              height: 44,
              opacity: playerReady ? 1 : 0.4,
              cursor: playerReady ? "pointer" : "not-allowed",
              color: "oklch(0.72 0.05 265)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              if (playerReady)
                (e.currentTarget as HTMLElement).style.background =
                  "oklch(0.96 0.005 265 / 10%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <ForwardIcon />
          </button>
        </div>

        {/* Volume info — browsers cannot control device volume */}
        <div className="px-5 py-3 flex items-center justify-center" style={bar}>
          <span
            className="text-xs text-center"
            style={{ color: "oklch(0.58 0.01 265)" }}
          >
            🔊 Use your device volume buttons to adjust volume
          </span>
        </div>
      </div>
    </div>
  );
}
