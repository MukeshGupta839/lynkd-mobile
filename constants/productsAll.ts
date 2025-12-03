// constants/productsAll.ts
/* Unified product + deals constants
   - Single canonical type: ProductUniversal
   - IDs are numeric (1..25)
   - Full product data kept for iPhone (1), Facewash (2), Clothing (3)
   - Additional products (4..25) provided for a 25-product catalog
*/

export type ProductUniversal = {
  id: number;
  name: string;
  category: string;
  shortDescription?: string;
  description?: string[] | string;
  price?: number | string;
  mrp?: number | string;
  discountPercent?: number;
  discount?: string;
  mainImage?: string | any;
  image?: any; // keep for local require usage in components
  images?: (string | any)[];
  thumbnails?: (string | any)[];
  rating?: number | string;
  reviewsCount?: number | string;
  brand?: string;
  brandLogo?: string;
  variants?: any[];
  sizes?: string[];
  storageOptions?: string[];
  storages?: { size: string; price: number }[];
  priceMatrix?: Record<string, Record<string, number>>;
  mrpMatrix?: Record<string, Record<string, number>>;
  stockMatrix?: Record<string, Record<string, number>>;
  store?: {
    id: number | string;
    name: string;
    slug?: string;
    logo?: string;
  };
  highlights?: string[];
  isTopDeal?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  // any other optional fields allowed
};

/* ============================
   1) Full detailed product objects
   (keep all URLs you provided)
   ============================ */

/* ---------------------------
   ID = 1 : APPLE IPHONE 16 (detailed - all variant image URLs preserved)
   --------------------------- */
