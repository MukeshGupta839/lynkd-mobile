// constants/Productview.ts
export type ProductVariant = {
  color: string;
  swatch: { uri: string };
  images: { uri: string }[]; // color-specific gallery
};

export type StorageOption = {
  size: string;
  price: number; // base price fallback
};

export type StoreInfo = {
  id: number;
  slug: string;
  name: string;
  logo?: string;
};

export type Product = {
  id: string;
  name: string;
  mainImage: { uri: string };
  mrp: number; // default MRP fallback
  rating: number;
  reviews: number;
  variants: ProductVariant[];
  thumbnails: { uri: string }[]; // global fallback thumbnails
  storages: StorageOption[];

  // per color x storage overrides
  priceMatrix?: Record<string, Record<string, number>>;
  mrpMatrix?: Record<string, Record<string, number>>;
  stockMatrix?: Record<string, Record<string, number>>;
  store: StoreInfo; // ✅ added store info
};

/* =========================================================
   PHONE (Original) — UNCHANGED
   ========================================================= */
export const product: Product = {
  name: "Apple iPhone 16",

  // A neutral iPhone hero (fallback if needed)
  mainImage: {
    uri: "https://images.unsplash.com/photo-1592286927505-1ff38e6e1f23?auto=format&w=1600&q=80",
  },

  // default MRP (used if mrpMatrix not provided for a cell)
  mrp: 159999,
  rating: 4.5,
  reviews: 2495,

  // --- Color variants (ALL URLs preserved) ---
  variants: [
    {
      color: "Ultramarine",
      swatch: {
        uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSq6CHBr4L-6jhp26luCdk6IE6RVgvsfcV0mMtfNnyXLsAdDBkZThzlQcDjOMmNucrLuPiVxTc-u0zbRKqGid1bQflnkySTIyKmcyBnaUDAkIGgjcCcB1DF",
      },
      images: [
        {
          uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSq6CHBr4L-6jhp26luCdk6IE6RVgvsfcV0mMtfNnyXLsAdDBkZThzlQcDjOMmNucrLuPiVxTc-u0zbRKqGid1bQflnkySTIyKmcyBnaUDAkIGgjcCcB1DF",
        },
        {
          uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcS0gNruXLo1m55mte39yteDcB4_TaMA6HHR4tkz8N_CXeT_qN-8pWgnoSpUsWkGEjJkRqeUBkaInR6PLUMX1oaBMu-LiBI8Rv3dQlpGKcSRoCnPGWNfxQHabw",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTF7bjS4_jl7SxLITOJLxueHAJ8NGZLcZwtuTutuxSfSQKUkejjPc3MgkVkePhM0FNIjKY_FKrZLHQYlv0Ljgi4MnNMuccxKfdCKtFH13aTe9S4TGIgJHql-w",
        },
        {
          uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTalMie7afoiQcZCuWyRbaXq-ZJQYiBSlLKXLb2refUctbnzUwdelrPskI4vtnNnWZgnO8RCa3R15H-vr0HdLORvXNyAXz29ylstWz-4l0m54UxN9RQW7pmTQ",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTySgqsREulNOrfybcN7bbtE4s1_QmGtO1axhGi2Q5UajGH2sQADhc0Ku7rpHzm34cIVJkSKu12gfaYFz9Dvu7oidVlTRVIt9JQrO7faE2YVFId8JI_h2AR_A",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRdi-hhPWnW32NmbMdikKmqAoeGkm__u_3XaEiCAv-xslHVd41BjzDXj9ip4_PeppyznpVk1k8ZUyYYGVfFRvq-cYHhIT-S19b2qzopzT5jPIZLhHgKG1p4NQ",
        },
        {
          uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSr607feiPh-RdbQ_EJQy9pq0cN0qLCf5RGBbf7thO5HDqkLp1liCFx32faxivRnLc02osjK_oBqqtPHK5HMZsDxfgZeTDg",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_Ultramarine_PDP_Image_Position_5__en-IN_d31cbbb7-ba49-4b60-8f44-a34b24c58349.jpg?v=1727248694&width=823",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_Ultramarine_PDP_Image_Position_9__en-IN_f3b3ea56-dc6f-45c1-a215-1b3c23610487.jpg?v=1727248712&width=823",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_Ultramarine_PDP_Image_Position_7__en-IN_cfa21d58-91be-4a7d-bd08-8c28ad64a6a6.jpg?v=1727248702&width=823",
        },
      ],
    },
    {
      color: "Green",
      swatch: {
        uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTAbbh6hnu3TEiyorXRmOLYvDJ9mlr_mzBj39jb8Q6MoMH-vTog6MsbZILr6fbWbchwzpvWaA_zZvzmRUuiFxq9jtiPFhk8p3cb9_FyBDKdt2qcZRaxp0mcYXIw",
      },
      images: [
        {
          uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTAbbh6hnu3TEiyorXRmOLYvDJ9mlr_mzBj39jb8Q6MoMH-vTog6MsbZILr6fbWbchwzpvWaA_zZvzmRUuiFxq9jtiPFhk8p3cb9_FyBDKdt2qcZRaxp0mcYXIw",
        },
        {
          uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQ1fTmsXnAfeQxJR9_HUkkSolLCI7b8NHSD-NTsg1-qhBB3oJ5K-N5vcsMZVQ3T-qxRAsrj5nWyYTOMUqFwOMoUeZKgJdxbduGtBZ9-nDoA8q8vs9uhV8LivxpA",
        },
        {
          uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSvPuEaiVu66oGASENIZm5btzoMciXf09fQPEMrtwOrmgLTGKNnsW43HeBFXm2K8_dfEtxYcgUa9s9rqEWoNvTrCvYFhnUZ4GgmBFcGpcjL_MHxQ0fxl4sNXD4",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTZNygTOQznav8QXepoKgVpZl_1vx8tpvFBwOHtJMMMNwd_gDTgG3p6G74zAonuez17Zg_AA68f95ZWeqn90nbdc8e9vGgIvp2KyDqd7BO-Q1cJkZAauFNj7w",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSCeXIF9BsgHztOJ0yke2klYlxlIx4bd0kYMz4JPnd0iWOfHDBG5rTW2wGIVIk81uVyVDpdwZ8bm5brwIDB7ItdZNTj9zcWZNWk5zZkJKPWH-nTkn_63XRj",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSaOH3bI_Z1SiMTSheADlphHtY3XMMkoUE4gto3gxSZCNeUUNYzb22zG3b4p6Fzm3nf44EhpshnKpm_ckB6Ra8yZk1AcjAl3EOGvlwjXwYbEOwy9W4YIxVt4Q",
        },
        {
          uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTBcFz_ALYPwewkGlZ3jqAHa44mTjlkUkrAzwqnQtFYvfnkXknBgX3BqfCH9XU6eTsoTypCJ-Tml0wFcipsQ299FzFX1jjL",
        },
      ],
    },
    {
      color: "White",
      swatch: {
        uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_1__en-IN_7bd324a8-0979-488b-bbb5-4ade23c6db29.jpg?v=1727248729&width=823",
      },
      images: [
        {
          uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_1__en-IN_7bd324a8-0979-488b-bbb5-4ade23c6db29.jpg?v=1727248729&width=823",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_2__en-IN_75cf7d00-d748-4d67-aabb-0ea1192a82c6.jpg?v=1727248737&width=823",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_3__en-IN_977b90e4-4ac9-4be4-996f-d54408a1c816.jpg?v=1727248741&width=823",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_4__en-IN_3c3c5b4b-82ea-4bc2-92e9-1ffcecea7da1.jpg?v=1727248745&width=823",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_White_PDP_Image_Position_5__en-IN_6aa0870d-ecd3-4a3c-8ee5-257fe94a8dc4.jpg?v=1727248750&width=823",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/IMG-18071552_m_jpeg_1_c44b6fdf-8b53-4877-9c62-774f0d36a4e3.jpg?v=1757450020&width=823",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/IMG-18071553_m_jpeg_1_63b2d6a7-f66a-4e84-ab65-139827168d6d.jpg?v=1757450020&width=823",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/IMG-18071556_m_jpeg_1_9da65a22-59f3-42a6-867f-1249e3c871ed.jpg?v=1757450020&width=823",
        },
      ],
    },
    {
      color: "Red",
      swatch: {
        uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQTBjyQDHscYjoKbqwPocwJwOGOsFwsqEuCt0eLGU07P1qv1Un52B0b-MwwjVW8ZtxTfN1sf-R9-2Rr1q3JFmNp1RwEz97zIAU7NZpmN0QfTWsJuGCfLD99",
      },
      images: [
        {
          uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQTBjyQDHscYjoKbqwPocwJwOGOsFwsqEuCt0eLGU07P1qv1Un52B0b-MwwjVW8ZtxTfN1sf-R9-2Rr1q3JFmNp1RwEz97zIAU7NZpmN0QfTWsJuGCfLD99",
        },
        {
          uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRMnYsmnhHx0mTbtKh3JkiCOLbc0zaXOD4VGaDCSDTZJn3FNtdgupZZSH0Y1Ipfo6xjLJoq81Zk8efOdGnin0bfM7acNjkA8zLumBSMDvvZM_Li2M5n3eRy2Ds",
        },
        {
          uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRC4mK80Vhi69pa4nl1k-BDWV5inB5xkjM9UQln-fjgd1BA6q6649RNOROvh8WDWYDdVi3llijaRPe5tAKEt_OEyrODnAf88afrzUUrwspgEHbraFUlaQXeOQ",
        },
        {
          uri: "https://inspireonline.in/cdn/shop/files/iPhone_16_Plus_Teal_PDP_Image_Position_6__en-IN_9cead0e5-95a0-4ca1-864a-c28741739d3b.jpg?v=1727248649&width=823",
        },
      ],
    },
    {
      color: "Black",
      swatch: {
        uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ7lj-fzbvJiHrJEUN_PGbfbBGzy-zkM6zzYdvSzWuRU06l7Yytp8d95UizLGo1Cr8IB7Mx9UUavyFpP_V292-0D0VChA9LeO-0n8nEMQ0kCGo0zgLmd8nxhw",
      },
      images: [
        {
          uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ7lj-fzbvJiHrJEUN_PGbfbBGzy-zkM6zzYdvSzWuRU06l7Yytp8d95UizLGo1Cr8IB7Mx9UUavyFpP_V292-0D0VChA9LeO-0n8nEMQ0kCGo0zgLmd8nxhw",
        },
        {
          uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSvnBo-APYnzGggRUSphmKNd42XmJ523ZoBN9J7YAT8xEOiCtj-g3UsaEyRaCeZbV-nLe7FT4InojwPU1RmFwtlcesPTUsm8wBSTrRw15PTRJFOUaZyv7SZLzU",
        },
        {
          uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ1TZ4pLnhdGL-AftncTCHlXGZr_I_uZ6-xsEEbu6daAk7Nm0Coz8GbV-gfPJX24aCyjVXWYMUSiDGb_QHTmsEb1qPEp0lbFPJPsAiHRSbROqrVlHtUQmBf",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTEUs8dgC5IFtDdyFEW2BBl56Xbba4MUULUKm6zniR-Qt-kNy9i3-QGwYgpzRMxedSwqICPo4S4aurMW7QuADQBYBTqrHumuhIqw2dzRj6i30lKOZeedvln",
        },
        {
          uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSGpGfLEsNjUNQwTkGMiX7KjQcIoQTCPUdscqPQuGBJyRL9UgDLLpt3MAeEeodollvUnvxKSiUGtcnhaScSDGO9Qj3mlXoq3DmBc8zVVtwe7_zmmQvTD8ir",
        },
      ],
    },
  ],

  // Global fallback thumbnails (used only if a variant has no images)
  thumbnails: [
    {
      uri: "https://images.unsplash.com/photo-1603898037225-328b4e3e1f4f?auto=format&w=1600&q=80",
    },
    {
      uri: "https://images.unsplash.com/photo-1624704606723-0bb14690f90b?auto=format&w=1600&q=80",
    },
    {
      uri: "https://images.unsplash.com/photo-1612197526225-5e88a298b59b?auto=format&w=1600&q=80",
    },
    {
      uri: "https://images.unsplash.com/photo-1606813903025-b45724e7df64?auto=format&w=1600&q=80",
    },
  ],

  storages: [
    { size: "128GB", price: 79999 },
    { size: "256GB", price: 99999 },
    { size: "512GB", price: 119999 },
    { size: "1TB", price: 139999 },
  ],

  /* ---- Pricing, MRP, and Stock matrices (example values) ---- */
  priceMatrix: {
    Ultramarine: {
      "128GB": 80999,
      "256GB": 99999,
      "512GB": 121999,
      "1TB": 141999,
    },
    Green: { "128GB": 79999, "256GB": 97999, "512GB": 119999, "1TB": 139999 },
    White: { "128GB": 78999, "256GB": 97999, "512GB": 117999, "1TB": 139499 },
    Red: { "128GB": 81999, "256GB": 100999, "512GB": 122999, "1TB": 144999 },
    Black: { "128GB": 79999, "256GB": 98999, "512GB": 118999, "1TB": 138999 },
  },

  mrpMatrix: {
    Ultramarine: {
      "128GB": 109999,
      "256GB": 129999,
      "512GB": 149999,
      "1TB": 169999,
    },
    Green: { "128GB": 104999, "256GB": 124999, "512GB": 144999, "1TB": 164999 },
    White: { "128GB": 104999, "256GB": 124999, "512GB": 144999, "1TB": 164999 },
    Red: { "128GB": 109999, "256GB": 129999, "512GB": 149999, "1TB": 169999 },
    Black: { "128GB": 104999, "256GB": 124999, "512GB": 144999, "1TB": 164999 },
  },

  // 0 = OOS, 1..9 => "Only N left", >=10 => "In Stock"
  stockMatrix: {
    Ultramarine: { "128GB": 12, "256GB": 6, "512GB": 0, "1TB": 3 },
    Green: { "128GB": 10, "256GB": 2, "512GB": 0, "1TB": 0 },
    White: { "128GB": 25, "256GB": 14, "512GB": 8, "1TB": 1 },
    Red: { "128GB": 0, "256GB": 0, "512GB": 0, "1TB": 0 }, // whole color OOS
    Black: { "128GB": 30, "256GB": 18, "512GB": 9, "1TB": 11 },
  },
  id: "iphone16",
  store: {
    id: 1,
    slug: "apple",
    name: "Apple Store",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  },
};

