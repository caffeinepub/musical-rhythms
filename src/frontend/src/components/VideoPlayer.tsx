import { ChevronLeft, Maximize, Minimize, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Song } from "../types";

interface VideoPlayerProps {
  song: Song;
  onClose: () => void;
  dataSaver?: boolean;
}

export function VideoPlayer({ song, onClose, dataSaver }: VideoPlayerProps) {
  const qualityParam = dataSaver ? "&vq=large" : "";
  const src = `https://www.youtube.com/embed/${song.youtubeUrl}?autoplay=1&rel=0&playsinline=1${qualityParam}`;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
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

        {/* Video embed */}
        <div className="relative" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={src}
            title={song.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}
