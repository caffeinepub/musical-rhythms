export interface Song {
  id: string;
  title: string;
  youtubeUrl: string;
  thumbnail: string;
  albumId: string;
  type: "Video" | "Audio";
  addedAt?: number; // Unix ms timestamp when song was added
  // Legacy field for backward compat
  category?: "Singing Covers" | "Instrumentals" | "Bhajans";
}

export interface Album {
  id: string;
  name: string;
  imageUrl: string; // URL or base64 data URL from device upload
  icon?: string; // emoji icon
}

export interface SocialProfile {
  id: string;
  name: string;
  icon: string; // emoji
  url: string;
}

export type Page = "/" | "/songs" | "/live" | "/admin";
