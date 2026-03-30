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
  LogOut,
  Music,
  Plus,
  Radio,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImageCropper } from "../components/ImageCropper";
import { SocialIcon } from "../components/SocialIcon";
import {
  addAlbum,
  addSocialProfile,
  addSong,
  clearLiveUrl,
  deleteAlbum,
  deleteSocialProfile,
  deleteSong,
  getLiveUrl,
  setLiveUrl,
} from "../services/firebaseService";
import type { Album, SocialProfile, Song } from "../types";

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

  // Global error banner
  const [error, setError] = useState<string | null>(null);

  // Add song form
  const [songTitle, setSongTitle] = useState("");
  const [songYoutubeId, setSongYoutubeId] = useState("");
  const [songType, setSongType] = useState<"Video" | "Audio">("Video");
  const [songAlbumId, setSongAlbumId] = useState<string>("no-album");
  const [songAdded, setSongAdded] = useState<{
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

  // Load live URL from Firebase on mount
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

  // Social media profiles
  const [socialIcon, setSocialIcon] = useState("YouTube");
  const [socialName, setSocialName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [socialAdded, setSocialAdded] = useState(false);

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
    const videoId = getYouTubeVideoId(songYoutubeId);
    try {
      await addSong({
        id: generateId(),
        title: songTitle.trim(),
        youtubeUrl: videoId ?? songYoutubeId.trim(),
        thumbnail: "",
        albumId: songAlbumId,
        type: songType,
        addedAt: Date.now(),
      });
      await onDataChange();
      const albumNameStr =
        albums.find((a) => a.id === songAlbumId)?.name ?? "Unknown Album";
      setSongAdded({ title: songTitle.trim(), albumName: albumNameStr });
      setSongTitle("");
      setSongYoutubeId("");
      setTimeout(() => setSongAdded(null), 4000);
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err?.message || "Failed to go live. Please try again.");
    }
  };

  const handleClearLiveUrl = async () => {
    setError(null);
    try {
      await clearLiveUrl();
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
        .catch(() => {
          /* user dismissed */
        });
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

  return (
    <div
      className="px-4 sm:px-6 py-6 space-y-6 animate-fade-in"
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

      {/* Welcome bar */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">
          Welcome, Admin
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2 border-border text-muted-foreground hover:text-foreground"
          data-ocid="admin.logout.button"
        >
          <LogOut size={14} />
          Logout
        </Button>
      </div>

      {/* Global error banner */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium"
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
            aria-label="Dismiss error"
            data-ocid="admin.error.close_button"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Live Stream URL */}
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
              className="gap-2 mt-1"
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

      {/* Social Media Profiles */}
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
            data-ocid="admin.social_added.success_state"
          >
            <CheckCircle2 size={16} />
            <span>Social profile added successfully!</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Icon picker */}
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
              placeholder="https://youtube.com/..."
              className="bg-muted border-border"
              data-ocid="admin.social_url.input"
            />
          </div>

          <Button
            onClick={handleAddSocialProfile}
            disabled={!socialName.trim() || !socialUrl.trim()}
            className="gap-2 w-full sm:w-auto"
            style={{ background: "var(--accent-color)" }}
            data-ocid="admin.add_social.button"
          >
            <Plus size={14} />
            Add Profile
          </Button>

          {/* Added profiles list */}
          {socialProfiles.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Added Profiles ({socialProfiles.length})
              </p>
              {socialProfiles.map((profile, i) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: "oklch(var(--muted))" }}
                  data-ocid={`admin.social.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="flex-shrink-0">
                      <SocialIcon platform={profile.icon} size={22} />
                    </span>
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
                    aria-label={`Delete ${profile.name}`}
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
          )}
        </div>
      </div>

      {/* Add Song */}
      <div className="rounded-2xl p-5" style={panelStyle}>
        <h2 className="text-base font-semibold text-foreground mb-4">
          Add Song
        </h2>

        {songAdded && (
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
              <strong>{songAdded.title}</strong> added to{" "}
              <strong>{songAdded.albumName}</strong>
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
              YouTube URL or Video ID
            </Label>
            <Input
              value={songYoutubeId}
              onChange={(e) => setSongYoutubeId(e.target.value)}
              placeholder="e.g. dQw4w9WgXcQ or full URL"
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
                      {album.icon && !album.imageUrl ? `${album.icon} ` : ""}
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
              !songTitle.trim() ||
              !songYoutubeId.trim() ||
              !songAlbumId ||
              songAlbumId === "no-album"
            }
            className="gap-2 w-full sm:w-auto"
            style={{ background: "var(--accent-color)" }}
            data-ocid="admin.add_song.button"
          >
            <Plus size={14} />
            Add Song
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

          {/* Image mode tabs */}
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
                <Upload size={12} className="inline mr-1" />
                Upload Image
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
                    className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all"
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:text-foreground transition-colors flex flex-col items-center gap-2"
                  style={{ borderColor: "oklch(var(--border))" }}
                  data-ocid="admin.album_image.upload_button"
                >
                  <Upload size={20} />
                  {albumImageDataUrl
                    ? "Image cropped — tap to change"
                    : "Tap to upload & crop image from device"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {albumImageDataUrl && (
                  <img
                    src={albumImageDataUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
              </div>
            )}
          </div>

          <Button
            onClick={handleAddAlbum}
            disabled={!albumName.trim()}
            className="gap-2 w-full sm:w-auto"
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
              const count = songs.filter((s) => s.albumId === album.id).length;
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
                    aria-label={`Delete ${album.name}`}
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
                    aria-label={`Delete ${song.title}`}
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
  );
}
