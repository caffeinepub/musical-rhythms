import type { Song, Album, SocialProfile } from "./declarations/backend.did";
export type { Song, Album, SocialProfile };
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface backendInterface {
    _initializeAccessControlWithSecret(secret: string): Promise<void>;
    getSongs(): Promise<Song[]>;
    addSong(song: Song): Promise<void>;
    deleteSong(id: string): Promise<void>;
    getAlbums(): Promise<Album[]>;
    addAlbum(album: Album): Promise<void>;
    deleteAlbum(id: string): Promise<void>;
    getSocialProfiles(): Promise<SocialProfile[]>;
    addSocialProfile(profile: SocialProfile): Promise<void>;
    updateSocialProfile(profile: SocialProfile): Promise<void>;
    deleteSocialProfile(id: string): Promise<void>;
    getLiveUrl(): Promise<string>;
    setLiveUrl(url: string): Promise<void>;
    clearLiveUrl(): Promise<void>;
}
