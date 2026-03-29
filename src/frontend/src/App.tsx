import React from "react";
import { useCallback, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { migrateSong } from "./data/songs";
import { useActor } from "./hooks/useActor";
import { AboutPage } from "./pages/AboutPage";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { LivePage } from "./pages/LivePage";
import { SettingsPage } from "./pages/SettingsPage";
import { SongsPage } from "./pages/SongsPage";
import type { Album, SocialProfile, Song } from "./types";

function getHashPage(): string {
  const hash = window.location.hash.replace("#", "");
  return hash || "/";
}

class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            color: "white",
            textAlign: "center",
            minHeight: "calc(100vh - 8rem)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "oklch(var(--background))",
          }}
        >
          <h2>Admin page failed to load</h2>
          <p
            style={{ opacity: 0.7, fontSize: "0.875rem", marginTop: "0.5rem" }}
          >
            {this.state.error}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: "" })}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#9b6ef3",
              border: "none",
              borderRadius: "0.5rem",
              color: "white",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { actor, isFetching } = useActor();
  const [currentPage, setCurrentPage] = useState<string>(getHashPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [themeId, setThemeId] = useState<string>(
    () => localStorage.getItem("themeId") ?? "dark-purple",
  );
  const [customTheme, setCustomTheme] = useState<{
    bg: string;
    accent: string;
  } | null>(() => {
    try {
      const s = localStorage.getItem("customTheme");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    return localStorage.getItem("dataSaver") === "true";
  });

  const refreshData = useCallback(async () => {
    if (!actor) return;
    try {
      const [rawSongs, rawAlbums, rawProfiles] = await Promise.all([
        (actor as any).getSongs() as Promise<any[]>,
        (actor as any).getAlbums() as Promise<Album[]>,
        (actor as any).getSocialProfiles() as Promise<SocialProfile[]>,
      ]);
      const mappedSongs: Song[] = rawSongs.map((s: any) =>
        migrateSong({ ...s, type: s.songType ?? s.type }),
      );
      setSongs(mappedSongs);
      setAlbums(rawAlbums);
      setSocialProfiles(rawProfiles);
    } catch (e) {
      console.error("Failed to refresh data", e);
    }
  }, [actor]);

  // Initial load: fetch from backend, migrate from localStorage if needed
  useEffect(() => {
    if (!actor || isFetching) return;

    (async () => {
      try {
        const [rawSongs, rawAlbums, rawProfiles] = await Promise.all([
          (actor as any).getSongs() as Promise<any[]>,
          (actor as any).getAlbums() as Promise<Album[]>,
          (actor as any).getSocialProfiles() as Promise<SocialProfile[]>,
        ]);

        // Migration: if backend is empty but localStorage has data, migrate it
        if (rawSongs.length === 0 && rawAlbums.length === 0) {
          const localSongs = localStorage.getItem("songs");
          const localAlbums = localStorage.getItem("albums");
          const localProfiles = localStorage.getItem("socialProfiles");

          const parsedAlbums: Album[] = localAlbums
            ? (JSON.parse(localAlbums) as Album[])
            : [];
          const parsedSongs: Song[] = localSongs
            ? (JSON.parse(localSongs) as Song[]).map(migrateSong)
            : [];
          const parsedProfiles: SocialProfile[] = localProfiles
            ? (JSON.parse(localProfiles) as SocialProfile[])
            : [];

          if (
            parsedAlbums.length > 0 ||
            parsedSongs.length > 0 ||
            parsedProfiles.length > 0
          ) {
            // Migrate albums first (songs reference albumIds)
            await Promise.all(
              parsedAlbums.map((a) => (actor as any).addAlbum(a)),
            );
            await Promise.all(
              parsedSongs.map((s) =>
                (actor as any).addSong({ ...s, songType: s.type }),
              ),
            );
            await Promise.all(
              parsedProfiles.map((p) => (actor as any).addSocialProfile(p)),
            );

            // Clear localStorage after migration
            localStorage.removeItem("songs");
            localStorage.removeItem("albums");
            localStorage.removeItem("socialProfiles");

            setSongs(parsedSongs);
            setAlbums(parsedAlbums);
            setSocialProfiles(parsedProfiles);
          } else {
            setSongs([]);
            setAlbums([]);
            setSocialProfiles([]);
          }
        } else {
          // Clear any leftover localStorage data
          localStorage.removeItem("songs");
          localStorage.removeItem("albums");
          localStorage.removeItem("socialProfiles");

          const mappedSongs: Song[] = rawSongs.map((s: any) =>
            migrateSong({ ...s, type: s.songType ?? s.type }),
          );
          setSongs(mappedSongs);
          setAlbums(rawAlbums);
          setSocialProfiles(rawProfiles);
        }
      } catch (e) {
        console.error("Failed to load data from backend", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [actor, isFetching]);

  useEffect(() => {
    const html = document.documentElement;
    const toRemove = Array.from(html.classList).filter(
      (c) => c.startsWith("theme-") || c === "light" || c === "dark",
    );
    for (const c of toRemove) {
      html.classList.remove(c);
    }
    html.classList.add(`theme-${themeId}`);

    if (themeId === "custom" && customTheme) {
      let style = document.getElementById(
        "custom-theme-style",
      ) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = "custom-theme-style";
        document.head.appendChild(style);
      }
      style.textContent = `html.theme-custom { --accent-color: ${customTheme.accent}; --accent-hover: ${customTheme.accent}; background-color: ${customTheme.bg}; color-scheme: light; }`;
    }

    if (themeId.startsWith("light-")) {
      html.style.colorScheme = "light";
    } else {
      html.style.colorScheme = "dark";
    }

    localStorage.setItem("themeId", themeId);
    if (customTheme) {
      localStorage.setItem("customTheme", JSON.stringify(customTheme));
    }
  }, [themeId, customTheme]);

  useEffect(() => {
    const handleHashChange = () => setCurrentPage(getHashPage());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("dataSaver", String(dataSaver));
  }, [dataSaver]);

  const navigate = useCallback((page: string) => {
    window.location.hash = page === "/" ? "" : page;
    setCurrentPage(page);
    setSidebarOpen(false);
  }, []);

  const handleThemeChange = useCallback(
    (id: string, custom?: { bg: string; accent: string }) => {
      setThemeId(id);
      if (custom) setCustomTheme(custom);
    },
    [],
  );

  const renderPage = () => {
    if (isLoading) {
      return (
        <div
          className="flex items-center justify-center flex-1 py-20"
          data-ocid="app.loading_state"
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: "var(--accent-color)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-sm text-muted-foreground">
              Loading Musical Rhythms…
            </p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case "/songs":
        return (
          <SongsPage songs={songs} albums={albums} dataSaver={dataSaver} />
        );
      case "/live":
        return <LivePage dataSaver={dataSaver} />;
      case "/admin":
        return (
          <AdminErrorBoundary>
            <AdminPage
              songs={songs}
              albums={albums}
              socialProfiles={socialProfiles}
              onDataChange={refreshData}
            />
          </AdminErrorBoundary>
        );
      case "/about":
        return <AboutPage onNavigate={navigate} />;
      case "/settings":
        return (
          <SettingsPage
            onNavigate={navigate}
            themeId={themeId}
            customTheme={customTheme}
            onThemeChange={handleThemeChange}
            dataSaver={dataSaver}
            onDataSaverChange={setDataSaver}
          />
        );
      default:
        return (
          <HomePage
            onNavigate={navigate}
            socialProfiles={socialProfiles}
            songs={songs}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col lg:ml-[260px]">
        <Header
          currentPage={currentPage}
          onNavigate={navigate}
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 pt-16 flex flex-col">{renderPage()}</main>

        <footer className="px-6 py-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with ♥ using caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