export const product: ProductUniversal = {
  id: 1,
  name: "Apple iPhone 16",
  category: "Mobiles",
  mainImage:
    "https://images.unsplash.com/photo-1592286927505-1ff38e6e1f23?auto=format&w=1600&q=80",
  mrp: 159999,
  rating: 4.5,
  reviewsCount: 2495,
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
          uri: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTBcFz_ALYPwewkGlZ3jqAHa44mTjlkUkrAzwqnQtFYvfnkXknBgX3BqfCH9XU6eZTyopCJ-Tml0wFcipsQ299FzFX1jjL",
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
        uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQTBjyQDHscYjoKbqwPocwJwOGOsFwsqEuCt0eLGU07P1qv1Un52B0c-MwwjVW8ZtxTfN1sf-R9-2Rr1q3JFmNp1RwEz97zIAU7NZpmN0QfTWsJuGCfLD99",
      },
      images: [
        {
          uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQTBjyQDHscYjoKbqwPocwJwOGOsFwsqEuCt0eLGU07P1qv1Un52B0c-MwwjVW8ZtxTfN1sf-R9-2Rr1q3JFmNp1RwEz97zIAU7NZpmN0QfTWsJuGCfLD99",
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
  stockMatrix: {
    Ultramarine: { "128GB": 0, "256GB": 6, "512GB": 0, "1TB": 3 },
    Green: { "128GB": 10, "256GB": 2, "512GB": 0, "1TB": 0 },
    White: { "128GB": 25, "256GB": 14, "512GB": 8, "1TB": 1 },
    Red: { "128GB": 0, "256GB": 0, "512GB": 0, "1TB": 0 },
    Black: { "128GB": 30, "256GB": 18, "512GB": 9, "1TB": 11 },
  },
  store: {
    id: 1,
    slug: "apple",
    name: "Apple Store",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  },
};

/* ---------------------------
   ID = 2 : MAMAEARTH FACEWASH (detailed)
   --------------------------- */
export const productFacewash: ProductUniversal = {
  id: 2,
  name: "Mamaearth Vitamin C Face Wash",
  category: "Beauty",
  mainImage:
    "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRZlIBslEB3Ok6AyzLX6b8JLlxtWK5zFyP7sOYlt71QYXCFvTu__cnJ8JXjcGhTpjUBdHly3U6DK-2aUTXStBAy8fnrJzk91wF8yNdk4h5ttJKwz_7uwRNmwA",
  mrp: 399,
  rating: 4.4,
  reviewsCount: 12000,
  variants: [],
  thumbnails: [
    {
      uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ8ZwyGMlZL78AiGufuI-eWt7mQ8Ar7-kW6vp3N6Qd1c3ITaIE5TCGhgpgF03fRxErtIufe30YQ9o3ycqWNN5ekzpdHKeg6Sloz3cer0nmOW5AcqvaLa8jWaaM",
    },
    {
      uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQy4tp-XMwJB7WNqZ6AqwKiIJcFNE1r2GaTgmcZHWdqa5IAu_9b8r0veBIxMDfBB4QelqZ8mG1CUPpaToBElnMHKrlO45ZcFVmWC7a3p9CxpW7ldcpniU-WYQ",
    },
  ],
  storages: [],
  priceMatrix: { Default: { "150ml": 299 } },
  mrpMatrix: { Default: { "150ml": 399 } },
  stockMatrix: { Default: { "150ml": 25 } },
  store: {
    id: 2,
    slug: "face-wash",
    name: "Mamaearth Store",
    logo: "https://seeklogo.com/images/M/mamaearth-logo-9D8B2D1A54-seeklogo.com.png",
  },
};

/* ---------------------------
   ID = 3 : CLOTHING (Men's Cotton Casual Shirt - detailed)
   --------------------------- */
export const productClothing: ProductUniversal = {
  id: 3,
  name: "Men's Cotton Casual Shirt",
  category: "Fashion",
  mainImage:
    "https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/15557590/2022/2/18/a88d594a-0184-4042-baad-01c2d7874cec1645166286136-Roadster-Men-Shirts-4091645166285596-1.jpg",
  mrp: 1299,
  rating: 4.3,
  reviewsCount: 9850,
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
  store: {
    id: 3,
    slug: "clothing",
    name: "Roadster Store",
    logo: "https://cdn.iconscout.com/icon/free/png-256/free-roadster-286393.png",
  },
};

/* ============================
   2) Generic product list (additional products) — numeric ids
   (keeps local require(...) where you used them originally)
   ============================ */
export const products: ProductUniversal[] = [
  {
    id: 4,
    name: "Sony WH-CH720N — Wireless Active Noise Cancellation Headphones With Mic, Up to 50 Hrs Playtime (Black)",
    category: "Electronics",
    shortDescription: "Sony's lightest wireless noise-cancelling headband ever",
    description: [
      "Active Noise Cancellation",
      "Lightweight & comfy",
      "Up to 50 hours playtime",
    ],
    price: 79999,
    mrp: 89999,
    discountPercent: Math.round(((89999 - 79999) / 89999) * 100),
    image: require("../assets/images/Product/headphone.png"),
    mainImage: require("../assets/images/Product/headphone.png"),
    thumbnails: [require("../assets/images/Product/headphone.png")],
    rating: 4.8,
    reviewsCount: "1.2k",
    brand: "Sony",
    store: { id: 10, name: "Sony Official", slug: "sony", logo: undefined },
  },
  {
    id: 5,
    name: "Apple MacBook Air — M4 Chip",
    category: "Electronics",
    shortDescription: "Apple MacBook Air with the M4 chip",
    description: [
      "Apple M4",
      "13.6-inch Liquid Retina",
      "Up to 18 hours battery",
    ],
    price: 179999,
    mrp: 200000,
    discountPercent: Math.round(((200000 - 179999) / 200000) * 100),
    image: require("../assets/images/Product/Macbooks.png"),
    mainImage: require("../assets/images/Product/Macbooks.png"),
    thumbnails: [require("../assets/images/Product/Macbooks.png")],
    rating: 4.4,
    reviewsCount: "1.1k",
    brand: "Apple",
    store: { id: 11, name: "Apple Store", slug: "apple", logo: undefined },
  },
  {
    id: 6,
    name: "Samsung S25 Ultra",
    category: "Mobiles",
    shortDescription: "Samsung S25 ultra",
    description: ["Flagship Samsung phone", "High refresh AMOLED", "Multi-cam"],
    price: 99999,
    mrp: 120000,
    discountPercent: Math.round(((120000 - 99999) / 120000) * 100),
    image: require("../assets/images/Product/phone.png"),
    mainImage: require("../assets/images/Product/phone.png"),
    thumbnails: [require("../assets/images/Product/phone.png")],
    rating: 4.4,
    reviewsCount: "1.1k",
    brand: "Samsung",
    store: {
      id: 12,
      name: "Samsung Official",
      slug: "samsung",
      logo: undefined,
    },
  },
  {
    id: 7,
    name: "Nikon D3500",
    category: "Electronics",
    shortDescription: "Nikon D3500 Camera",
    description: ["24.2MP sensor", "Lightweight DSLR", "Interchangeable lens"],
    price: 19999,
    mrp: 22000,
    discountPercent: Math.round(((22000 - 19999) / 22000) * 100),
    image: require("../assets/images/Product/nikoncamera.png"),
    mainImage: require("../assets/images/Product/nikoncamera.png"),
    thumbnails: [require("../assets/images/Product/nikoncamera.png")],
    rating: 4.1,
    reviewsCount: "1.1k",
    brand: "Nikon",
    store: { id: 13, name: "Nikon Store", slug: "nikon", logo: undefined },
  },
  {
    id: 8,
    name: "NIKE Running Shoe For Men",
    category: "Fashion",
    shortDescription: "Comfortable running shoes with breathable upper",
    description: ["Breathable", "Lightweight foam midsole", "Rubber outsole"],
    price: 10999,
    mrp: 20000,
    discountPercent: 45,
    image: require("../assets/images/Product/shoe.png"),
    mainImage: require("../assets/images/Product/shoe.png"),
    thumbnails: [require("../assets/images/Product/shoe.png")],
    rating: 4.3,
    reviewsCount: 540,
    brand: "NIKE",
    store: { id: 14, name: "NIKE Official", slug: "nike", logo: undefined },
  },
  {
    id: 9,
    name: "Apple Ultra Watch",
    category: "Electronics",
    shortDescription: "Health-focused smartwatch",
    price: 39999,
    mrp: 45000,
    discountPercent: Math.round(((45000 - 39999) / 45000) * 100),
    image: require("../assets/images/Product/watch.png"),
    mainImage: require("../assets/images/Product/watch.png"),
    thumbnails: [require("../assets/images/Product/watch.png")],
    rating: 4.6,
    reviewsCount: 860,
    brand: "Apple",
    store: { id: 11, name: "Apple Store", slug: "apple", logo: undefined },
  },
  {
    id: 10,
    name: "GOOGLE Pixel 9 Pro",
    category: "Mobiles",
    shortDescription: "8/512 GB, Black Space Color",
    price: 99999,
    mrp: 120000,
    discountPercent: 17,
    image: require("../assets/images/Product/Pixel9pro.png"),
    mainImage: require("../assets/images/Product/Pixel9pro.png"),
    thumbnails: [require("../assets/images/Product/Pixel9pro.png")],
    rating: 4.5,
    reviewsCount: "1k",
    brand: "Google",
    store: { id: 15, name: "Google Store", slug: "google", logo: undefined },
  },
  {
    id: 11,
    name: "Samsung Fridge",
    category: "Appliances",
    shortDescription: "Large capacity refrigerator",
    price: 39999,
    mrp: 45000,
    discountPercent: 11,
    image: require("../assets/images/Product/fridge.png"),
    mainImage: require("../assets/images/Product/fridge.png"),
    thumbnails: [require("../assets/images/Product/fridge.png")],
    rating: 4.2,
    reviewsCount: "400",
    brand: "Samsung",
    store: {
      id: 12,
      name: "Samsung Official",
      slug: "samsung",
      logo: undefined,
    },
  },
  {
    id: 12,
    name: "Gaming Laptop",
    category: "Electronics",
    shortDescription: "High-performance gaming laptop",
    price: 30999,
    image: require("../assets/images/Product/gaminglaptop.png"),
    mainImage: require("../assets/images/Product/gaminglaptop.png"),
    thumbnails: [require("../assets/images/Product/gaminglaptop.png")],
    rating: 4.3,
    reviewsCount: 220,
    brand: "GamingBrand",
    store: { id: 16, name: "Gaming Store", slug: "gaming", logo: undefined },
  },
  {
    id: 13,
    name: "Smartwatch Model X",
    category: "Electronics",
    shortDescription: "Feature-packed smartwatch",
    price: 20999,
    image: require("../assets/images/Product/smartwatch.png"),
    mainImage: require("../assets/images/Product/smartwatch.png"),
    thumbnails: [require("../assets/images/Product/smartwatch.png")],
    rating: 4.1,
    reviewsCount: 310,
    brand: "WatchCo",
    store: { id: 17, name: "WatchCo", slug: "watchco", logo: undefined },
  },
  {
    id: 14,
    name: "OnePlus Buds 3",
    category: "Electronics",
    shortDescription: "True wireless earbuds",
    price: 5499,
    image: require("../assets/images/Product/gaminglaptop.png"),
    mainImage: require("../assets/images/Product/gaminglaptop.png"),
    thumbnails: [require("../assets/images/Product/gaminglaptop.png")],
    rating: 4.0,
    reviewsCount: 180,
    brand: "OnePlus",
    store: { id: 18, name: "OnePlus Store", slug: "oneplus", logo: undefined },
  },
  {
    id: 15,
    name: "Glow Radiance Face Serum",
    category: "Beauty",
    shortDescription: "Vitamin C serum for brightening",
    price: 799,
    mrp: 999,
    discountPercent: Math.round(((999 - 799) / 999) * 100),
    mainImage:
      "https://images.unsplash.com/photo-1618354695421-8af1a88a2f66?auto=format&fit=crop&w=1600&q=80",
    images: [
      "https://images.unsplash.com/photo-1618354695421-8af1a88a2f66?auto=format&fit=crop&w=1600&q=80",
    ],
    thumbnails: [
      "https://images.unsplash.com/photo-1618354695421-8af1a88a2f66?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.3,
    reviewsCount: 120,
    brand: "GlowCo",
    store: { id: 19, name: "GlowCo", slug: "glowco", logo: undefined },
  },

  // ---------------------------
  // Add 10 more to reach 25 items total (16..25)
  // ---------------------------
  {
    id: 16,
    name: "Philips Air Fryer 4.5L",
    category: "Home",
    shortDescription: "Compact air fryer for family-sized meals",
    price: 7999,
    mrp: 9999,
    discountPercent: Math.round(((9999 - 7999) / 9999) * 100),
    mainImage:
      "https://images.unsplash.com/photo-1600180758890-9e88c8f8d6b8?auto=format&fit=crop&w=1600&q=80",
    rating: 4.2,
    reviewsCount: 210,
    brand: "Philips",
    store: { id: 20, name: "Philips Store", slug: "philips", logo: undefined },
  },
  {
    id: 17,
    name: "The Alchemist (Paperback)",
    category: "Books",
    shortDescription: "Paulo Coelho's worldwide bestseller",
    price: 299,
    mrp: 399,
    mainImage:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&w=1600&q=80",
    rating: 4.6,
    reviewsCount: 5400,
    brand: "HarperCollins",
    store: { id: 21, name: "BookStore", slug: "books", logo: undefined },
  },
  {
    id: 18,
    name: "Bosch Vacuum Cleaner",
    category: "Home",
    shortDescription: "Powerful suction & lightweight",
    price: 12999,
    mrp: 15999,
    mainImage:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&w=1600&q=80",
    rating: 4.1,
    reviewsCount: 420,
    brand: "Bosch",
    store: { id: 22, name: "Bosch Official", slug: "bosch", logo: undefined },
  },
  {
    id: 19,
    name: "Fitbit Charge 6",
    category: "Electronics",
    shortDescription: "Fitness tracker with long battery life",
    price: 14999,
    mrp: 16999,
    mainImage:
      "https://images.unsplash.com/photo-1519861534489-6d7b6f8d3d2b?auto=format&w=1600&q=80",
    rating: 4.0,
    reviewsCount: 980,
    brand: "Fitbit",
    store: { id: 23, name: "Fitbit", slug: "fitbit", logo: undefined },
  },
  {
    id: 20,
    name: "Instant Pot Duo 6L",
    category: "Home",
    shortDescription: "6-in-1 Electric Pressure Cooker",
    price: 8999,
    mrp: 10999,
    mainImage:
      "https://images.unsplash.com/photo-1586201375759-7fefb6c4d6f9?auto=format&w=1600&q=80",
    rating: 4.4,
    reviewsCount: 650,
    brand: "Instant Pot",
    store: { id: 24, name: "InstantPot", slug: "instantpot", logo: undefined },
  },
  {
    id: 21,
    name: "Levi's 512 Slim Jeans",
    category: "Fashion",
    shortDescription: "Classic slim fit jeans",
    price: 2499,
    mrp: 3499,
    mainImage:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&w=1600&q=80",
    rating: 4.3,
    reviewsCount: 3200,
    brand: "Levi's",
    store: { id: 25, name: "Levis", slug: "levis", logo: undefined },
  },
  {
    id: 22,
    name: "Logitech MX Master 3",
    category: "Electronics",
    shortDescription: "Ergonomic wireless mouse",
    price: 7999,
    mrp: 9999,
    mainImage:
      "https://images.unsplash.com/photo-1587825140708-0b23b7b88b84?auto=format&w=1600&q=80",
    rating: 4.7,
    reviewsCount: 1340,
    brand: "Logitech",
    store: {
      id: 26,
      name: "Logitech Store",
      slug: "logitech",
      logo: undefined,
    },
  },
  {
    id: 23,
    name: "KitchenAid Stand Mixer",
    category: "Home",
    shortDescription: "Professional stand mixer for baking",
    price: 29999,
    mrp: 34999,
    mainImage:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&w=1600&q=80",
    rating: 4.5,
    reviewsCount: 210,
    brand: "KitchenAid",
    store: { id: 27, name: "KitchenAid", slug: "kitchenaid", logo: undefined },
  },
  {
    id: 24,
    name: "Sony A7 III Mirrorless Camera",
    category: "Electronics",
    shortDescription: "Full-frame mirrorless for hybrid shooters",
    price: 119999,
    mrp: 139999,
    mainImage:
      "https://images.unsplash.com/photo-1495433324511-bf8e92934d90?auto=format&w=1600&q=80",
    rating: 4.6,
    reviewsCount: 890,
    brand: "Sony",
    store: { id: 28, name: "Sony Store", slug: "sony", logo: undefined },
  },
  {
    id: 25,
    name: "Ray-Ban Wayfarer Sunglasses",
    category: "Fashion",
    shortDescription: "Classic unisex sunglasses",
    price: 6999,
    mrp: 8999,
    mainImage:
      "https://images.unsplash.com/photo-1503342394128-4802596e59f9?auto=format&w=1600&q=80",
    rating: 4.4,
    reviewsCount: 220,
    brand: "Ray-Ban",
    store: { id: 29, name: "Ray-Ban", slug: "rayban", logo: undefined },
  },
];

export const Bestproduct: ProductUniversal[] = [
  // Samsung, iPhone, Google Pixel, OnePlus
  product, // id=1 iPhone
  products.find((p) => p.id === 6) as ProductUniversal, // Samsung S25
  products.find((p) => p.id === 10) as ProductUniversal, // Pixel
  products.find((p) => p.id === 14) as ProductUniversal, // OnePlus Buds placeholder (kept in electronics)
];
/* Top deals — choose 7 items (as you requested earlier you wanted 7 top products) */
export const topDeals: ProductUniversal[] = [
  // pick high-visibility / electronics items
  products.find((p) => p.id === 7) as ProductUniversal,
  products.find((p) => p.id === 12) as ProductUniversal,
  products.find((p) => p.id === 13) as ProductUniversal,
  products.find((p) => p.id === 24) as ProductUniversal,
  products.find((p) => p.id === 5) as ProductUniversal,
  products.find((p) => p.id === 4) as ProductUniversal,
  products.find((p) => p.id === 9) as ProductUniversal,
];

/* Popular phones — keep 7 or fewer; here kept 3-5 common phones */
export const popularPhones: ProductUniversal[] = [
  // Samsung, iPhone, Google Pixel, OnePlus
  product, // id=1 iPhone
  products.find((p) => p.id === 6) as ProductUniversal, // Samsung S25
  products.find((p) => p.id === 10) as ProductUniversal, // Pixel
  products.find((p) => p.id === 14) as ProductUniversal, // OnePlus Buds placeholder (kept in electronics)
];

/* Best deals — keep 4 items (grid) */
export const bestDeals: ProductUniversal[] = [
  products.find((p) => p.id === 8) as ProductUniversal, // Nike Shoe (fashion)
  products.find((p) => p.id === 9) as ProductUniversal, // Apple Watch
  products.find((p) => p.id === 10) as ProductUniversal, // Pixel
  products.find((p) => p.id === 11) as ProductUniversal, // Samsung Fridge
];

/* ============================
   4) Helpers & Exports
   ============================ */

/**
 * Helper: lookup by numeric id (accepts string|number)
 */
export function getProductById(id?: number | string) {
  if (id == null) return undefined;
  const nid =
    typeof id === "string" && /^\d+$/.test(id) ? Number(id) : Number(id);
  if (Number.isNaN(nid)) return undefined;
  // check single-item detailed exports first
  if (product && product.id === nid) return product;
  if (productFacewash && productFacewash.id === nid) return productFacewash;
  if (productClothing && productClothing.id === nid) return productClothing;
  return products.find((p) => p.id === nid);
}

/* ============================
   5) Default export (convenience)
   ============================ */
export default {
  products,
  product,
  Bestproduct,
  productFacewash,
  productClothing,
  topDeals,
  popularPhones,
  bestDeals,
  getProductById,
};