/* =========================================================
   FACE WASH — Simple (single color & single size so UI works)
   ========================================================= */
export const productFacewash: Product = {
  name: "Mamaearth Vitamin C Face Wash ",
  mainImage: {
    uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRZlIBslEB3Ok6AyzLX6b8JLlxtWK5zFyP7sOYlt71QYXCFvTu__cnJ8JXjcGhTpjUBdHly3U6DK-2aUTXStBAy8fnrJzk91wF8yNdk4h5ttJKwz_7uwRNmwA",
  },
  mrp: 399,
  rating: 4.4,
  reviews: 12000,

  // keep minimal variant so carousel & color section don't break
  variants: [],

  thumbnails: [
    {
      uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ8ZwyGMlZL78AiGufuI-eWt7mQ8Ar7-kW6vp3N6Qd1c3ITaIE5TCGhgpgF03fRxErtIufe30YQ9o3ycqWNN5ekzpdHKeg6Sloz3cer0nmOW5AcqvaLa8jWaaM",
    },
    {
      uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQy4tp-XMwJB7WNqZ6AqwKiIJcFNE1r2GaTgmcZHWdqa5IAu_9b8r0veBIxMDfBB4QelqZ8mG1CUPpaToBElnMHKrlO45ZcFVmWC7a3p9CxpW7ldcpniU-WYQ",
    },
  ],

  // one size so price renders through existing logic
  storages: [],

  priceMatrix: {
    Default: { "150ml": 299 },
  },
  mrpMatrix: {
    Default: { "150ml": 399 },
  },
  stockMatrix: {
    Default: { "150ml": 25 },
  },
  id: "facewash1",
  store: {
    id: 2,
    slug: "face-wash",
    name: "Mamaearth Store",
    logo: "https://seeklogo.com/images/M/mamaearth-logo-9D8B2D1A54-seeklogo.com.png",
  },
};

