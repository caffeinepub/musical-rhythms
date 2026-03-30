import { Music, Search, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SongCard } from "../components/SongCard";
import { VideoPlayer } from "../components/VideoPlayer";
import type { Album, Song } from "../types";

interface SongsPageProps {
  songs: Song[];
  albums: Album[];
  dataSaver?: boolean;
}

export function SongsPage({ songs, albums, dataSaver }: SongsPageProps) {
  const [search, setSearch] = useState("");
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  // Auto-open a song if one was queued from the new-song notification
  useEffect(() => {
    const pendingId = localStorage.getItem("openSongId");
    if (pendingId) {
      localStorage.removeItem("openSongId");
      const song = songs.find((s) => s.id === pendingId);
      if (song) setActiveSong(song);
    }
  }, [songs]);

  const q = search.trim().toLowerCase();

  const audioSongs = useMemo(
    () => songs.filter((s) => s.type === "Audio"),
    [songs],
  );
  const videoSongs = useMemo(
    () => songs.filter((s) => s.type !== "Audio"),
    [songs],
  );

  // Get albums that have songs of a given type, filtered by search
  const getAlbumsForSection = (sectionSongs: Song[]) => {
    return albums.filter((album) => {
      const albumSongs = sectionSongs.filter((s) => s.albumId === album.id);
      if (albumSongs.length === 0) return false;
      if (!q) return true;
      return (
        album.name.toLowerCase().includes(q) ||
        albumSongs.some((s) => s.title.toLowerCase().includes(q))
      );
    });
  };

  const getSongsForAlbum = (albumId: string, sectionSongs: Song[]) => {
    const albumSongs = sectionSongs.filter((s) => s.albumId === albumId);
    if (!q) return albumSongs;
    const album = albums.find((a) => a.id === albumId);
    if (album?.name.toLowerCase().includes(q)) return albumSongs;
    return albumSongs.filter((s) => s.title.toLowerCase().includes(q));
  };

  // Songs that don't belong to any known album
  const ungroupedAudioSongs = useMemo(
    () => audioSongs.filter((s) => !albums.some((a) => a.id === s.albumId)),
    [audioSongs, albums],
  );
  const ungroupedVideoSongs = useMemo(
    () => videoSongs.filter((s) => !albums.some((a) => a.id === s.albumId)),
    [videoSongs, albums],
  );

  const getFilteredUngrouped = (ungrouped: Song[]) => {
    if (!q) return ungrouped;
    return ungrouped.filter((s) => s.title.toLowerCase().includes(q));
  };

  const audioAlbums = getAlbumsForSection(audioSongs);
  const videoAlbums = getAlbumsForSection(videoSongs);

  const filteredUngroupedAudio = getFilteredUngrouped(ungroupedAudioSongs);
  const filteredUngroupedVideo = getFilteredUngrouped(ungroupedVideoSongs);

  const hasAudioContent =
    audioAlbums.length > 0 || filteredUngroupedAudio.length > 0;
  const hasVideoContent =
    videoAlbums.length > 0 || filteredUngroupedVideo.length > 0;
  const hasResults = hasAudioContent || hasVideoContent;

  let globalIndex = 0;

  const renderSection = (
    label: string,
    icon: React.ReactNode,
    sectionAlbums: typeof albums,
    sectionSongs: Song[],
    ungroupedSongs: Song[],
  ) => {
    const totalVisible = sectionSongs.filter(
      (s) =>
        !q ||
        s.title.toLowerCase().includes(q) ||
        albums
          .find((a) => a.id === s.albumId)
          ?.name.toLowerCase()
          .includes(q),
    ).length;

    if (sectionAlbums.length === 0 && ungroupedSongs.length === 0) return null;
    return (
      <section className="mb-10">
        {/* Section header */}
        <div
          className="flex items-center gap-2 mb-5 pb-2"
          style={{ borderBottom: "1.5px solid oklch(var(--border))" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(var(--primary) / 0.15)" }}
          >
            {icon}
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            {label}
          </h2>
          <span
            className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(var(--muted))",
              color: "oklch(var(--muted-foreground))",
            }}
          >
            {totalVisible}
          </span>
        </div>

        {sectionAlbums.map((album) => {
          const albumSongs = getSongsForAlbum(album.id, sectionSongs);
          if (albumSongs.length === 0) return null;
          return (
            <div key={album.id} className="mb-7">
              {/* Album header */}
              <div className="flex items-center gap-3 mb-3">
                {album.imageUrl ? (
                  <img
                    src={album.imageUrl}
                    alt={album.name}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="text-xl leading-none flex-shrink-0">
                    {album.icon || "🎵"}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-foreground">
                  {album.name}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {albumSongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    index={++globalIndex}
                    onPlay={setActiveSong}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Ungrouped songs fallback */}
        {ungroupedSongs.length > 0 && (
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl leading-none flex-shrink-0">🎵</span>
              <h3 className="text-sm font-semibold text-foreground">
                Other Songs
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {ungroupedSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  index={++globalIndex}
                  onPlay={setActiveSong}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="px-4 sm:px-6 py-6 animate-fade-in">
      {/* Search */}
      <div className="mb-7">
        <div
          className="relative flex items-center rounded-xl overflow-hidden max-w-lg"
          style={{
            background: "oklch(var(--muted))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <Search size={16} className="absolute left-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search albums or songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
            style={{ caretColor: "var(--accent-color)" }}
            data-ocid="songs.search_input"
          />
        </div>
      </div>

      {/* Audio Section */}
      {renderSection(
        "Audio",
        <Music size={16} style={{ color: "var(--accent-color)" }} />,
        audioAlbums,
        audioSongs,
        filteredUngroupedAudio,
      )}

      {/* Video Section */}
      {renderSection(
        "Video",
        <Video size={16} style={{ color: "var(--accent-color)" }} />,
        videoAlbums,
        videoSongs,
        filteredUngroupedVideo,
      )}

      {!hasResults && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
          data-ocid="songs.empty_state"
        >
          <Search size={40} className="text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-medium">No songs found</p>
        </div>
      )}

      {/* Player modal — all songs open in VideoPlayer */}
      {activeSong && (
        <VideoPlayer
          song={activeSong}
          onClose={() => setActiveSong(null)}
          dataSaver={dataSaver}
        />
      )}
    </div>
  );
}
