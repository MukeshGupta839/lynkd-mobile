export type PromoSlide = {
  id: number | string;
  image: any;
};

// Banner data for home screen
export const homeBannerData: PromoSlide[] = [
  {
    id: 1,
    image: require("../assets/images/BannerAds.png"),
  },
  {
    id: 2,
    image: require("../assets/images/BannerAds.png"),
  },
  {
    id: 3,
    image: require("../assets/images/BannerAds.png"),
  },
];

export const CategoriesBannerData: PromoSlide[] = [
  {
    id: 1,
    image: require("../assets/images/categoriesBannerAds.png"),
  },
  {
    id: 2,
    image: require("../assets/images/categoriesBannerAds.png"),
  },
  {
    id: 3,
    image: require("../assets/images/categoriesBannerAds.png"),
  },
];
