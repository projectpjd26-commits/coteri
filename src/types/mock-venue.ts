/**
 * Shared type for mock venue cards used in marketing (splash banner, launcher preview).
 * Keep in sync with MOCK_VENUES in BannerColumnsPreview and MOCK_VENUE_SLUGS in constants.
 */

export interface MockVenueCard {
  name: string
  slug: string
  image: string
  gradient: string
}
