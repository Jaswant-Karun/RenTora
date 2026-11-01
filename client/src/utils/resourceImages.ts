// Curated, verified high-resolution fallback images for each institutional category
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Laboratories': 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80',
  'Classrooms': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
  'Meeting Rooms': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  'Computers': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  'Cameras': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  '3D Printers': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  'Electronics Equipment': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'Testing Instruments': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
  'Workshop Tools': 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80',
  'Other Resources': 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80',
};

export const DEFAULT_RESOURCE_IMAGE =
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

/**
 * Returns the best image for a resource:
 * 1. The first valid URL in resource.images
 * 2. Category-specific high-res photo
 * 3. Default high-res research equipment photo
 */
export function getResourceImage(
  images?: string[] | null,
  category?: string
): string {
  if (images && images.length > 0 && images[0] && images[0].trim().startsWith('http')) {
    return images[0].trim();
  }
  if (category && CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }
  return DEFAULT_RESOURCE_IMAGE;
}

/**
 * Fallback event handler for <img> elements.
 * Automatically recovers from 404s, CORS failures, or broken CDN images.
 */
export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
) {
  const target = event.currentTarget;
  const fallbackUrl = (category && CATEGORY_FALLBACK_IMAGES[category]) || DEFAULT_RESOURCE_IMAGE;
  
  // Prevent infinite loop if fallback itself fails
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}
