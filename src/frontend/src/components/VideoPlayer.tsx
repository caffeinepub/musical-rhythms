import { ChevronLeft, Maximize, Minimize, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
      width="36"
      height="36"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Rewind 10 seconds"
    >
      <title>Rewind 10 seconds</title>
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
      width="36"
      height="36"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Forward 10 seconds"
    >
      <title>Forward 10 seconds</title>
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
  const [controlsVisible, setControlsVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const fs = Boolean(document.fullscreenElement);
      setIsFullscreen(fs);
      if (fs) {
        try {
          (screen.orientation as any).lock("landscape").catch(() => {});
        } catch {}
        startHideTimer();
      } else {
        try {
          (screen.orientation as any).unlock();
        } catch {}
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setControlsVisible(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, [startHideTimer]);

  const handleTapOnVideo = useCallback(() => {
    if (!isFullscreen) return;
    startHideTimer();
  }, [isFullscreen, startHideTimer]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: videoId triggers player re-init
  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (!playerDivRef.current) return;

      // Clear any previous player
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }

      const quality = dataSaver ? "large" : "default";

      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          playsinline: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          suggestedQuality: quality,
        },
        events: {
          onReady: (event: any) => {
            event.target.unMute();
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
    if (isFullscreen) startHideTimer();
  };

  const handleRewind = () => {
    if (!playerReady || !playerRef.current) return;
    playerRef.current.seekTo(
      Math.max(0, playerRef.current.getCurrentTime() - 10),
      true,
    );
    if (isFullscreen) startHideTimer();
  };

  const handleForward = () => {
    if (!playerReady || !playerRef.current) return;
    playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10, true);
    if (isFullscreen) startHideTimer();
  };

  const accentColor = "var(--accent-color, oklch(0.72 0.19 290))";
  const barBg = "oklch(0.17 0.010 265)";
  const barBorder = "1px solid oklch(0.96 0.005 265 / 8%)";

  const controls = (
    <div
      className="flex flex-col gap-0"
      style={isFullscreen ? {} : { borderTop: barBorder }}
    >
      <div
        className="flex items-center justify-center gap-8 py-4"
        style={isFullscreen ? {} : { background: barBg }}
      >
        <button
          type="button"
          onClick={handleRewind}
          disabled={!playerReady}
          aria-label="Rewind 10 seconds"
          className="flex items-center justify-center rounded-full transition-all"
          style={{
            width: 54,
            height: 54,
            opacity: playerReady ? 1 : 0.4,
            cursor: playerReady ? "pointer" : "not-allowed",
            color: isFullscreen ? "white" : "oklch(0.72 0.05 265)",
            background: "transparent",
          }}
        >
          <RewindIcon />
        </button>

        <button
          type="button"
          onClick={handlePlayPause}
          disabled={!playerReady}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex items-center justify-center rounded-full transition-all"
          style={{
            width: 52,
            height: 52,
            background: playerReady ? accentColor : "oklch(0.35 0.010 265)",
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
          className="flex items-center justify-center rounded-full transition-all"
          style={{
            width: 54,
            height: 54,
            opacity: playerReady ? 1 : 0.4,
            cursor: playerReady ? "pointer" : "not-allowed",
            color: isFullscreen ? "white" : "oklch(0.72 0.05 265)",
            background: "transparent",
          }}
        >
          <ForwardIcon />
        </button>
      </div>
    </div>
  );

  const playerDiv = (
    <div
      ref={playerDivRef}
      style={{ width: "100%", height: "100%", background: "#000" }}
    />
  );

  if (isFullscreen) {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: tap-to-show overlay for video fullscreen
      <div
        ref={containerRef}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        onClick={handleTapOnVideo}
        style={{ cursor: controlsVisible ? "default" : "none" }}
      >
        <div className="w-full h-full">{playerDiv}</div>

        <div
          className="absolute inset-0 flex flex-col justify-between pointer-events-none"
          style={{
            transition: "opacity 0.3s ease",
            opacity: controlsVisible ? 1 : 0,
          }}
        >
          <div
            className="flex items-center justify-between px-4 pt-4 pb-8 pointer-events-auto"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-white"
            >
              <ChevronLeft size={20} /> Back
            </button>
            <span className="text-sm font-semibold text-white truncate px-4 flex-1 text-center">
              {song.title}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-1.5"
              aria-label="Exit fullscreen"
            >
              <Minimize size={20} className="text-white" />
            </button>
          </div>

          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation helper div */}
          <div
            className="pointer-events-auto"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {controls}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8"
      style={{
        background: "oklch(0.158 0.010 265 / 0.96)",
        backdropFilter: "blur(16px)",
      }}
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
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <h2 className="text-sm font-semibold text-foreground truncate px-4 flex-1 text-center">
            {song.title}
          </h2>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="relative" style={{ paddingBottom: "56.25%" }}>
          <div className="absolute inset-0" style={{ background: "#000" }}>
            {playerDiv}
          </div>
        </div>

        {controls}
      </div>
    </div>
  );
}
