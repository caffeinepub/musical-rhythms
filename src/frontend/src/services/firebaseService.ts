import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Album, SocialProfile, Song } from "../types";

// Songs
export async function getSongs(): Promise<Song[]> {
  const snap = await getDocs(query(collection(db, "songs")));
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id }) as Song)
    .sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0));
}

export async function addSong(song: Song): Promise<void> {
  await setDoc(doc(db, "songs", song.id), song);
}

export async function deleteSong(id: string): Promise<void> {
  await deleteDoc(doc(db, "songs", id));
}

// Albums
export async function getAlbums(): Promise<Album[]> {
  const snap = await getDocs(collection(db, "albums"));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Album);
}

export async function addAlbum(album: Album): Promise<void> {
  await setDoc(doc(db, "albums", album.id), album);
}

export async function deleteAlbum(id: string): Promise<void> {
  await deleteDoc(doc(db, "albums", id));
}

// Social Profiles
export async function getSocialProfiles(): Promise<SocialProfile[]> {
  const snap = await getDocs(collection(db, "socialProfiles"));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as SocialProfile);
}

export async function addSocialProfile(profile: SocialProfile): Promise<void> {
  await setDoc(doc(db, "socialProfiles", profile.id), profile);
}

export async function deleteSocialProfile(id: string): Promise<void> {
  await deleteDoc(doc(db, "socialProfiles", id));
}

// Live URL
export async function getLiveUrl(): Promise<string> {
  const snap = await getDoc(doc(db, "config", "live"));
  if (!snap.exists()) return "";
  return (snap.data().url as string) || "";
}

export async function setLiveUrl(url: string): Promise<void> {
  await setDoc(doc(db, "config", "live"), { url });
}

export async function clearLiveUrl(): Promise<void> {
  await setDoc(doc(db, "config", "live"), { url: "" });
}

// Real-time listener for live URL
export function subscribeToLiveUrl(
  callback: (url: string) => void,
): () => void {
  return onSnapshot(doc(db, "config", "live"), (snap) => {
    const url = snap.exists() ? (snap.data().url as string) || "" : "";
    callback(url);
  });
}

// Real-time listener for all data
export function subscribeToAll(
  callback: (data: {
    songs: Song[];
    albums: Album[];
    socialProfiles: SocialProfile[];
  }) => void,
): () => void {
  let songs: Song[] = [];
  let albums: Album[] = [];
  let socialProfiles: SocialProfile[] = [];

  const unsubSongs = onSnapshot(
    collection(db, "songs"),
    (snap) => {
      songs = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as Song)
        .sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0));
      callback({ songs, albums, socialProfiles });
    },
    (err) => {
      console.error("Songs subscription error:", err);
    },
  );

  const unsubAlbums = onSnapshot(
    collection(db, "albums"),
    (snap) => {
      albums = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Album);
      callback({ songs, albums, socialProfiles });
    },
    (err) => {
      console.error("Albums subscription error:", err);
    },
  );

  const unsubProfiles = onSnapshot(
    collection(db, "socialProfiles"),
    (snap) => {
      socialProfiles = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as SocialProfile,
      );
      callback({ songs, albums, socialProfiles });
    },
    (err) => {
      console.error("Social profiles subscription error:", err);
    },
  );

  return () => {
    unsubSongs();
    unsubAlbums();
    unsubProfiles();
  };
}
