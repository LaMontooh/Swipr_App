import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

export async function photoDetails(asset) {
  let uri = asset.uri,
    size = null;
  try {
    const info = await MediaLibrary.getAssetInfoAsync(asset.id, {
      shouldDownloadFromNetwork: false,
    });
    uri = info.localUri || asset.uri;
    // Live Photos include a paired video: do not claim its full size from a still image.
    if (
      !info.isNetworkAsset &&
      !info.mediaSubtypes?.includes('livePhoto') &&
      uri.startsWith('file://')
    ) {
      const file = await FileSystem.getInfoAsync(uri);
      if (file.exists && typeof file.size === 'number') size = file.size;
    }
    return {
      ...asset,
      uri,
      size,
      cloud: !!info.isNetworkAsset,
      live: info.mediaSubtypes?.includes('livePhoto'),
    };
  } catch {
    return { ...asset, uri, size };
  }
}
export async function getPhotoPage(after) {
  return MediaLibrary.getAssetsAsync({
    first: 40,
    after: after || undefined,
    mediaType: MediaLibrary.MediaType.photo,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    resolveWithFullInfo: Platform.OS === 'android',
  });
}
// Browser preview is deliberately separate from device cleanup and its history.
export const demoPhotos = [
  ['Coastal afternoon', 'photo-1476514525535-07fb3b4ae5f1'],
  ['A little escape', 'photo-1464822759023-fed622ff2c3b'],
  ['Golden hour', 'photo-1500534623283-312aade485b7'],
  ['Weekend memories', 'photo-1441974231531-c6227db76b6e'],
  ['The scenic route', 'photo-1500530855697-b586d89ba3ee'],
].map(([filename, photo], i) => ({
  id: `demo-${i}`,
  filename,
  uri: `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1000&q=85`,
  creationTime: Date.now() - i * 86400000,
  size: null,
}));
