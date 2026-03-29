// @ts-nocheck
export const idlFactory = ({ IDL }) => {
  const Song = IDL.Record({
    id: IDL.Text,
    title: IDL.Text,
    youtubeUrl: IDL.Text,
    thumbnail: IDL.Text,
    albumId: IDL.Text,
    songType: IDL.Text,
    addedAt: IDL.Int,
  });
  const Album = IDL.Record({
    id: IDL.Text,
    name: IDL.Text,
    imageUrl: IDL.Text,
    icon: IDL.Text,
  });
  const SocialProfile = IDL.Record({
    id: IDL.Text,
    name: IDL.Text,
    icon: IDL.Text,
    url: IDL.Text,
  });
  return IDL.Service({
    getSongs: IDL.Func([], [IDL.Vec(Song)], ['query']),
    addSong: IDL.Func([Song], [], []),
    deleteSong: IDL.Func([IDL.Text], [], []),
    getAlbums: IDL.Func([], [IDL.Vec(Album)], ['query']),
    addAlbum: IDL.Func([Album], [], []),
    deleteAlbum: IDL.Func([IDL.Text], [], []),
    getSocialProfiles: IDL.Func([], [IDL.Vec(SocialProfile)], ['query']),
    addSocialProfile: IDL.Func([SocialProfile], [], []),
    updateSocialProfile: IDL.Func([SocialProfile], [], []),
    deleteSocialProfile: IDL.Func([IDL.Text], [], []),
    getLiveUrl: IDL.Func([], [IDL.Text], ['query']),
    setLiveUrl: IDL.Func([IDL.Text], [], []),
    clearLiveUrl: IDL.Func([], [], []),
  });
};
export const init = ({ IDL }) => [];
export const idlInitArgs = [];
