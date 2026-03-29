import { Music2, Radio, Settings, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SocialIcon } from "../components/SocialIcon";
import type { SocialProfile, Song } from "../types";

interface HomePageProps {
  onNavigate: (page: string) => void;
  socialProfiles: SocialProfile[];
  songs: Song[];
}

export function HomePage({ onNavigate, socialProfiles, songs }: HomePageProps) {
  const [isLive, setIsLive] = useState(false);
  const [newSong, setNewSong] = useState<Song | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkLive = () => {
      const url = localStorage.getItem("liveStreamUrl") ?? "";
      setIsLive(Boolean(url));
    };
    checkLive();
    const interval = setInterval(checkLive, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const lastVisit = Number(localStorage.getItem("lastVisitTime") ?? 0);
    localStorage.setItem("lastVisitTime", String(Date.now()));

    if (songs.length > 0 && lastVisit > 0) {
      const newSongs = songs
        .filter((s) => s.addedAt && s.addedAt > lastVisit)
        .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));

      if (newSongs.length > 0) {
        setNewSong(newSongs[0]);
        dismissTimer.current = setTimeout(
          () => setNewSong(null),
          7 * 60 * 1000,
        );
      }
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [songs]);

  const handleNewSongTap = (song: Song) => {
    localStorage.setItem("openSongId", song.id);
    setNewSong(null);
    onNavigate("/songs");
  };

  const showLive = isLive;
  const showNewSong = !isLive && Boolean(newSong);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12 animate-fade-in">
      {/* Hero logo */}
      <div className="mb-6 flex items-center justify-center">
        <img
          src="/assets/uploads/unnamed-019d39d0-d234-7035-b935-2f8115eca61d-1.png"
          alt="Musical Rhythms Logo"
          className="w-40 h-40 object-contain drop-shadow-lg"
        />
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2 text-center">
        Musical Rhythms
      </h1>
      <p className="text-muted-foreground text-base font-medium mb-8 text-center">
        Music by Soham Jagtap
      </p>

      {/* Live notification banner */}
      {showLive && (
        <button
          type="button"
          onClick={() => onNavigate("/live")}
          className="w-full max-w-md mb-8 flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left"
          style={{
            background: "oklch(0.63 0.22 25 / 0.12)",
            border: "1px solid oklch(0.63 0.22 25 / 0.35)",
            boxShadow: "0 4px 16px oklch(0.63 0.22 25 / 0.15)",
          }}
          data-ocid="home.live_notification"
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: "oklch(0.63 0.22 25)" }}
          />
          <div className="flex-1">
            <p
              className="text-sm font-bold"
              style={{ color: "oklch(0.75 0.18 25)" }}
            >
              🔴 Soham is Live!
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.65 0.14 25)" }}
            >
              Tap to join the live session
            </p>
          </div>
          <Radio size={18} style={{ color: "oklch(0.75 0.18 25)" }} />
        </button>
      )}

      {/* New song notification banner */}
      {showNewSong && newSong && (
        <button
          type="button"
          onClick={() => handleNewSongTap(newSong)}
          className="w-full max-w-md mb-8 flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left"
          style={{
            background: "oklch(var(--primary) / 0.10)",
            border: "1px solid oklch(var(--primary) / 0.30)",
            boxShadow: "0 4px 16px oklch(var(--primary) / 0.12)",
          }}
          data-ocid="home.new_song_notification"
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: "var(--accent-color)" }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: "var(--accent-color)" }}
            >
              🎵 New Song Added!
            </p>
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: "oklch(var(--muted-foreground))" }}
            >
              {newSong.title} — Tap to listen
            </p>
          </div>
          <Music2 size={18} style={{ color: "var(--accent-color)" }} />
        </button>
      )}

      {/* 2×2 Menu grid */}
      <div className="w-full max-w-md">
        <div className="grid grid-cols-2 gap-4">
          {/* Songs */}
          <button
            type="button"
            onClick={() => onNavigate("/songs")}
            data-ocid="home.songs.button"
            className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{ background: "oklch(var(--primary) / 0.15)" }}
            >
              <Music2 size={28} style={{ color: "var(--accent-color)" }} />
            </div>
            <span className="text-sm font-semibold text-foreground">Songs</span>
          </button>

          {/* Live */}
          <button
            type="button"
            onClick={() => onNavigate("/live")}
            data-ocid="home.live.button"
            className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{ background: "oklch(0.63 0.22 25 / 0.15)" }}
            >
              <Radio size={28} style={{ color: "var(--live-red)" }} />
            </div>
            <span className="text-sm font-semibold text-foreground">Live</span>
          </button>

          {/* About Creator */}
          <button
            type="button"
            onClick={() => onNavigate("/about")}
            data-ocid="home.about.button"
            className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{ background: "oklch(var(--primary) / 0.15)" }}
            >
              <User size={28} style={{ color: "var(--accent-color)" }} />
            </div>
            <span className="text-sm font-semibold text-foreground">
              About Creator
            </span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => onNavigate("/settings")}
            data-ocid="home.settings.button"
            className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{ background: "oklch(var(--primary) / 0.15)" }}
            >
              <Settings size={28} style={{ color: "var(--accent-color)" }} />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Settings
            </span>
          </button>
        </div>

        {/* Social Media Profiles */}
        {socialProfiles.length > 0 && (
          <div className="mt-6">
            <p
              className="text-xs font-semibold uppercase tracking-widest text-center mb-3"
              style={{ color: "var(--accent-color)" }}
            >
              Connect with Me
            </p>
            <div
              className="flex flex-wrap justify-center gap-3"
              data-ocid="home.social.list"
            >
              {socialProfiles.map((profile, i) => (
                <a
                  key={profile.id}
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid={`home.social.item.${i + 1}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-[0.97]"
                  style={{
                    background: "oklch(var(--card))",
                    border: "1px solid oklch(var(--border))",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "var(--accent-color)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "oklch(var(--border))";
                  }}
                >
                  <SocialIcon platform={profile.icon} size={20} />
                  <span className="text-sm font-semibold text-foreground">
                    {profile.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
