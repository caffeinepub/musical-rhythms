import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
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

// ── Stats (followers & views) ─────────────────────────────────────────────────

const STATS_DOC = doc(db, "stats", "main");

async function ensureStatsDoc(): Promise<void> {
  const snap = await getDoc(STATS_DOC);
  if (!snap.exists()) {
    await setDoc(STATS_DOC, { followers: 0, views: 0 });
  }
}

export async function incrementFollowers(): Promise<void> {
  try {
    await ensureStatsDoc();
    await setDoc(STATS_DOC, { followers: increment(1) }, { merge: true });
  } catch (err) {
    console.error("incrementFollowers error:", err);
  }
}

export async function decrementFollowers(): Promise<void> {
  try {
    await ensureStatsDoc();
    await setDoc(STATS_DOC, { followers: increment(-1) }, { merge: true });
  } catch (err) {
    console.error("decrementFollowers error:", err);
  }
}

export async function incrementViews(): Promise<void> {
  try {
    await ensureStatsDoc();
    await setDoc(STATS_DOC, { views: increment(1) }, { merge: true });
  } catch (err) {
    console.error("incrementViews error:", err);
  }
}

export function subscribeToStats(
  callback: (stats: { followers: number; views: number }) => void,
): () => void {
  return onSnapshot(
    STATS_DOC,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          followers: (data.followers as number) || 0,
          views: (data.views as number) || 0,
        });
      } else {
        callback({ followers: 0, views: 0 });
      }
    },
    (err) => {
      console.error("Stats subscription error:", err);
    },
  );
}

// ── Subscribers (FCM tokens) ──────────────────────────────────────────────────

export async function addSubscriber(token: string): Promise<void> {
  try {
    await setDoc(doc(db, "subscribers", token), {
      token,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error("addSubscriber error:", err);
  }
}

export async function removeSubscriber(token: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "subscribers", token));
  } catch (err) {
    console.error("removeSubscriber error:", err);
  }
}

export async function getSubscribers(): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, "subscribers"));
    return snap.docs.map((d) => d.data().token as string).filter(Boolean);
  } catch (err) {
    console.error("getSubscribers error:", err);
    return [];
  }
}

// ── Live Comments ─────────────────────────────────────────────────────────────

export interface LiveComment {
  id: string;
  authorName: string;
  text: string;
  timestamp: number;
  isAdmin: boolean;
  isPinned: boolean;
}

export async function addLiveComment(
  comment: Omit<LiveComment, "id">,
): Promise<void> {
  await addDoc(collection(db, "liveComments"), comment);
}

export async function deleteLiveComment(id: string): Promise<void> {
  await deleteDoc(doc(db, "liveComments", id));
}

export async function pinLiveComment(
  id: string,
  pinned: boolean,
): Promise<void> {
  await updateDoc(doc(db, "liveComments", id), { isPinned: pinned });
}

export async function clearAllLiveComments(): Promise<void> {
  const snap = await getDocs(collection(db, "liveComments"));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export function subscribeLiveComments(
  callback: (comments: LiveComment[]) => void,
): () => void {
  const q = query(collection(db, "liveComments"), orderBy("timestamp", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const comments = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as LiveComment,
      );
      callback(comments);
    },
    (err) => {
      console.error("Live comments subscription error:", err);
    },
  );
}

// ── Live Hearts ───────────────────────────────────────────────────────────────

const HEARTS_DOC = doc(db, "config", "liveHearts");

export async function incrementLiveHearts(): Promise<void> {
  try {
    await setDoc(
      HEARTS_DOC,
      { count: increment(1), lastAt: Date.now() },
      { merge: true },
    );
  } catch (err) {
    console.error("incrementLiveHearts error:", err);
  }
}

export function subscribeLiveHearts(
  callback: (count: number, lastAt: number) => void,
): () => void {
  return onSnapshot(
    HEARTS_DOC,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback((data.count as number) || 0, (data.lastAt as number) || 0);
      } else {
        callback(0, 0);
      }
    },
    (err) => {
      console.error("Hearts subscription error:", err);
    },
  );
}

export async function resetLiveHearts(): Promise<void> {
  try {
    await setDoc(HEARTS_DOC, { count: 0, lastAt: 0 });
  } catch (err) {
    console.error("resetLiveHearts error:", err);
  }
}
