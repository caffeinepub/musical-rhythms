import Array "mo:base/Array";
import Text "mo:base/Text";

actor {
  // ── Types ──────────────────────────────────────────────────────────────
  public type Song = {
    id : Text;
    title : Text;
    youtubeUrl : Text;
    thumbnail : Text;
    albumId : Text;
    songType : Text; // "Video" | "Audio"
    addedAt : Int;
  };

  public type Album = {
    id : Text;
    name : Text;
    imageUrl : Text;
    icon : Text;
  };

  public type SocialProfile = {
    id : Text;
    name : Text;
    icon : Text;
    url : Text;
  };

  // ── Stable storage ─────────────────────────────────────────────────────
  stable var songs : [Song] = [];
  stable var albums : [Album] = [];
  stable var socialProfiles : [SocialProfile] = [];
  stable var liveStreamUrl : Text = "";

  // ── Songs ──────────────────────────────────────────────────────────────
  public query func getSongs() : async [Song] { songs };

  public func addSong(song : Song) : async () {
    songs := Array.append(songs, [song]);
  };

  public func deleteSong(id : Text) : async () {
    songs := Array.filter(songs, func(s : Song) : Bool { s.id != id });
  };

  // ── Albums ─────────────────────────────────────────────────────────────
  public query func getAlbums() : async [Album] { albums };

  public func addAlbum(album : Album) : async () {
    albums := Array.append(albums, [album]);
  };

  public func deleteAlbum(id : Text) : async () {
    albums := Array.filter(albums, func(a : Album) : Bool { a.id != id });
    // Also remove songs that belong to this album
    songs := Array.filter(songs, func(s : Song) : Bool { s.albumId != id });
  };

  // ── Social Profiles ────────────────────────────────────────────────────
  public query func getSocialProfiles() : async [SocialProfile] { socialProfiles };

  public func addSocialProfile(profile : SocialProfile) : async () {
    socialProfiles := Array.append(socialProfiles, [profile]);
  };

  public func updateSocialProfile(profile : SocialProfile) : async () {
    socialProfiles := Array.map(socialProfiles, func(p : SocialProfile) : SocialProfile {
      if (p.id == profile.id) profile else p
    });
  };

  public func deleteSocialProfile(id : Text) : async () {
    socialProfiles := Array.filter(socialProfiles, func(p : SocialProfile) : Bool { p.id != id });
  };

  // ── Live Stream ────────────────────────────────────────────────────────
  public query func getLiveUrl() : async Text { liveStreamUrl };

  public func setLiveUrl(url : Text) : async () {
    liveStreamUrl := url;
  };

  public func clearLiveUrl() : async () {
    liveStreamUrl := "";
  };
};
