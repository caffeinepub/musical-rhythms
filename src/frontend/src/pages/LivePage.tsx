import { Button } from "@/components/ui/button";
import { Play, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";

interface LivePageProps {
  dataSaver?: boolean;
}

export function LivePage({ dataSaver }: LivePageProps) {
  const { actor } = useActor();
  const [liveUrl, setLiveUrl] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!actor) return;
    const fetchLiveUrl = async () => {
      const result = await (actor as any).getLiveUrl();
      const url = Array.isArray(result) ? (result[0] ?? "") : (result ?? "");
      setLiveUrl(url);
    };
    fetchLiveUrl();
    const interval = setInterval(fetchLiveUrl, 10000);
    return () => clearInterval(interval);
  }, [actor]);

  // Convert YouTube watch URL to embed URL
  const getEmbedUrl = (url: string): string => {
    if (!url) return "";
    const qualityParam = dataSaver ? "&vq=large" : "";
    const base = `?autoplay=1&rel=0${qualityParam}`;
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}${base}`;
    }
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}${base}`;
    }
    const liveMatch = url.match(/youtube\.com\/live\/([^?&]+)/);
    if (liveMatch) {
      return `https://www.youtube.com/embed/${liveMatch[1]}${base}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(liveUrl);
  const isLive = Boolean(liveUrl);

  const handleShareLive = () => {
    const shareLink = `${window.location.origin}${window.location.pathname}#/live`;
    if (navigator.share) {
      navigator
        .share({
          title: "Soham is Live! 🔴",
          text: "Join Soham Jagtap's live session on Musical Rhythms!",
          url: shareLink,
        })
        .catch(() => {
          /* user dismissed */
        });
    } else {
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 animate-fade-in">
      {/* Banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-semibold"
        style={{
          background: isLive
            ? "oklch(0.63 0.22 25 / 0.12)"
            : "oklch(var(--muted))",
          border: isLive
            ? "1px solid oklch(0.63 0.22 25 / 0.25)"
            : "1px solid oklch(var(--border))",
          color: isLive ? "oklch(0.75 0.18 25)" : undefined,
        }}
        data-ocid="live.banner"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isLive ? "animate-pulse" : "opacity-40"
          }`}
          style={{
            background: isLive ? "oklch(0.63 0.22 25)" : "currentColor",
          }}
        />
        {isLive
          ? "LIVE NOW 🔴 — Tune in for the latest performance"
          : "Currently Offline — Check back later for a live session"}
      </div>

      {/* Stream area */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
        data-ocid="live.panel"
      >
        {joined && embedUrl ? (
          <div className="relative" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="Live Stream"
              style={{ border: "none" }}
            />
          </div>
        ) : (
          <div className="relative" style={{ paddingBottom: "56.25%" }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6">
              {isLive ? (
                <>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.63 0.22 25 / 0.15)" }}
                  >
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-semibold text-sm mb-1">
                      Live session is on!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click Join to watch the live stream
                    </p>
                  </div>
                  <Button
                    onClick={() => setJoined(true)}
                    className="gap-2 px-6"
                    style={{
                      background: "oklch(0.63 0.22 25)",
                      color: "white",
                    }}
                    data-ocid="live.join_button"
                  >
                    <Play size={14} fill="white" />
                    Join Live
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(var(--primary) / 0.10)" }}
                  >
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground font-medium text-sm">
                      No live session right now
                    </p>
                    <p className="text-xs text-muted-foreground opacity-70 mt-1">
                      Follow for live updates
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {joined && (
          <div className="px-4 py-3 flex justify-end">
            <button
              type="button"
              onClick={() => setJoined(false)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="live.leave_button"
            >
              <X size={12} />
              Leave stream
            </button>
          </div>
        )}
      </div>

      {/* Share Live button — only shown when live is active */}
      {isLive && (
        <div className="mt-5 flex justify-center">
          <Button
            onClick={handleShareLive}
            variant="outline"
            className="gap-2 px-6"
            style={{
              border: "1px solid oklch(0.63 0.22 25 / 0.4)",
              color: copied ? "oklch(0.72 0.18 145)" : "oklch(0.75 0.18 25)",
              background: copied
                ? "oklch(0.52 0.20 145 / 0.10)"
                : "oklch(0.63 0.22 25 / 0.08)",
            }}
            data-ocid="live.share_button"
          >
            <Share2 size={14} />
            {copied ? "Link Copied! ✓" : "Share Live"}
          </Button>
        </div>
      )}
    </div>
  );
}
