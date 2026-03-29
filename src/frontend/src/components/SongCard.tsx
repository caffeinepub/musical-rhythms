import { Play } from "lucide-react";
import type { Song } from "../types";

interface SongCardProps {
  song: Song;
  index: number;
  onPlay: (song: Song) => void;
}

export function SongCard({ song, index, onPlay }: SongCardProps) {
  return (
    <button
      type="button"
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-card-lg text-left w-full h-28 flex items-center justify-between px-5 gap-4"
      style={{
        background: "oklch(var(--card))",
        border: "1px solid oklch(var(--border))",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      }}
      onClick={() => onPlay(song)}
      aria-label={`Play ${song.title}`}
      data-ocid={`songs.item.${index}`}
    >
      {/* Bold song title — centered, fills the card */}
      <p className="flex-1 font-bold text-base text-foreground leading-snug line-clamp-3">
        {song.title}
      </p>

      {/* Play button */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
        style={{ background: "var(--accent-color)" }}
        data-ocid={`songs.play_button.${index}`}
      >
        <Play size={15} fill="white" className="text-white ml-0.5" />
      </div>
    </button>
  );
}
