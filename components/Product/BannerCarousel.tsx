import { LinearGradient } from "expo-linear-gradient";
import { Zap } from "lucide-react-native";
import { useState } from "react";
import { Dimensions, Image, Text, View } from "react-native";
import Carousel from "react-native-reanimated-carousel";

export type PromoSlide = {
  id: number | string;
  title: string;
  descriptionParts: { text: string; className?: string }[];
  spec: string;
  price: string;
  image: any;
  gradient: [string, string] | [string, string, string];
};

const fallback: PromoSlide = {
  id: 1,
  title: "IPHONE 16",
  descriptionParts: [
    { text: "Hello, ", className: "text-white" },
    { text: "Apple Intelligence.", className: "text-green-300" },
  ],
  spec: "A18 Chip. Superfast. Super Stable",
  price: "From ₹63,999*",
  image: require("../../assets/images/Product/iphone.png"),
  gradient: ["#60a5fa", "#6366f1", "#8b5cf6"],
};

type LayoutPreset = {
  widthPctOfScreen: number;   // fallback width if containerWidthPx not provided
  cardAspect: number;         // w/h
  containerAlignClass: string;
  slideMarginClass: string;   // <-- back (fixes Home spacing)
  homeTextPadRightClass?: string;
  textWidthClass?: string;    // no inline style
  imgClass: string;
  titleSize: string;
  descSize: string;
  priceSize: string;
};

const PRESETS: Record<"home" | "categories", LayoutPreset> = {
  home: {
    widthPctOfScreen: 1.0,
    cardAspect: 1 / 0.38,
    containerAlignClass: "items-center",
    slideMarginClass: "mx-4",
    homeTextPadRightClass: "pr-[35%]",
    imgClass: "absolute top-[27%] left-[70%] w-[34%] h-[90%]",
    // << sizes you requested
    titleSize: "text-xl",
    descSize: "text-xs",
    priceSize: "text-sm",
  },
  categories: {
    widthPctOfScreen: 0.70,       // ~290 on ~412px
    cardAspect: 290 / 150,
    containerAlignClass: "items-start",
    slideMarginClass: "",         // we add page padding outside
    textWidthClass: "w-[45%]",    // ~134/301
    imgClass: "absolute top-[8%] right-[3%] w-[45%] h-[90%]",
    // << sizes you requested
    titleSize: "text-xs",
    descSize: "text-xxs",
    priceSize: "text-sm",
  },
};

export default function PromoBannerCarousel({
  variant,
  slides = [fallback, fallback, fallback],
  containerWidthPx,            // optional: categories passes measured width
  cardPercentOfContainer = 1,
  containerClassName = "",     // e.g., "mr-4" so banner ends with page padding
}: {
  variant: "home" | "categories";
  slides?: PromoSlide[];
  containerWidthPx?: number;
  cardPercentOfContainer?: number;
  containerClassName?: string;
}) {
  const [idx, setIdx] = useState(0);
  const sw = Dimensions.get("window").width;
  const L = PRESETS[variant];

  const baseW = containerWidthPx ?? sw * L.widthPctOfScreen;
  const cardW = Math.round(baseW * cardPercentOfContainer);
  const cardH = Math.round(cardW / L.cardAspect);

  return (
    <View className={`w-full ${L.containerAlignClass} ${containerClassName}`}>
      <Carousel
        loop
        autoPlay
        width={cardW}
        height={cardH}
        data={slides}
        onSnapToItem={setIdx}
        scrollAnimationDuration={1200}
        renderItem={({ item }) => (
          <View className={`rounded-[20px] overflow-hidden ${L.slideMarginClass}`}>
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full rounded-[20px] px-4 py-3 relative"
            >
              {/* LEFT column: top text + bottom price (never overlaps) */}
              <View
                className={`h-full justify-between ${variant === "home" ? (L.homeTextPadRightClass ?? "") : ""} ${L.textWidthClass ?? ""}`}
              >
                <View>
                  <View className="self-start transform -skew-x-12 bg-[#26FF91] rounded-xl px-3 py-1 mb-3">
                    <View className="transform skew-x-12 flex-row items-center">
                      <Text className="text-black font-extrabold italic text-base mr-1">
                        Flash Sale
                      </Text>
                      <Zap size={16} color="black" fill="black" />
                    </View>
                  </View>

                  <Text className={`text-white font-extrabold ${L.titleSize} mb-1`}>
                    {item.title}
                  </Text>

                  <Text className={`${L.descSize} mb-1`}>
                    {item.descriptionParts.map((p, i) => (
                      <Text key={i} className={p.className}>
                        {p.text}
                      </Text>
                    ))}
                  </Text>

                  <Text className="text-white text-xxs">{item.spec}</Text>
                </View>

                <Text className={`text-white font-bold ${L.priceSize} mt-2`}>
                  {item.price}
                </Text>
              </View>

              {/* RIGHT image */}
              <Image source={item.image} resizeMode="contain" className={L.imgClass} />
            </LinearGradient>
          </View>
        )}
      />

      <View className="flex-row justify-center mt-3 w-full">
        {slides.map((_, i) => (
          <View
            key={i}
            className={`h-2 w-2 rounded-full mx-1 ${i === idx ? "bg-black" : "bg-black/30"}`}
          />
        ))}
      </View>
    </View>
  );
}
