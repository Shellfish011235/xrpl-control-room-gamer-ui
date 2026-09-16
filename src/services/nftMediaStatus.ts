export type NFTMediaStatus = 'loading' | 'loaded' | 'unavailable' | 'no-uri';

export function getNFTMediaStatus(input: {
  uri?: string;
  isLoading?: boolean;
  image?: string;
}): NFTMediaStatus {
  if (!input.uri) return 'no-uri';
  if (input.isLoading) return 'loading';
  if (input.image) return 'loaded';
  return 'unavailable';
}
