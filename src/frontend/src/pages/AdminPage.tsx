import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Eye,
  LogOut,
  Music,
  Plus,
  Radio,
  Share2,
  Square,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImageCropper } from "../components/ImageCropper";
import { SocialIcon } from "../components/SocialIcon";
import { sendLiveNotification } from "../notificationService";
import {
  addAlbum,
  addSocialProfile,
  addSong,
  clearAllLiveComments,
  clearLiveUrl,
  deleteAlbum,
  deleteSocialProfile,
  deleteSong,
  getLiveUrl,
  resetLiveHearts,
  setLiveUrl,
  subscribeLiveComments,
  subscribeToStats,
} from "../services/firebaseService";
import type { Album, SocialProfile, Song } from "../types";
import { LivePage } from "./LivePage";

const MUSICAL_ICONS = [
  { emoji: "🎵", label: "Music Note" },
  { emoji: "🎶", label: "Music Notes" },
  { emoji: "🎤", label: "Microphone" },
  { emoji: "🎸", label: "Guitar" },
  { emoji: "🎹", label: "Piano" },
  { emoji: "🎺", label: "Trumpet" },
  { emoji: "🎻", label: "Violin" },
  { emoji: "🥁", label: "Drums" },
  { emoji: "🎧", label: "Headphones" },
  { emoji: "🪗", label: "Accordion" },
  { emoji: "🪘", label: "Drum" },
  { emoji: "🪕", label: "Banjo" },
  { emoji: "🎷", label: "Saxophone" },
  { emoji: "🎼", label: "Music Score" },
  { emoji: "🎙️", label: "Studio Mic" },
  { emoji: "🙏", label: "Bhajan" },
  { emoji: "🌟", label: "Star" },
  { emoji: "❤️", label: "Heart" },
];

