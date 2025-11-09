// constants/highlights.ts
import type { ProductDetailsData } from "@/components/Productview/ProductHighlights";

/** Backward-compat: your original iPhone 15 details */
export const detailsData: ProductDetailsData = {
  topHighlights: {
    rows: [
      { label: "Brand", value: "Apple" },
      { label: "Operating System", value: "iOS" },
      { label: "Memory Storage Capacity", value: "256 GB" },
      { label: "Screen Size", value: "6.1 Inches" },
      { label: "Model Name", value: "iPhone 15" },
      { label: "Network Service Provider", value: "Unlocked for All Carriers" },
    ],
    bullets: [
      "Dynamic Island comes to iPhone 15 — bubbles up alerts and Live Activities so you don’t miss them.",
    ],
    description:
      "iPhone 15 brings you a brand-new Dynamic Island, an advanced dual-camera system, and the superfast A16 Bionic chip. With a durable design, all-day battery life, and a USB-C connector, iPhone 15 is built for everything you do every day.",
    maxLines: 3,
  },

  specifications: {
    title: "Product specifications",
    defaultTabId: "additional",
    tabs: [
      {
        id: "additional",
        title: "Additional details",
        rows: [
          { label: "Operating System", value: "iOS" },
          { label: "Memory Storage Capacity", value: "256 GB" },
          { label: "Colour", value: "Black" },
          { label: "Connector Type", value: "USB Type C" },
          { label: "Form Factor", value: "Bar" },
          { label: "Biometric Security Feature", value: "Face Recognition" },
          { label: "Water Resistance Level", value: "Water Resistant" },
        ],
      },
      {
        id: "display",
        title: "Display",
        rows: [
          { label: "Type", value: "Super Retina XDR Display" },
          { label: "Resolution", value: "2556x1179 pixels" },
          { label: "Brightness", value: "2000 nits peak" },
        ],
      },
      {
        id: "connectivity",
        title: "Connectivity",
        rows: [
          { label: "Bluetooth", value: "5.3" },
          { label: "Wi-Fi", value: "6E" },
          { label: "NFC", value: "Yes" },
          { label: "SIM", value: "Dual eSIM" },
        ],
      },
    ],
  },

  aboutBrand: {
    badge: "Top Brand",
    name: "Apple",
    bullets: [
      "92% positive ratings from 100K+ customers",
      "100K+ recent orders from this brand",
      "12+ years on Amazon",
    ],
  },

  gallery: {
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

  inTheBox: {
    items: ["iPhone 15", "USB-C Charge Cable (1m)", "Documentation"],
  },
};

/** New: details for facewash (FMCG/Beauty) */
const detailsFacewash: ProductDetailsData = {
  topHighlights: {
    rows: [
      { label: "Brand", value: "Mamaearth" },
      { label: "Item Form", value: "Foam / Gel" },
      { label: "Skin Type", value: "All Skin Types" },
      { label: "Scent", value: "Citrus" },
      { label: "Volume", value: "150 ml" },
      { label: "Dermatologically Tested", value: "Yes" },
    ],
    bullets: [
      "Infused with Vitamin C and Turmeric for radiant, healthy-looking skin.",
      "Removes dirt, impurities, and excess oil without drying out the skin.",
      "Brightens skin tone and improves natural glow with regular use.",
    ],
    description:
      "Mamaearth Vitamin C Face Wash is enriched with Vitamin C and Turmeric to deeply cleanse, brighten, and rejuvenate your skin. Its natural ingredients promote even skin tone and protect against free radical damage, leaving your skin fresh and glowing after every wash.",
    maxLines: 3,
  },
  specifications: {
    title: "Product specifications",
    defaultTabId: "ingredients",
    tabs: [
      {
        id: "ingredients",
        title: "Ingredients",
        rows: [
          {
            label: "Key Ingredients",
            value: "Vitamin C, Turmeric, Aloe Vera, Lemon Extract",
          },
          {
            label: "Free From",
            value:
              "Parabens, Sulfates (SLS/SLES), Silicones, Synthetic Fragrance",
          },
          { label: "pH Level", value: "Balanced for skin" },
          { label: "Comedogenic Rating", value: "0 (Non-comedogenic)" },
        ],
      },
      {
        id: "usage",
        title: "How to use",
        rows: [
          { label: "Step 1", value: "Wet your face with lukewarm water." },
          {
            label: "Step 2",
            value:
              "Apply a small amount of the face wash and gently massage in circular motions.",
          },
          {
            label: "Step 3",
            value:
              "Rinse thoroughly and pat dry. Use twice daily for best results.",
          },
        ],
      },
      {
        id: "info",
        title: "Additional Info",
        rows: [
          { label: "Shelf Life", value: "24 months" },
          { label: "Country of Origin", value: "India" },
          { label: "Net Quantity", value: "150 ml" },
        ],
      },
    ],
  },
  aboutBrand: {
    badge: "Made Safe Certified",
    name: "Mamaearth",
    bullets: [
      "Asia’s 1st MadeSafe-certified brand",
      "Natural, toxin-free, and cruelty-free formulations",
      "Committed to sustainable and eco-friendly skincare",
    ],
  },
  gallery: {
    images: [
      {
        uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ8ZwyGMlZL78AiGufuI-eWt7mQ8Ar7-kW6vp3N6Qd1c3ITaIE5TCGhgpgF03fRxErtIufe30YQ9o3ycqWNN5ekzpdHKeg6Sloz3cer0nmOW5AcqvaLa8jWaaM",
      },
      {
        uri: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQy4tp-XMwJB7WNqZ6AqwKiIJcFNE1r2GaTgmcZHWdqa5IAu_9b8r0veBIxMDfBB4QelqZ8mG1CUPpaToBElnMHKrlO45ZcFVmWC7a3p9CxpW7ldcpniU-WYQ",
      },
      {
        uri: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQaQ4KwOJ3g-wB9BQ0gEzZluYofZZjdfHdEPTww2jTTswhxTGzwnBjh5cj-XZy1cDxCoQKe44PkjWUviJ4M9GDWE5RtNQEYYBgH_0fTg0g",
      },
    ],
  },
  inTheBox: {
    items: ["1 x Mamaearth Vitamin C Face Wash Tube (150 ml)"],
  },
};

const detailsClothing: ProductDetailsData = {
  topHighlights: {
    rows: [
      { label: "Material composition", value: "100% Cotton" },
      { label: "Pattern", value: "Solid" }, // change to Checks/Striped if needed
      { label: "Sleeve type", value: "Long Sleeve" },
      { label: "Fit type", value: "Regular Fit" },
      { label: "Collar style", value: "Spread Collar" },
      { label: "Length", value: "Hip Length" },
    ],
    bullets: [
      "Breathable cotton fabric for all-day comfort.",
      "Button-down front with spread collar for a smart casual look.",
      "Curved hem; pairs well with jeans or chinos.",
    ],
    description:
      "A versatile men's cotton casual shirt crafted from soft, breathable fabric. Designed in a regular fit with a spread collar and full sleeves—easy to dress up or down for office, outings, or weekend wear.",
    maxLines: 3,
  },

  specifications: {
    title: "Product specifications",
    defaultTabId: "fabric",
    tabs: [
      {
        id: "fabric",
        title: "Fabric & Care",
        rows: [
          { label: "GSM", value: "160" },
          { label: "Weave", value: "Oxford" }, // change to Plain/Poplin if needed
          { label: "Care", value: "Machine wash cold, line dry" },
          { label: "Ironing", value: "Warm iron; avoid over the label" },
        ],
      },
      {
        id: "size",
        title: "Size & Fit",
        rows: [
          { label: "Model Height", value: "183 cm (wearing M)" },
          { label: "Fit", value: "Regular" },
          { label: "Length", value: "Hip Length" },
        ],
      },
    ],
  },

  aboutBrand: {
    badge: "Popular",
    name: "Veirdo", // update if your brand differs
    bullets: [
      "Quality everyday apparel",
      "Ethically sourced cotton",
      "Trusted by thousands of customers",
    ],
  },

  // clothing variant: size guide only (no gallery/inTheBox)
  sizeGuide: {
    title: "Size guide",
    metaTitle: "Veirdo Size Chart",
    metaSubtitle: "IN OVERSIZED T-SHIRT",
    datasets: [
      {
        unit: "in",
        rowLabels: ["Brand Size", "Chest", "Length"],
        colLabels: ["S", "M", "L", "XL", "XXL", "XXXL"],
        values: {
          "Brand Size": {
            S: "S",
            M: "M",
            L: "L",
            XL: "XL",
            XXL: "XXL",
            XXXL: "XXXL",
          },
          Chest: { S: 38, M: 40, L: 42, XL: 44, XXL: 46, XXXL: 48 },
          Length: { S: 28, M: 29, L: 30, XL: 31, XXL: 32, XXXL: 33 },
        },
      },
      {
        unit: "cm",
        rowLabels: ["Brand Size", "Chest", "Length"],
        colLabels: ["S", "M", "L", "XL", "XXL", "XXXL"],
        values: {
          "Brand Size": {
            S: "S",
            M: "M",
            L: "L",
            XL: "XL",
            XXL: "XXL",
            XXXL: "XXXL",
          },
          Chest: { S: 97, M: 102, L: 107, XL: 112, XXL: 117, XXXL: 122 },
          Length: { S: 71, M: 74, L: 76, XL: 79, XXL: 81, XXXL: 84 },
        },
      },
    ],
  },

  additionalInfo: {
    title: "Additional Information",
    rows: [
      { label: "Country of Origin", value: "India" },
      {
        label: "Manufacturer",
        value:
          "AWESOMEFAB SHOPPING PRIVATE LIMITED, Block No. 808, Cadila Estate, Opp. Tulsi Hotel, Aslali, Dist. Ahmedabad-382427",
      },
      {
        label: "Packer",
        value:
          "AWESOMEFAB SHOPPING PRIVATE LIMITED, Block No. 808, Cadila Estate, Opp. Tulsi Hotel, Aslali, Dist. Ahmedabad-382427",
      },
      {
        label: "Importer",
        value:
          "AWESOMEFAB SHOPPING PRIVATE LIMITED, Block No. 808, Cadila Estate, Opp. Tulsi Hotel, Aslali, Dist. Ahmedabad-382427",
      },
      { label: "Item Weight", value: "350 g" },
      { label: "Item Dimensions LxWxH", value: "30 x 25 x 3 cm" },
      { label: "Net Quantity", value: "1.0 count" },
      { label: "Generic Name", value: "Shirt" },
    ],
  },
};

/** Map by product kind (aligns with your productByKind keys) */
export const detailsByKind: Record<
  "phone" | "facewash" | "clothing",
  ProductDetailsData
> = {
  phone: detailsData, // keep your original iPhone details
  facewash: detailsFacewash,
  clothing: detailsClothing,
};

/** Helper: safe getter */
export const getDetailsForType = (type?: string): ProductDetailsData =>
  (type && (detailsByKind as any)[type]) || detailsByKind.phone;
