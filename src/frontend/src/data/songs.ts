import type { Album, Song } from "../types";

export const DEFAULT_ALBUMS: Album[] = [];

export const DEFAULT_SONGS: Song[] = [];

export function migrateSong(song: Song): Song {
  return song;
}
