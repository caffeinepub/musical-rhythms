import { Button } from "@/components/ui/button";
import { Heart, Pin, Play, Send, Share2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  addLiveComment,
  clearAllLiveComments,
  deleteLiveComment,
  incrementLiveHearts,
  pinLiveComment,
  resetLiveHearts,
  subscribeLiveComments,
  subscribeLiveHearts,
  subscribeToLiveUrl,
} from "../services/firebaseService";
import type { LiveComment } from "../services/firebaseService";

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

interface LivePageProps {
  dataSaver?: boolean;
  isAdmin?: boolean;
}

interface FloatingHeart {
  id: number;
  x: number;
}

export function LivePage({ dataSaver, isAdmin = false }: LivePageProps) {
  const [liveUrl, setLiveUrl] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);

  // Comments
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [authorName, setAuthorName] = useState(
    () => localStorage.getItem("mr_display_name") || "",
  );
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [pendingComment, setPendingComment] = useState("");
  const commentListRef = useRef<HTMLDivElement>(null);

  // Hearts
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const lastHeartCountRef = useRef(0);
  const heartIdRef = useRef(0);

  // Track previous isLive to detect transition
  const wasLiveRef = useRef(false);

  // Live elapsed timer
  const [liveElapsed, setLiveElapsed] = useState(0);
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = subscribeToLiveUrl((url) => setLiveUrl(url));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeLiveComments((c) => setComments(c));
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeLiveHearts((_count, lastAt) => {
      // Only trigger animation if someone just sent a heart (lastAt changed)
      if (lastAt > 0 && lastAt !== lastHeartCountRef.current) {
        lastHeartCountRef.current = lastAt;
        const x = 30 + Math.random() * 40;
        const id = ++heartIdRef.current;
        setFloatingHearts((prev) => [...prev, { id, x }]);
        setTimeout(() => {
          setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
        }, 2000);
      }
    });
    return unsub;
  }, []);

  // Auto-clear comments and hearts when live ends
  const isLive = Boolean(liveUrl);
  useEffect(() => {
    if (wasLiveRef.current && !isLive) {
      clearAllLiveComments().catch(console.error);
      resetLiveHearts().catch(console.error);
    }
    wasLiveRef.current = isLive;
  }, [isLive]);

  // Start/stop elapsed timer when live status changes
  useEffect(() => {
    if (isLive) {
      setLiveElapsed(0);
      liveTimerRef.current = setInterval(
        () => setLiveElapsed((s) => s + 1),
        1000,
      );
    } else {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
      setLiveElapsed(0);
    }
    return () => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    };
  }, [isLive]);

  // Auto-scroll comments to bottom
  const commentCountRef = useRef(0);
  const scrollCount = comments.length;
  commentCountRef.current = scrollCount;
  useEffect(() => {
    if (commentListRef.current) {
      commentListRef.current.scrollTop = commentListRef.current.scrollHeight;
    }
  });

  const formatLiveTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const ss = String(sec).padStart(2, "0");
    if (h > 0) return `${hh}:${mm}:${ss}`;
    return `${mm}:${ss}`;
  };

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return shortMatch[1];
    const liveMatch = url.match(/youtube\.com\/live\/([^?&]+)/);
    if (liveMatch) return liveMatch[1];
    return null;
  };

  const getEmbedUrl = (url: string): string => {
    if (!url) return "";
    const qualityParam = dataSaver ? "&vq=large" : "";
    const base = `?autoplay=1&rel=0&playsinline=1${qualityParam}`;
    const videoId = getYouTubeVideoId(url);
    if (videoId) return `https://www.youtube.com/embed/${videoId}${base}`;
    return url;
  };

  const embedUrl = getEmbedUrl(liveUrl);
  const videoId = getYouTubeVideoId(liveUrl);
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;
  const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

  const handleShareLive = () => {
    const shareLink = `${window.location.origin}${window.location.pathname}#/live`;
    if (navigator.share) {
      navigator
        .share({
          title: "Soham is Live! 🔴",
          text: "Join Soham Jagtap's live session on Musical Rhythms!",
          url: shareLink,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  const submitComment = async (name: string, text: string) => {
    if (!text.trim() || !name.trim()) return;
    try {
      await addLiveComment({
        authorName: isAdmin ? "Sohan Jagtap (Admin)" : name.trim(),
        text: text.trim(),
        timestamp: Date.now(),
        isAdmin,
        isPinned: false,
      });
      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    if (!isAdmin && !authorName) {
      setPendingComment(commentText);
      setShowNamePrompt(true);
      return;
    }
    submitComment(isAdmin ? "Sohan Jagtap (Admin)" : authorName, commentText);
  };

  const handleNameConfirm = () => {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    localStorage.setItem("mr_display_name", name);
    setAuthorName(name);
    setShowNamePrompt(false);
    setNameInput("");
    submitComment(name, pendingComment);
    setPendingComment("");
  };

  const handleHeart = async () => {
    // Local animation
    const x = 30 + Math.random() * 40;
    const id = ++heartIdRef.current;
    setFloatingHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 2000);
    await incrementLiveHearts();
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await deleteLiveComment(id);
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  const handlePinComment = async (id: string, pinned: boolean) => {
    try {
      await pinLiveComment(id, !pinned);
    } catch (err) {
      console.error("Pin comment error:", err);
    }
  };

  const pinnedComment = comments.find((c) => c.isPinned);
  const unpinnedComments = comments.filter((c) => !c.isPinned);

  const renderStream = () => {
    if (!joined || !embedUrl) return null;
    if (isIOS && videoId) {
      return (
        <div className="relative" style={{ paddingBottom: "56.25%" }}>
          <div className="absolute inset-0">
            <img
              src={thumbnailUrl ?? ""}
              alt="Live stream"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <a
                href={ytUrl ?? ""}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 rounded-full font-semibold text-sm text-white"
                style={{ background: "oklch(0.52 0.22 25)" }}
              >
                <Play size={16} fill="white" /> Open in YouTube
              </a>
              <p className="text-xs text-white/70 text-center px-6">
                Tap to open in YouTube app for best experience on iOS
              </p>
            </div>
          </div>
        </div>
      );
    }
    return (
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
    );
  };

  return (
    <div className="px-4 sm:px-6 py-6 animate-fade-in">
      {/* Live banner */}
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
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
        data-ocid="live.panel"
      >
        {/* Live timer overlay */}
        {isLive && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold z-20"
            style={{
              background: "rgba(220,38,38,0.92)",
              color: "white",
              backdropFilter: "blur(4px)",
              letterSpacing: "0.04em",
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "white", flexShrink: 0 }}
            />
            {"LIVE  "}
            {formatLiveTime(liveElapsed)}
          </div>
        )}

        {/* Floating hearts overlay */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 10 }}
        >
          {floatingHearts.map((h) => (
            <div
              key={h.id}
              className="absolute bottom-16 animate-bounce"
              style={{
                left: `${h.x}%`,
                animation: "floatUp 2s ease-out forwards",
                fontSize: "1.8rem",
              }}
            >
              ❤️
            </div>
          ))}
        </div>

        {joined && embedUrl ? (
          renderStream()
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
                      {isIOS
                        ? "Tap Join to open in YouTube app"
                        : "Click Join to watch the live stream"}
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

      {/* Share + Heart row — only shown when live */}
      {isLive && (
        <div className="mt-4 flex items-center gap-3 justify-center flex-wrap">
          <Button
            onClick={handleShareLive}
            variant="outline"
            className="gap-2 px-5"
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

          <button
            type="button"
            onClick={handleHeart}
            className="flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all active:scale-90 hover:scale-105"
            style={{
              background: "oklch(0.63 0.22 0 / 0.15)",
              border: "1px solid oklch(0.63 0.22 0 / 0.35)",
              color: "oklch(0.75 0.18 0)",
            }}
            data-ocid="live.heart_button"
          >
            <Heart size={16} fill="currentColor" />
            Like
          </button>
        </div>
      )}

      {/* Comments section — only shown when live */}
      {isLive && (
        <div
          className="mt-6 rounded-2xl overflow-hidden"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
          data-ocid="live.comments"
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "oklch(var(--border))" }}
          >
            <p className="text-sm font-semibold text-foreground">Live Chat</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Pinned comment */}
          {pinnedComment && (
            <div
              className="px-4 py-3 border-b"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--primary) / 0.08)",
              }}
            >
              <div className="flex items-start gap-2">
                <Pin
                  size={13}
                  style={{
                    color: "var(--accent-color)",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--accent-color)" }}
                  >
                    {pinnedComment.isAdmin
                      ? "Sohan Jagtap (Admin)"
                      : pinnedComment.authorName}
                    {pinnedComment.isAdmin && (
                      <span
                        className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                        style={{
                          background: "oklch(0.63 0.22 25 / 0.18)",
                          color: "oklch(0.75 0.18 25)",
                        }}
                      >
                        Admin
                      </span>
                    )}
                  </span>
                  <p className="text-xs text-foreground mt-0.5">
                    {pinnedComment.text}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePinComment(pinnedComment.id, true)}
                      className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
                      title="Unpin"
                    >
                      <X size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(pinnedComment.id)}
                      className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comment list */}
          <div
            ref={commentListRef}
            className="px-4 py-3 space-y-3 overflow-y-auto"
            style={{ maxHeight: "280px" }}
          >
            {unpinnedComments.length === 0 && !pinnedComment && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No comments yet. Be the first to say something!
              </p>
            )}
            {unpinnedComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold overflow-hidden"
                  style={{
                    background: comment.isAdmin
                      ? "oklch(0.63 0.22 25 / 0.20)"
                      : "oklch(var(--primary) / 0.15)",
                    color: comment.isAdmin
                      ? "oklch(0.75 0.18 25)"
                      : "var(--accent-color)",
                  }}
                >
                  {comment.isAdmin ? (
                    <img
                      src="/assets/unnamed-019d39d0-d234-7035-b935-2f8115eca61d.png"
                      alt="MR"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    comment.authorName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: comment.isAdmin
                          ? "oklch(0.75 0.18 25)"
                          : "var(--accent-color)",
                      }}
                    >
                      {comment.isAdmin
                        ? "Sohan Jagtap (Admin)"
                        : comment.authorName}
                    </span>
                    {comment.isAdmin && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: "oklch(0.63 0.22 25 / 0.18)",
                          color: "oklch(0.75 0.18 25)",
                        }}
                      >
                        Admin
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5 break-words">
                    {comment.text}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handlePinComment(comment.id, comment.isPinned)
                      }
                      className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
                      title="Pin comment"
                    >
                      <Pin size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity text-red-400"
                      title="Delete comment"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div
            className="px-4 py-3 border-t flex gap-2"
            style={{ borderColor: "oklch(var(--border))" }}
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
              placeholder={
                isAdmin ? "Comment as Sohan Jagtap..." : "Write a comment..."
              }
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-accent-color"
              style={{ minWidth: 0 }}
              data-ocid="live.comment_input"
            />
            <button
              type="button"
              onClick={handleSendComment}
              disabled={!commentText.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
              style={{ background: "var(--accent-color)" }}
              data-ocid="live.send_comment_button"
            >
              <Send size={15} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* Name prompt modal */}
      {showNamePrompt && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <h3 className="text-base font-bold text-foreground mb-1">
              What's your name?
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              This name will appear with your comments.
            </p>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameConfirm()}
              placeholder="Your name"
              className="w-full bg-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border mb-4"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowNamePrompt(false);
                  setPendingComment("");
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground"
                style={{ background: "oklch(var(--muted))" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNameConfirm}
                disabled={!nameInput.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--accent-color)" }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
