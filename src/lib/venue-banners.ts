/**
 * Theme banner images per venue slug (minimally blurred in UI).
 * Shared by /launch and /internal/demo.
 */
const VENUE_BANNER_IMAGES: Record<string, string> = {
  "the-function-sf": "/venues/3.png",
  "the-starry-plough":
    "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80",
  "la-rueda":
    "https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800&q=80",
  "strike-zone":
    "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800&q=80",
  "pacific-greens":
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
  "the-velvet-room":
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
  "the-hideout":
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
  "bar-none":
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
};

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80";

export type VenueBannerItem = { name: string; slug: string; bannerImage: string; description?: string };

export function getVenueBannerImage(slug: string): string {
  return VENUE_BANNER_IMAGES[slug] ?? DEFAULT_BANNER;
}

export function getVenuesWithBanners(
  venues: { name: string; slug: string; description?: string }[]
): VenueBannerItem[] {
  return venues.map((v) => ({
    name: v.name,
    slug: v.slug,
    bannerImage: getVenueBannerImage(v.slug),
    ...(v.description != null && { description: v.description }),
  }));
}
