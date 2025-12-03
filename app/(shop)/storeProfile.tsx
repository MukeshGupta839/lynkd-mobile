// app/store-profile/index.tsx

import { useLocalSearchParams } from "expo-router";
import StoreProfileScreen from "../../components/StoreProfileScreen";

// ---------- Types (you can move these to a /types file later) ----------
type StoreDetails = {
  id: number;
  slug?: string;
  name: string;
  handle: string; // e.g. @apple
  verified?: boolean;
  bio?: string;
  logo?: string; // avatar
  banner?: string; // cover
  postsCount: number;
  reelsCount: number;
  followersCount: number;
  followingCount: number;
  is_owner: boolean; // if current user owns the store
};

type MediaPost = {
  id: number | string;
  media_url?: string;
  text_post?: boolean;
  caption?: string;
  created_at: string;
};

type Reel = {
  id: number | string;
  thumbnail_url: string;
  reels_views_aggregate?: { aggregate?: { count?: number } };
};

type Product = {
  id: number | string;
  name: string;
  main_image?: string;
  sale_price?: number;
};
// ----------------------------------------------------------------------

const StoreProfileIndex = () => {
  const params = useLocalSearchParams();

  // Accept either ?store=<id> or ?slug=<string>
  const viewingStoreId: number | undefined = params.store
    ? Number(Array.isArray(params.store) ? params.store[0] : params.store)
    : undefined;

  const viewingSlug: string | undefined = params.slug
    ? Array.isArray(params.slug)
      ? params.slug[0]
      : (params.slug as string)
    : undefined;

  // ---- Mock DB (swap with your API) -----------------------------------
  const MOCK_STORES: Record<number, StoreDetails> = {
    1: {
      id: 1,
      slug: "apple",
      name: "Apple Store",
      handle: "@apple",
      verified: true,
      bio: "Official Apple reseller. Explore iPhone, Mac, iPad and more.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      banner:
        "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg",
      postsCount: 17,
      reelsCount: 5,
      followersCount: 1300,
      followingCount: 890,
      is_owner: false, // set true to show Edit/Invite
    },
    2: {
      id: 2,
      slug: "samsung",
      name: "Samsung Store",
      handle: "@samsung",
      verified: true,
      bio: "Discover Galaxy, TVs and smart appliances.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
      banner:
        "https://img.freepik.com/free-vector/gradient-blue-background_23-2149379618.jpg",
      postsCount: 9,
      reelsCount: 3,
      followersCount: 800,
      followingCount: 200,
      is_owner: false,
    },
  };

  const MOCK_STORES_BY_SLUG: Record<string, StoreDetails> = Object.values(
    MOCK_STORES
  ).reduce(
    (acc, s) => {
      if (s.slug) acc[s.slug.toLowerCase()] = s;
      return acc;
    },
    {} as Record<string, StoreDetails>
  );

  // ---- Fetchers (replace with real API) --------------------------------
  const fetchStoreDetails = async (
    storeId?: number,
    slug?: string
  ): Promise<StoreDetails> => {
    // If slug is provided, prefer slug lookup
    if (slug) {
      const bySlug = MOCK_STORES_BY_SLUG[slug.toLowerCase()];
      if (bySlug) return bySlug;
    }

    // Else use id
    if (storeId && MOCK_STORES[storeId]) return MOCK_STORES[storeId];

    // Fallback default
    return {
      id: storeId ?? -1,
      slug: slug || (storeId ? `store_${storeId}` : "unknown"),
      name: slug ? `${slug} Store` : "Unknown Store",
      handle: `@${slug || (storeId ? `store_${storeId}` : "unknown")}`,
      verified: false,
      bio: "This store hasn't added a description yet.",
      logo: "https://dummyimage.com/200x200/eeeeee/000000.png&text=Logo",
      banner:
        "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg",
      postsCount: 0,
      reelsCount: 0,
      followersCount: 0,
      followingCount: 0,
      is_owner: false,
    };
  };

  const fetchStorePosts = async (_storeId: number): Promise<MediaPost[]> => [
    {
      id: 1,
      media_url: "https://picsum.photos/400/400?random=1",
      text_post: false,
      created_at: "2024-03-28",
    },
    {
      id: 2,
      media_url: "https://picsum.photos/400/400?random=2",
      text_post: false,
      created_at: "2024-03-25",
    },
    {
      id: 3,
      media_url: "https://picsum.photos/400/400?random=3",
      text_post: false,
      created_at: "2024-02-28",
    },
    {
      id: 4,
      text_post: true,
      caption: "Grand opening offers this week!",
      created_at: "2024-02-15",
    },
  ];

  const fetchStoreReels = async (_storeId: number): Promise<Reel[]> => [
    {
      id: 1,
      thumbnail_url: "https://picsum.photos/400/600?random=4",
      reels_views_aggregate: { aggregate: { count: 1250 } },
    },
    {
      id: 2,
      thumbnail_url: "https://picsum.photos/400/600?random=5",
      reels_views_aggregate: { aggregate: { count: 3400 } },
    },
  ];

  const fetchStoreProducts = async (_storeId: number): Promise<Product[]> => [
    {
      id: 1,
      name: "iPhone 15 Pro",
      main_image: "https://picsum.photos/300/300?random=6",
      sale_price: 129900,
    },
    {
      id: 2,
      name: "MacBook Air M3",
      main_image: "https://picsum.photos/300/300?random=7",
      sale_price: 149900,
    },
  ];

  // ---- Follow handlers (swap with API) ---------------------------------
  const handleFollow = async (storeId: number) => {
    // await api.post(`/stores/${storeId}/follow`)
    console.log("Follow store", storeId);
  };

  const handleUnfollow = async (storeId: number) => {
    // await api.post(`/stores/${storeId}/unfollow`)
    console.log("Unfollow store", storeId);
  };

  // Determine which identifier we have so StoreProfileScreen can load correctly
  const resolvedId =
    viewingStoreId ??
    (viewingSlug && MOCK_STORES_BY_SLUG[viewingSlug.toLowerCase()]
      ? MOCK_STORES_BY_SLUG[viewingSlug.toLowerCase()].id
      : undefined);

  return (
    <StoreProfileScreen
      storeId={resolvedId}
      slug={viewingSlug}
      fetchStoreDetails={fetchStoreDetails}
      fetchStorePosts={fetchStorePosts}
      fetchStoreReels={fetchStoreReels}
      fetchStoreProducts={fetchStoreProducts}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
    />
  );
};

export default StoreProfileIndex;
