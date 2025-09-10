// context/FavoritesContext.tsx
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type FavoritesContextT = {
  favoriteIds: string[];
  toggleFavorite: (id?: string) => void;
  isFavorite: (id?: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextT | undefined>(
  undefined
);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    console.log("FavoritesProvider mounted, favorites:", favoriteIds);
  }, [favoriteIds]);

  const toggleFavorite = (id?: string) => {
    if (!id) return;
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
    );
  };

  const isFavorite = (id?: string) => {
    if (!id) return false;
    return favoriteIds.includes(id);
  };

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, toggleFavorite, isFavorite }}>
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
