// favorites.ts - Local & Cross-Tab Synced Favorites Storage for RENTORA

const FAVORITES_STORAGE_KEY = 'rentora_favorite_resource_ids';

export const getFavoriteResourceIds = (): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isFavoriteResource = (resourceId: string): boolean => {
  if (!resourceId) return false;
  const list = getFavoriteResourceIds();
  return list.includes(resourceId);
};

export const toggleFavoriteResource = (resourceId: string): boolean => {
  if (!resourceId) return false;
  try {
    const list = getFavoriteResourceIds();
    let updated: string[];
    let isNowFavorite: boolean;

    if (list.includes(resourceId)) {
      updated = list.filter((id) => id !== resourceId);
      isNowFavorite = false;
    } else {
      updated = [resourceId, ...list];
      isNowFavorite = true;
    }

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rentora_favorites_changed', { detail: { resourceId, isNowFavorite } }));
    return isNowFavorite;
  } catch {
    return false;
  }
};
