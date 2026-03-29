import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SongCard } from "../components/SongCard";
import { VideoPlayer } from "../components/VideoPlayer";
import type { Album, Song } from "../types";

interface SongsPageProps {
  songs: Song[];
  albums: Album[];
}

export function SongsPage({ songs, albums }: SongsPageProps) {
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

  // Albums that match search query (by name) or contain matching songs
  const visibleAlbums = useMemo(() => {
    return albums.filter((album) => {
      const albumSongs = songs.filter((s) => s.albumId === album.id);
      if (albumSongs.length === 0) return false;
      if (!q) return true;
      // Show album if album name matches OR any song in it matches
      return (
        album.name.toLowerCase().includes(q) ||
        albumSongs.some((s) => s.title.toLowerCase().includes(q))
      );
    });
  }, [albums, songs, q]);

  const getSongsForAlbum = (albumId: string) => {
    const albumSongs = songs.filter((s) => s.albumId === albumId);
    if (!q) return albumSongs;
    // If album name matches search, show all songs in that album
    const album = albums.find((a) => a.id === albumId);
    if (album?.name.toLowerCase().includes(q)) return albumSongs;
    // Otherwise filter songs by title
    return albumSongs.filter((s) => s.title.toLowerCase().includes(q));
  };

  let globalIndex = 0;

  return (
    <div className="px-4 sm:px-6 py-6 animate-fade-in">
      {/* Search */}
      <div className="mb-6">
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

      {/* Album sections */}
      {visibleAlbums.map((album) => {
        const albumSongs = getSongsForAlbum(album.id);
        if (albumSongs.length === 0) return null;
        return (
          <section key={album.id} className="mb-8">
            {/* Album header */}
            <div className="flex items-center gap-3 mb-4">
              {/* Icon or image */}
              {album.imageUrl ? (
                <img
                  src={album.imageUrl}
                  alt={album.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <span className="text-2xl leading-none flex-shrink-0">
                  {album.icon || "🎵"}
                </span>
              )}
              <h2 className="text-base font-semibold text-foreground">
                {album.name}
              </h2>
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
          </section>
        );
      })}

      {visibleAlbums.length === 0 && (
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

      {activeSong && (
        <VideoPlayer song={activeSong} onClose={() => setActiveSong(null)} />
      )}
    </div>
  );
}