/* =========================================================
   CLOTHES — Colors + Sizes (S, M, L, XL, XXL)
   ========================================================= */
export const productClothing: Product = {
  name: "Men's Cotton Casual Shirt",
  mainImage: {
    uri: "https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/15557590/2022/2/18/a88d594a-0184-4042-baad-01c2d7874cec1645166286136-Roadster-Men-Shirts-4091645166285596-1.jpg",
  },
  mrp: 1299,
  rating: 4.3,
  reviews: 9850,

  variants: [
    {
      color: "White",
      swatch: {
        uri: "https://t4.ftcdn.net/jpg/08/34/74/29/240_F_834742965_skPxOdONnCPccl7wB96aBbYh5lSEdbpD.jpg",
      },
      images: [
        {
          uri: "https://t4.ftcdn.net/jpg/07/13/00/17/240_F_713001734_TO5HBxyFXdAnKGHEM80krE3fXSXoVvG3.jpg",
        },
        {
          uri: "https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/17050764/2022/5/25/cc0100cd-073a-4af0-96ee-d6e7221d9de21653455576578-Roadster-Men-Shirts-6791653455575877-1.jpg",
        },
        {
          uri: "https://t4.ftcdn.net/jpg/08/34/74/29/240_F_834742965_skPxOdONnCPccl7wB96aBbYh5lSEdbpD.jpg",
        },
        {
          uri: "https://t4.ftcdn.net/jpg/01/89/43/25/240_F_189432591_DLn2r3JyF3srldxjRrXU9m7AlFTImWQp.jpg",
        },
        {
          uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSkJVjB-d5RAVHrWWkdt4AUDlYIQFWpto2S5XsgtbLbG7uUJBY3SHxyvP_pMEclhvGoyIlmY0Nj8tkD-EkHJ-7VPwPJVYur-FXakbwRPKfwXtQd4U0ReVId",
        },
        {
          uri: "https://png.pngtree.com/recommend-works/png-clipart/20240509/ourmid/pngtree-white-shirt-png-image_12432349.png",
        },
      ],
    },
    {
      color: "Green",
      swatch: {
        uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRHP7JabZkHsf9FWYJVc-gCCbLJpvShYsIxUg3AIUBX8fj2wFEq0vQeD3QWj3nXI3nqlbPOhXI_PEMufSyoqrcawc-rajSQgdVaOYP-nFFRIr9-zlg1foC3",
      },
      images: [
        {
          uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRHP7JabZkHsf9FWYJVc-gCCbLJpvShYsIxUg3AIUBX8fj2wFEq0vQeD3QWj3nXI3nqlbPOhXI_PEMufSyoqrcawc-rajSQgdVaOYP-nFFRIr9-zlg1foC3",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQsc5MW1bsMxd1yTw0OXd4YRyMgrDlkhji0tJpRXS800ejRY9W7KbY8sVSAlB6Weaz3S69frONzodpTJEN0sgqziNKhIq3dxQTXdQTqhjDsVRv_oAMCMTAo",
        },
        {
          uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcRjy9zg8wgFGdkUTlRLRguHPqFvoQWjWkFNoKNjEjZ8Ma_YT26gLwracan7Pn_KFK0BUW_n0oY_Fcf-ZKy3JzBX3tXZMVbOz4DX8xra4qGgtx0UUftxPFf-",
        },
        {
          uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTqR-lZeJJckGA8tVfh9MvIT-k4viIQbcEsCiP3SXTd0pY-Y5U9QAxC9FjyWFjxgPDsFCBVmK0gB6o7TwVjHG7VFXKHjoq0Vbe9eb3txgs",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQTLkIOUwZMTUzX6K8dBZ4WkU8_zANTYys4ZVRSGjGc4hvc4NdlWkrGaJp4ODH1CG5M0Xa05Lxg7MYGVemZ90-Jg60BETUTmKiU6ATU38c",
        },
        {
          uri: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRUCtMuO-S4hfoHFK4Y3KpUvjEr68E0jUhvUC-ZA8XjV1y_3Hpyi0tuD8rgyv_YZJwgS7Z0Sl7pC3FbKLNlv2vI2VHpKuiNTc70MKpT0h3y2JtN9Wy1QDiKfA",
        },
      ],
    },
  ],

  thumbnails: [
    { uri: "https://m.media-amazon.com/images/I/71hKcKo5b1L._SX679_.jpg" },
    { uri: "https://m.media-amazon.com/images/I/61VtYqCw1LL._SX679_.jpg" },
  ],

  storages: [
    { size: "Small", price: 899 },
    { size: "Medium", price: 999 },
    { size: "Large", price: 1099 },
    { size: "XL", price: 1199 },
    { size: "XXL", price: 1299 },
  ],

  priceMatrix: {
    White: { S: 899, M: 999, L: 1099, XL: 1199, XXL: 1299 },
    "Navy Blue": { S: 899, M: 899, L: 899, XL: 899, XXL: 899 },
  },
  mrpMatrix: {
    White: { S: 1299, M: 1299, L: 1299, XL: 1299, XXL: 1299 },
    "Navy Blue": { S: 1299, M: 1299, L: 1299, XL: 1299, XXL: 1299 },
  },
  stockMatrix: {
    White: { S: 12, M: 9, L: 5, XL: 3, XXL: 7 },
    "Navy Blue": { S: 0, M: 5, L: 10, XL: 2, XXL: 4 },
  },
  id: "shirt1",
  store: {
    id: 3,
    slug: "clothing",
    name: "Roadster Store",
    logo: "https://cdn.iconscout.com/icon/free/png-256/free-roadster-286393.png",
  },
};

/* Optional helper to pick quickly in UI/dev */
export const productByKind = {
  phone: product,
  facewash: productFacewash,
  clothing: productClothing,
};
