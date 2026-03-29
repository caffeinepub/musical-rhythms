import { useCallback, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DEFAULT_ALBUMS, DEFAULT_SONGS, migrateSong } from "./data/songs";
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

function loadSongs(): Song[] {
  try {
    const stored = localStorage.getItem("songs");
    if (stored) return (JSON.parse(stored) as Song[]).map(migrateSong);
  } catch {
    // ignore
  }
  return DEFAULT_SONGS;
}

function loadAlbums(): Album[] {
  try {
    const stored = localStorage.getItem("albums");
    if (stored) {
      return JSON.parse(stored) as Album[];
    }
  } catch {
    // ignore
  }
  return DEFAULT_ALBUMS;
}

function loadSocialProfiles(): SocialProfile[] {
  try {
    const stored = localStorage.getItem("socialProfiles");
    if (stored) return JSON.parse(stored) as SocialProfile[];
  } catch {
    // ignore
  }
  return [];
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>(getHashPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>(loadSongs);
  const [albums, setAlbums] = useState<Album[]>(loadAlbums);
  const [socialProfiles, setSocialProfiles] =
    useState<SocialProfile[]>(loadSocialProfiles);
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
    localStorage.setItem("songs", JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem("albums", JSON.stringify(albums));
  }, [albums]);

  useEffect(() => {
    localStorage.setItem("socialProfiles", JSON.stringify(socialProfiles));
  }, [socialProfiles]);

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
    switch (currentPage) {
      case "/songs":
        return (
          <SongsPage songs={songs} albums={albums} dataSaver={dataSaver} />
        );
      case "/live":
        return <LivePage dataSaver={dataSaver} />;
      case "/admin":
        return (
          <AdminPage
            songs={songs}
            albums={albums}
            onSongsChange={setSongs}
            onAlbumsChange={setAlbums}
            socialProfiles={socialProfiles}
            onSocialProfilesChange={setSocialProfiles}
          />
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
