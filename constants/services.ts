// @/constants/services.ts
export type NearbyItem = {
  id: string;
  title: string;
  distance?: string;
  Address?: any;
  image: any;
};

export type RecommendedItem = {
  id: string;
  title: string;
  Address?: any;
  subtitle?: string;
  rating?: number;
  users?: number;
  image: any;
};

/**
 * Nearby places (used by NearbyList)
 * ids are strings and match the imageKey used when navigating to details
 */
export const NEARBY_DATA: NearbyItem[] = [
  {
    id: "kfc",
    title: "KFC",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    distance: "250 Meters Away",
    image: require("@/assets/images/kfc.png"),
  },
  {
    id: "hotel",
    title: "Five Star Hotel",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    distance: "350 Meters Away",
    image: require("@/assets/images/hotel.png"),
  },
  {
    id: "dominos",
    title: "Domino's",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    distance: "300 Meters Away",
    image: require("@/assets/images/dominos.png"),
  },
  {
    id: "HomeStay",
    title: "House Stay",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    distance: "350 Meters Away",
    image: require("@/assets/images/hotel.png"),
  },
  {
    id: "FiveStarHotel",
    title: "Five Star Hotel",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    distance: "350 Meters Away",
    image: require("@/assets/images/hotel.png"),
  },
  {
    id: "FiveStarHotel2",
    title: "Five Star Hotel",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    distance: "350 Meters Away",
    image: require("@/assets/images/hotel.png"),
  },
  // add more nearby items here as needed
];

/**
 * Recommended items (used by RecommendedList)
 * keep ids unique and string-typed so router params are stable
 */
export const RECOMMENDED_DATA: RecommendedItem[] = [
  {
    id: "1",
    title: "Rose Garden Restaurant",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    subtitle: "Burger · Chicken · Riche · Wings",
    rating: 4.4,
    users: 120,
    image: require("@/assets/images/restaurant.png"),
  },
  {
    id: "2",
    title: "Dumbell Door Club",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    subtitle: "Drink · Smoke · Dance",
    rating: 4.4,
    users: 120,
    image: require("@/assets/images/club.png"),
  },
  {
    id: "3",
    title: "Home Services",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    subtitle: "Drink · Smoke · Dance",
    rating: 4.4,
    users: 120,
    image: require("@/assets/images/home.png"),
  },
  {
    id: "4",
    title: "Dumbell Door Club",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    subtitle: "Drink · Smoke · Dance",
    rating: 4.4,
    users: 120,
    image: require("@/assets/images/club.png"),
  },
  {
    id: "5",
    title: "Dumbell Door Club",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    subtitle: "Drink · Smoke · Dance",
    rating: 4.4,
    users: 120,
    image: require("@/assets/images/club.png"),
  },
  {
    id: "6",
    title: "Dumbell Door Club",
    Address:
      "Vincom Center, No. 70 Le Thanh Ton, Ben Nghe Ward, District 1, HCMC",
    subtitle: "Drink · Smoke · Dance",
    rating: 4.4,
    users: 120,
    image: require("@/assets/images/club.png"),
  },
];
