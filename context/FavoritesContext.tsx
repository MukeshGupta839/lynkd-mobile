// context/FavoritesContext.tsx
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type FavoritesContextT = {
  favoriteIds: string[];
  setFavoriteIds: (ids: string[]) => void;
  toggleFavorite: (id?: string) => void;
  isFavorite: (id?: string) => boolean;
  addFavorite: (id?: string) => void;
  removeFavorite: (id?: string) => void;
};

const FavoritesContext = createContext<FavoritesContextT | undefined>(
  undefined
);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    console.log("FavoritesProvider mounted, favorites:", favoriteIds);
  }, [favoriteIds]);

  const addFavorite = useCallback((id?: string) => {
    if (!id) return;
    setFavoriteIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
  }, []);

  const removeFavorite = useCallback((id?: string) => {
    if (!id) return;
    setFavoriteIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggleFavorite = useCallback((id?: string) => {
    if (!id) return;
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
    );
  }, []);

  const isFavorite = useCallback(
    (id?: string) => {
      if (!id) return false;
      return favoriteIds.includes(id);
    },
    [favoriteIds]
  );

  const value: FavoritesContextT = {
    favoriteIds,
    setFavoriteIds,
    toggleFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
};