const SOCIAL_MEDIA_ICONS = [
  { key: "YouTube", label: "YouTube" },
  { key: "Instagram", label: "Instagram" },
  { key: "Facebook", label: "Facebook" },
  { key: "WhatsApp", label: "WhatsApp" },
  { key: "WhatsApp Business", label: "WA Business" },
  { key: "Twitter / X", label: "Twitter/X" },
  { key: "Telegram", label: "Telegram" },
  { key: "Spotify", label: "Spotify" },
  { key: "SoundCloud", label: "SoundCloud" },
  { key: "TikTok", label: "TikTok" },
  { key: "LinkedIn", label: "LinkedIn" },
  { key: "Snapchat", label: "Snapchat" },
  { key: "Podcast", label: "Podcast" },
  { key: "Website", label: "Website" },
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

interface AdminPageProps {
  songs: Song[];
  albums: Album[];
  socialProfiles: SocialProfile[];
  onDataChange: () => Promise<void>;
}

function getYouTubeVideoId(input: string): string {
  const s = input.trim();
  if (s.includes("watch?v=")) {
    return s.split("watch?v=")[1]?.split(/[&?]/)[0] ?? s;
  }
  if (s.includes("youtu.be/")) {
    return s.split("youtu.be/")[1]?.split(/[&?]/)[0] ?? s;
  }
  if (s.includes("youtube.com/embed/")) {
    return s.split("youtube.com/embed/")[1]?.split(/[&?]/)[0] ?? s;
  }
  return s.split(/[&?]/)[0];
}

function isDirectAudioUrl(url: string): boolean {
  const u = url.toLowerCase().trim();
  if (u.match(/\.(mp3|ogg|wav|m4a|aac|flac|opus|webm)(\?.*)?$/)) return true;
  if (u.includes("firebasestorage.googleapis.com") && u.includes("alt=media"))
    return true;
  if (u.includes("dropbox.com") && u.includes("dl=1")) return true;
  return false;
}

type AdminTab = "songs" | "live" | "social" | "stats";

export function AdminPage({
  songs,
  albums,
  socialProfiles,
  onDataChange,
}: AdminPageProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("adminLoggedIn") === "true",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("songs");

  // Global error banner
  const [error, setError] = useState<string | null>(null);

  // Add song form
  const [songTitle, setSongTitle] = useState("");
  const [songYoutubeId, setSongYoutubeId] = useState("");
  const [songType, setSongType] = useState<"Video" | "Audio">("Video");
  const [songAlbumId, setSongAlbumId] = useState<string>("no-album");
  type SongStatus = "idle" | "downloading" | "added";
  const [songStatus, setSongStatus] = useState<SongStatus>("idle");
  const [songAddedInfo, setSongAddedInfo] = useState<{
    title: string;
    albumName: string;
  } | null>(null);

  // Add album form
  const [albumName, setAlbumName] = useState("");
  const [albumIcon, setAlbumIcon] = useState("🎵");
  const [albumImageDataUrl, setAlbumImageDataUrl] = useState("");
  const [albumImageMode, setAlbumImageMode] = useState<"icon" | "upload">(
    "icon",
  );
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live stream URL
  const [liveUrl, setLiveUrlState] = useState("");
  const [savedLiveUrl, setSavedLiveUrl] = useState("");

  useEffect(() => {
    getLiveUrl()
      .then((url) => {
        if (url) {
          setSavedLiveUrl(url);
          setLiveUrlState(url);
        }
      })
      .catch(() => {});
  }, []);

  const [liveSaved, setLiveSaved] = useState(false);
  const [shareLiveCopied, setShareLiveCopied] = useState(false);
  const [stats, setStats] = useState({ followers: 0, views: 0 });
  const FCM_SERVER_KEY =
    "BEnC50uRTu8DeoGVGmVr4gskVA1PFcY2Z-DhGLUr-R9BBYaIvQNZ8xneWDHasT-koKUxG64R0TvXKIB8G9eOCq8";

  useEffect(() => {
    const unsub = subscribeToStats((s) => setStats(s));
    return unsub;
  }, []);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Social media profiles
  const [socialIcon, setSocialIcon] = useState("YouTube");
  const [socialName, setSocialName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [socialAdded, setSocialAdded] = useState(false);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleStartRecording = async () => {
    try {
      // Capture the full screen/tab including comments overlay
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 } as MediaTrackConstraints,
        audio: true,
      });

      // Create canvas to composite screen + comments overlay
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d")!;

      // Create a video element to display the screen stream
      const screenVideo = document.createElement("video");
      screenVideo.srcObject = screenStream;
      screenVideo.muted = true;
      await screenVideo.play();

      let animFrameId: number;
      const currentCommentsRef = {
        value: [] as { authorName: string; text: string; isAdmin: boolean }[],
      };

      // Subscribe to comments to overlay them on canvas
      const unsubComments = subscribeLiveComments((c) => {
        currentCommentsRef.value = c.slice(-8);
      });

      const drawFrame = () => {
        // Draw screen capture
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

        // Draw comments overlay at bottom-left (like YouTube Live)
        const comments = currentCommentsRef.value;
        if (comments.length > 0) {
          const startY = canvas.height - 40 - comments.length * 36;
          comments.forEach((comment, i) => {
            const y = startY + i * 36;
            // Semi-transparent background pill
            ctx.save();
            ctx.globalAlpha = 0.65;
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            (ctx as any).roundRect(16, y - 20, 500, 30, 8);
            ctx.fill();
            ctx.restore();
            // Author name
            ctx.fillStyle = comment.isAdmin ? "#ff9944" : "#8ecfff";
            ctx.font = "bold 14px Arial";
            ctx.fillText(
              comment.isAdmin ? "Musical Rhythms (Admin)" : comment.authorName,
              24,
              y - 2,
            );
            // Comment text
            const nameWidth = ctx.measureText(
              comment.isAdmin ? "Musical Rhythms (Admin)" : comment.authorName,
            ).width;
            ctx.fillStyle = "#ffffff";
            ctx.font = "14px Arial";
            ctx.fillText(`: ${comment.text}`, 24 + nameWidth, y - 2);
          });
        }

        animFrameId = requestAnimationFrame(drawFrame);
      };
      drawFrame();

      // Combine canvas stream with audio from screen
      const canvasStream = canvas.captureStream(30);
      const audioTracks = screenStream.getAudioTracks();
      for (const t of audioTracks) canvasStream.addTrack(t);

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(canvasStream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        cancelAnimationFrame(animFrameId);
        unsubComments();
        for (const t of screenStream.getTracks()) t.stop();
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `live-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(
        () => setRecordingTime((t) => t + 1),
        1000,
      );

      // Stop when screen share ends
      screenStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      };
    } catch {
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const handleLogin = () => {
    if (username === "admin" && password === "admin@1902") {
      localStorage.setItem("adminLoggedIn", "true");
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid credentials. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    setIsLoggedIn(false);
  };

  const handleAddSong = async () => {
    if (
      !songTitle.trim() ||
      !songYoutubeId.trim() ||
      !songAlbumId ||
      songAlbumId === "no-album"
    )
      return;
    setError(null);
    setSongStatus("downloading");
    const rawUrl = songYoutubeId.trim();
    const youtubeUrl = isDirectAudioUrl(rawUrl)
      ? rawUrl
      : (getYouTubeVideoId(rawUrl) ?? rawUrl);
    try {
      await addSong({
        id: generateId(),
        title: songTitle.trim(),
        youtubeUrl: youtubeUrl,
        thumbnail: "",
        albumId: songAlbumId,
        type: songType,
        addedAt: Date.now(),
      });
      await onDataChange();
      const albumNameStr =
        albums.find((a) => a.id === songAlbumId)?.name ?? "Unknown Album";
      setSongAddedInfo({ title: songTitle.trim(), albumName: albumNameStr });
      setSongStatus("added");
      setSongTitle("");
      setSongYoutubeId("");
      setTimeout(() => {
        setSongStatus("idle");
        setSongAddedInfo(null);
      }, 4000);
    } catch (err: any) {
      setSongStatus("idle");
      setError(err?.message || "Failed to add song. Please try again.");
    }
  };

  const handleDeleteSong = async (id: string) => {
    setError(null);
    try {
      await deleteSong(id);
      await onDataChange();
    } catch (err: any) {
      setError(err?.message || "Failed to delete song. Please try again.");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddAlbum = async () => {
    if (!albumName.trim()) return;
    setError(null);
    try {
      await addAlbum({
        id: generateId(),
        name: albumName.trim(),
        imageUrl: albumImageMode === "upload" ? albumImageDataUrl : "",
        icon: albumImageMode === "icon" ? albumIcon : "",
      });
      await onDataChange();
      setAlbumName("");
      setAlbumImageDataUrl("");
      setAlbumIcon("🎵");
      setAlbumImageMode("icon");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message || "Failed to create album. Please try again.");
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    setError(null);
    try {
      await deleteAlbum(id);
      await onDataChange();
    } catch (err: any) {
      setError(err?.message || "Failed to delete album. Please try again.");
    }
  };

  const handleSetLiveUrl = async () => {
    const url = liveUrl.trim();
    if (!url) return;
    setError(null);
    try {
      await setLiveUrl(url);
      setSavedLiveUrl(url);
      setLiveSaved(true);
      setTimeout(() => setLiveSaved(false), 3000);
      sendLiveNotification(FCM_SERVER_KEY);
    } catch (err: any) {
      setError(err?.message || "Failed to go live. Please try again.");
    }
  };

  const handleClearLiveUrl = async () => {
    setError(null);
    try {
      await clearLiveUrl();
      await clearAllLiveComments();
      await resetLiveHearts();
      setSavedLiveUrl("");
      setLiveUrlState("");
      setLiveSaved(false);
    } catch (err: any) {
      setError(err?.message || "Failed to end live. Please try again.");
    }
  };

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
        setShareLiveCopied(true);
        setTimeout(() => setShareLiveCopied(false), 3000);
      });
    }
  };

  const handleAddSocialProfile = async () => {
    if (!socialName.trim() || !socialUrl.trim()) return;
    setError(null);
    const newProfile: SocialProfile = {
      id: generateId(),
      name: socialName.trim(),
      icon: socialIcon,
      url: socialUrl.trim(),
    };
    try {
      await addSocialProfile(newProfile);
      await onDataChange();
      setSocialName("");
      setSocialUrl("");
      setSocialAdded(true);
      setTimeout(() => setSocialAdded(false), 3000);
    } catch (err: any) {
      setError(
        err?.message || "Failed to add social profile. Please try again.",
      );
    }
  };

  const handleDeleteSocialProfile = async (id: string) => {
    setError(null);
    try {
      await deleteSocialProfile(id);
      await onDataChange();
    } catch (err: any) {
      setError(
        err?.message || "Failed to delete social profile. Please try again.",
      );
    }
  };

  const panelStyle = {
    background: "oklch(var(--card))",
    border: "1px solid oklch(var(--border))",
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  };

  if (!isLoggedIn) {
    return (
      <div
        className="flex items-center justify-center px-4 py-16 animate-fade-in"
        style={{
          minHeight: "calc(100vh - 8rem)",
          background: "oklch(var(--background))",
        }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8"
          style={panelStyle}
          data-ocid="admin.dialog"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(var(--primary) / 0.15)" }}
            >
              <Music size={20} style={{ color: "var(--accent-color)" }} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Admin Login</h1>
              <p className="text-xs text-muted-foreground">Musical Rhythms</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Username
              </Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="bg-muted border-border"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                data-ocid="admin.username.input"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-muted border-border"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                data-ocid="admin.password.input"
              />
            </div>

            {loginError && (
              <p
                className="text-xs font-medium"
                style={{ color: "var(--live-red)" }}
                data-ocid="admin.error_state"
              >
                {loginError}
              </p>
            )}

            <Button
              className="w-full mt-2"
              style={{ background: "var(--accent-color)" }}
              onClick={handleLogin}
              data-ocid="admin.submit_button"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tab definitions
  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "songs", label: "Songs & Albums", icon: <Music size={18} /> },
    {
      id: "live",
      label: "Live",
      icon: <Radio size={18} />,
    },
    { id: "social", label: "Social Media", icon: <Share2 size={18} /> },
    { id: "stats", label: "Status", icon: <Users size={18} /> },
  ];

  return (
    <div
      className="flex flex-col animate-fade-in"
      style={{
        minHeight: "calc(100vh - 8rem)",
        background: "oklch(var(--background))",
      }}
    >
      {/* Image cropper overlay */}
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onCrop={(dataUrl) => {
            setAlbumImageDataUrl(dataUrl);
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Top header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          borderColor: "oklch(var(--border))",
          background: "oklch(var(--card))",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(var(--primary) / 0.15)" }}
          >
            <Music size={16} style={{ color: "var(--accent-color)" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">
              Admin Panel
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Musical Rhythms
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl"
          style={{ background: "oklch(var(--muted))" }}
          data-ocid="admin.logout_button"
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>

      {/* Tab bar */}
      <div
        className="flex border-b overflow-x-auto"
        style={{
          borderColor: "oklch(var(--border))",
          background: "oklch(var(--card))",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-1 px-4 py-3 text-[11px] font-semibold transition-colors flex-1 min-w-[72px] whitespace-nowrap"
            style={{
              color:
                activeTab === tab.id
                  ? "var(--accent-color)"
                  : "oklch(var(--muted-foreground))",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid var(--accent-color)"
                  : "2px solid transparent",
              background: "transparent",
            }}
          >
            <span
              style={{
                color: activeTab === tab.id ? "var(--accent-color)" : undefined,
              }}
            >
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Global error */}
      {error && (
        <div
          className="mx-4 mt-4 flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{
            background: "oklch(0.45 0.22 25 / 0.15)",
            border: "1px solid oklch(0.55 0.22 25 / 0.4)",
            color: "oklch(0.80 0.18 25)",
          }}
          data-ocid="admin.error_state"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* SONGS & ALBUMS TAB */}
        {activeTab === "songs" && (
          <div className="px-4 py-5 space-y-5">
            {/* Add Song */}
            <div className="rounded-2xl p-5" style={panelStyle}>
              <h2 className="text-base font-semibold text-foreground mb-4">
                Add Song
              </h2>

              {songStatus === "downloading" && (
                <div
                  className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: "oklch(0.75 0.18 80 / 0.15)",
                    border: "1px solid oklch(0.75 0.18 80 / 0.3)",
                    color: "oklch(0.75 0.18 80)",
                  }}
                  data-ocid="admin.song_added.notification"
                >
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "oklch(0.75 0.18 80)",
                      borderTopColor: "transparent",
                    }}
                  />
                  <span>⏳ Downloading and saving song...</span>
                </div>
              )}
              {songStatus === "added" && songAddedInfo && (
                <div
                  className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: "oklch(0.52 0.20 145 / 0.15)",
                    border: "1px solid oklch(0.52 0.20 145 / 0.3)",
                    color: "oklch(0.72 0.18 145)",
                  }}
                  data-ocid="admin.song_added.notification"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>{songAddedInfo.title}</strong> added to{" "}
                    <strong>{songAddedInfo.albumName}</strong>
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Song Title
                  </Label>
                  <Input
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="e.g. Tum Hi Ho Cover"
                    className="bg-muted border-border"
                    data-ocid="admin.song_title.input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    YouTube URL / Direct Audio Link
                  </Label>
                  <Input
                    value={songYoutubeId}
                    onChange={(e) => setSongYoutubeId(e.target.value)}
                    placeholder={
                      songType === "Audio"
                        ? "YouTube URL, video ID, or direct .mp3 link"
                        : "YouTube URL or video ID"
                    }
                    className="bg-muted border-border"
                    data-ocid="admin.youtube_url.input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Type
                    </Label>
                    <Select
                      value={songType}
                      onValueChange={(v) => setSongType(v as "Video" | "Audio")}
                    >
                      <SelectTrigger
                        className="bg-muted border-border"
                        data-ocid="admin.song_type.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Video">Video</SelectItem>
                        <SelectItem value="Audio">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Album
                    </Label>
                    <Select value={songAlbumId} onValueChange={setSongAlbumId}>
                      <SelectTrigger
                        className="bg-muted border-border"
                        data-ocid="admin.song_album.select"
                      >
                        <SelectValue placeholder="Select album" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-album" disabled>
                          Select an album
                        </SelectItem>
                        {albums.map((album) => (
                          <SelectItem key={album.id} value={album.id}>
                            {album.icon && !album.imageUrl
                              ? `${album.icon} `
                              : ""}
                            {album.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleAddSong}
                  disabled={
                    songStatus === "downloading" ||
                    songStatus === "added" ||
                    !songTitle.trim() ||
                    !songYoutubeId.trim() ||
                    !songAlbumId ||
                    songAlbumId === "no-album"
                  }
                  className="gap-2 w-full"
                  style={{
                    background:
                      songStatus === "downloading"
                        ? "oklch(0.75 0.18 80)"
                        : songStatus === "added"
                          ? "oklch(0.52 0.20 145)"
                          : "var(--accent-color)",
                    color: "white",
                  }}
                  data-ocid="admin.add_song.button"
                >
                  {songStatus === "downloading" ? (
                    <>
                      <span
                        className="inline-block w-3.5 h-3.5 rounded-full border-2 animate-spin"
                        style={{
                          borderColor: "white",
                          borderTopColor: "transparent",
                        }}
                      />
                      Downloading...
                    </>
                  ) : songStatus === "added" ? (
                    <>
                      <CheckCircle2 size={14} />
                      Added ✓
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Add Song
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Create Album */}
            <div className="rounded-2xl p-5" style={panelStyle}>
              <h2 className="text-base font-semibold text-foreground mb-4">
                Create Album
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Album Name
                  </Label>
                  <Input
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    placeholder="e.g. Bollywood Covers Vol. 1"
                    className="bg-muted border-border"
                    data-ocid="admin.album_name.input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Album Artwork
                  </Label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setAlbumImageMode("icon")}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
                      style={{
                        background:
                          albumImageMode === "icon"
                            ? "var(--accent-color)"
                            : "oklch(var(--muted))",
                        color: albumImageMode === "icon" ? "#fff" : undefined,
                        border: "1px solid oklch(var(--border))",
                      }}
                    >
                      🎵 Choose Icon
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlbumImageMode("upload")}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
                      style={{
                        background:
                          albumImageMode === "upload"
                            ? "var(--accent-color)"
                            : "oklch(var(--muted))",
                        color: albumImageMode === "upload" ? "#fff" : undefined,
                        border: "1px solid oklch(var(--border))",
                      }}
                    >
                      📷 Upload Image
                    </button>
                  </div>

                  {albumImageMode === "icon" && (
                    <div className="grid grid-cols-9 gap-1.5">
                      {MUSICAL_ICONS.map(({ emoji, label }) => (
                        <button
                          key={emoji}
                          type="button"
                          title={label}
                          onClick={() => setAlbumIcon(emoji)}
                          className="p-2 rounded-xl text-xl transition-all flex items-center justify-center"
                          style={{
                            background:
                              albumIcon === emoji
                                ? "oklch(var(--primary) / 0.25)"
                                : "oklch(var(--muted))",
                            border:
                              albumIcon === emoji
                                ? "2px solid var(--accent-color)"
                                : "2px solid transparent",
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {albumImageMode === "upload" && (
                    <div className="space-y-2">
                      {albumImageDataUrl ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={albumImageDataUrl}
                            alt="Album artwork"
                            className="w-16 h-16 rounded-full object-cover border-2"
                            style={{ borderColor: "var(--accent-color)" }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setAlbumImageDataUrl("");
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-8 rounded-xl border-2 border-dashed text-center text-sm text-muted-foreground hover:border-accent transition-colors flex flex-col items-center gap-2"
                          style={{ borderColor: "oklch(var(--border))" }}
                        >
                          <Upload size={20} />
                          Tap to upload image
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAddAlbum}
                  disabled={!albumName.trim()}
                  className="gap-2 w-full"
                  style={{ background: "var(--accent-color)" }}
                  data-ocid="admin.create_album.button"
                >
                  <Plus size={14} />
                  Create Album
                </Button>
              </div>
            </div>

            {/* Albums list */}
            <div className="rounded-2xl p-5" style={panelStyle}>
              <h2 className="text-base font-semibold text-foreground mb-4">
                Albums ({albums.length})
              </h2>
              {albums.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-ocid="admin.albums.empty_state"
                >
                  No albums yet. Create your first album above.
                </p>
              ) : (
                <div className="space-y-2">
                  {albums.map((album, i) => {
                    const count = songs.filter(
                      (s) => s.albumId === album.id,
                    ).length;
                    return (
                      <div
                        key={album.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: "oklch(var(--muted))" }}
                        data-ocid={`admin.albums.item.${i + 1}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {album.imageUrl ? (
                            <img
                              src={album.imageUrl}
                              alt={album.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <span className="text-xl flex-shrink-0">
                              {album.icon || "🎵"}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {album.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {count} song{count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAlbum(album.id)}
                          className="ml-3 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors group"
                          data-ocid={`admin.albums.delete_button.${i + 1}`}
                        >
                          <Trash2
                            size={14}
                            className="text-muted-foreground group-hover:text-destructive"
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Song list */}
            <div className="rounded-2xl p-5" style={panelStyle}>
              <h2 className="text-base font-semibold text-foreground mb-4">
                Manage Songs ({songs.length})
              </h2>
              {songs.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-ocid="admin.songs.empty_state"
                >
                  No songs yet.
                </p>
              ) : (
                <div className="space-y-2" data-ocid="admin.songs.list">
                  {songs.map((song, i) => {
                    const album = albums.find((a) => a.id === song.albumId);
                    return (
                      <div
                        key={song.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: "oklch(var(--muted))" }}
                        data-ocid={`admin.songs.item.${i + 1}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {song.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {album ? (
                              <span>
                                {album.icon || album.imageUrl
                                  ? (album.icon ?? "🎵")
                                  : ""}{" "}
                                {album.name}
                              </span>
                            ) : (
                              "No album"
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSong(song.id)}
                          className="ml-3 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors group"
                          data-ocid={`admin.songs.delete_button.${i + 1}`}
                        >
                          <Trash2
                            size={14}
                            className="text-muted-foreground group-hover:text-destructive"
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIVE TAB */}
        {activeTab === "live" && (
          <div className="px-4 py-5 space-y-5">
            {/* Live URL controls */}
            <div
              className="rounded-2xl p-5"
              style={panelStyle}
              data-ocid="admin.live_stream.panel"
            >
              <div className="flex items-center gap-2 mb-4">
                <Radio size={16} style={{ color: "oklch(0.75 0.18 25)" }} />
                <h2 className="text-base font-semibold text-foreground">
                  Live Stream
                </h2>
                {savedLiveUrl && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: "oklch(0.63 0.22 25 / 0.15)",
                      color: "oklch(0.75 0.18 25)",
                    }}
                  >
                    🔴 LIVE
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Paste your live stream link (YouTube, etc.)
                  </Label>
                  <Input
                    value={liveUrl}
                    onChange={(e) => {
                      setLiveUrlState(e.target.value);
                      setLiveSaved(false);
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="bg-muted border-border"
                    data-ocid="admin.live_url.input"
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    onClick={handleSetLiveUrl}
                    disabled={!liveUrl.trim()}
                    className="gap-2"
                    style={{ background: "oklch(0.52 0.20 145)" }}
                    data-ocid="admin.set_live.button"
                  >
                    {liveSaved ? (
                      <>
                        <CheckCircle2 size={14} />
                        Added ✓
                      </>
                    ) : (
                      <>
                        <Radio size={14} />
                        Go Live
                      </>
                    )}
                  </Button>
                  {savedLiveUrl && (
                    <Button
                      variant="outline"
                      onClick={handleClearLiveUrl}
                      className="gap-2 border-border text-muted-foreground hover:text-foreground text-xs"
                      data-ocid="admin.clear_live.button"
                    >
                      End Live
                    </Button>
                  )}
                </div>
                {savedLiveUrl && (
                  <p className="text-xs text-green-400 flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    Live stream is active — visible on the Live page
                  </p>
                )}
                {savedLiveUrl && (
                  <Button
                    onClick={handleShareLive}
                    variant="outline"
                    className="gap-2"
                    style={{
                      border: "1px solid oklch(0.63 0.22 25 / 0.4)",
                      color: shareLiveCopied
                        ? "oklch(0.72 0.18 145)"
                        : "oklch(0.75 0.18 25)",
                      background: shareLiveCopied
                        ? "oklch(0.52 0.20 145 / 0.10)"
                        : "oklch(0.63 0.22 25 / 0.08)",
                    }}
                    data-ocid="admin.share_live.button"
                  >
                    <Share2 size={14} />
                    {shareLiveCopied ? "Link Copied! ✓" : "Share Live"}
                  </Button>
                )}
              </div>
            </div>

            {/* Live Recording panel — only when live is active */}
            {savedLiveUrl && (
              <div
                className="rounded-2xl p-5"
                style={panelStyle}
                data-ocid="admin.recording.panel"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      background: isRecording
                        ? "oklch(0.63 0.22 25)"
                        : "oklch(var(--muted-foreground))",
                      boxShadow: isRecording
                        ? "0 0 0 4px oklch(0.63 0.22 25 / 0.25)"
                        : "none",
                      animation: isRecording ? "pulse 1.2s infinite" : "none",
                    }}
                  />
                  <h2 className="text-base font-semibold text-foreground">
                    Record Live Stream
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Record your screen while streaming and download the video to
                  your device.
                </p>

                {isRecording ? (
                  <div className="space-y-3">
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{
                        background: "oklch(0.63 0.22 25 / 0.12)",
                        border: "1px solid oklch(0.63 0.22 25 / 0.25)",
                      }}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          background: "oklch(0.63 0.22 25)",
                          animation: "pulse 1s infinite",
                        }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "oklch(0.75 0.18 25)" }}
                      >
                        ● Recording... {formatTime(recordingTime)}
                      </span>
                    </div>
                    <Button
                      onClick={handleStopRecording}
                      className="gap-2 w-full"
                      style={{
                        background: "oklch(0.52 0.22 25)",
                        color: "white",
                      }}
                      data-ocid="admin.stop_recording.button"
                    >
                      <Square size={14} fill="white" />
                      Stop & Download
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleStartRecording}
                    className="gap-2 w-full"
                    style={{
                      background: "var(--accent-color)",
                      color: "white",
                    }}
                    data-ocid="admin.start_recording.button"
                  >
                    <Radio size={14} />
                    Start Recording
                  </Button>
                )}
              </div>
            )}

            {/* Live preview + comments — shown when live is active */}
            {savedLiveUrl ? (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid oklch(var(--border))" }}
              >
                <div
                  className="px-4 py-2 text-xs font-semibold"
                  style={{
                    background: "oklch(0.63 0.22 25 / 0.12)",
                    color: "oklch(0.75 0.18 25)",
                  }}
                >
                  🔴 Your live stream (admin view)
                </div>
                <LivePage isAdmin={true} />
              </div>
            ) : (
              <div className="rounded-2xl p-6 text-center" style={panelStyle}>
                <Radio size={28} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">
                  Start a live stream above to see the preview and manage
                  comments here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SOCIAL MEDIA TAB */}
        {activeTab === "social" && (
          <div className="px-4 py-5 space-y-5">
            <div
              className="rounded-2xl p-5"
              style={panelStyle}
              data-ocid="admin.social.panel"
            >
              <div className="flex items-center gap-2 mb-4">
                <Share2 size={16} style={{ color: "var(--accent-color)" }} />
                <h2 className="text-base font-semibold text-foreground">
                  Social Media Profiles
                </h2>
              </div>

              {socialAdded && (
                <div
                  className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: "oklch(0.52 0.20 145 / 0.15)",
                    border: "1px solid oklch(0.52 0.20 145 / 0.3)",
                    color: "oklch(0.72 0.18 145)",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Social profile added successfully!</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Choose Platform
                  </Label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {SOCIAL_MEDIA_ICONS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        title={label}
                        onClick={() => setSocialIcon(key)}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all"
                        style={{
                          background:
                            socialIcon === key
                              ? "oklch(var(--primary) / 0.25)"
                              : "oklch(var(--muted))",
                          border:
                            socialIcon === key
                              ? "2px solid var(--accent-color)"
                              : "2px solid transparent",
                        }}
                      >
                        <SocialIcon platform={key} size={22} />
                        <span className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-1">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Profile Name
                  </Label>
                  <Input
                    value={socialName}
                    onChange={(e) => setSocialName(e.target.value)}
                    placeholder="e.g. My YouTube Channel"
                    className="bg-muted border-border"
                    data-ocid="admin.social_name.input"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Profile URL
                  </Label>
                  <Input
                    value={socialUrl}
                    onChange={(e) => setSocialUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-muted border-border"
                    data-ocid="admin.social_url.input"
                  />
                </div>

                <Button
                  onClick={handleAddSocialProfile}
                  disabled={!socialName.trim() || !socialUrl.trim()}
                  className="gap-2 w-full"
                  style={{ background: "var(--accent-color)" }}
                  data-ocid="admin.add_social.button"
                >
                  <Plus size={14} />
                  Add Profile
                </Button>
              </div>
            </div>

            {/* Existing profiles */}
            {socialProfiles.length > 0 && (
              <div className="rounded-2xl p-5" style={panelStyle}>
                <h2 className="text-base font-semibold text-foreground mb-4">
                  Your Profiles ({socialProfiles.length})
                </h2>
                <div className="space-y-2">
                  {socialProfiles.map((profile, i) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: "oklch(var(--muted))" }}
                      data-ocid={`admin.social.item.${i + 1}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <SocialIcon platform={profile.icon} size={22} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {profile.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.url}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSocialProfile(profile.id)}
                        className="ml-3 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors group"
                        data-ocid={`admin.social.delete_button.${i + 1}`}
                      >
                        <Trash2
                          size={14}
                          className="text-muted-foreground group-hover:text-destructive"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STATUS TAB */}
        {activeTab === "stats" && (
          <div className="px-4 py-5 space-y-5">
            <div
              className="rounded-2xl p-5"
              style={panelStyle}
              data-ocid="admin.stats.panel"
            >
              <h2 className="text-base font-semibold text-foreground mb-4">
                Status
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="flex flex-col items-center gap-2 p-5 rounded-xl"
                  style={{
                    background: "oklch(var(--primary) / 0.10)",
                    border: "1px solid oklch(var(--primary) / 0.20)",
                  }}
                >
                  <Users size={24} style={{ color: "var(--accent-color)" }} />
                  <p className="text-3xl font-bold text-foreground">
                    {stats.followers}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Followers
                  </p>
                </div>
                <div
                  className="flex flex-col items-center gap-2 p-5 rounded-xl"
                  style={{
                    background: "oklch(var(--primary) / 0.10)",
                    border: "1px solid oklch(var(--primary) / 0.20)",
                  }}
                >
                  <Eye size={24} style={{ color: "var(--accent-color)" }} />
                  <p className="text-3xl font-bold text-foreground">
                    {stats.views}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Views
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={panelStyle}>
              <h2 className="text-base font-semibold text-foreground mb-3">
                Content Summary
              </h2>
              <div className="space-y-2">
                {[
                  { label: "Total Songs", value: songs.length },
                  { label: "Total Albums", value: albums.length },
                  { label: "Social Profiles", value: socialProfiles.length },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ background: "oklch(var(--muted))" }}
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
