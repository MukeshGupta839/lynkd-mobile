// app/(profiles)/InviteHome.tsx
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FontAwesome, Ionicons } from "@expo/vector-icons";

// ------------------- Header (no bottom safe-area padding) -------------------
const Header: React.FC<{ title: string; onRightPress?: () => void }> = ({
  title,
  onRightPress,
}) => {
  const navigation = useNavigation();
  return (
    // Only apply safe-area on TOP so no extra white below header
    <SafeAreaView edges={["top"]} className="bg-white">
      {/* Tight header: smaller vertical padding to minimize height */}
      <View className="bg-white border-b border-gray-200  py-1">
        <View className="flex-row items-center justify-between">
          {/* Back Arrow */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>

          {/* Absolutely centered title (won't shift with right content) */}
          <View className="absolute left-0 right-0 items-center">
            <Text className="text-lg font-semibold">{title}</Text>
          </View>

          {/* Right side action */}
          <TouchableOpacity onPress={onRightPress} className="p-2">
            <Text className="text-sm underline">View Invites</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ------------------- Gifts Auto-scroll (moves LEFT) -------------------
const GiftsAutoScroll: React.FC = () => {
  const cards = useMemo(
    () => [
      {
        title: "Go Pro 13",
        uri: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200",
      },
      {
        title: "iPad Air",
        uri: "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?q=80&w=1200",
      },
      {
        title: "Sony Headphones",
        uri: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1200",
      },
      {
        title: "Kindle Paperwhite",
        uri: "https://images.unsplash.com/photo-1542326237-94b1c5a538d6?q=80&w=1200",
      },
    ],
    []
  );

  // Duplicate data to loop seamlessly
  const loopData = useMemo(() => [...cards, ...cards], [cards]);

  const translateX = useRef(new Animated.Value(0)).current;
  const [oneSetWidth, setOneSetWidth] = useState(0);

  const onLayoutRow = (e: LayoutChangeEvent) => {
    // total width contains two sets → half is one set
    setOneSetWidth(e.nativeEvent.layout.width / 2);
  };

  useEffect(() => {
    if (!oneSetWidth) return;
    translateX.setValue(0);
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -oneSetWidth, // move LEFT by one set
        duration: 18000, // adjust speed if needed
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [oneSetWidth, translateX]);

  return (
    <View className="w-full overflow-hidden">
      <Animated.View
        onLayout={onLayoutRow}
        style={{ transform: [{ translateX }] }}
        className="flex-row px-4">
        {loopData.map((item, idx) => (
          <View
            key={`${item.title}-${idx}`}
            className="w-[170] mr-3 bg-white rounded-2xl overflow-hidden">
            <Image source={{ uri: item.uri }} className="w-full h-48" />
            <View className="px-3 py-3">
              <Text className="font-semibold text-base">{item.title}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

// ------------------- Main Screen -------------------
const InviteHome: React.FC = () => {
  const navigation = useNavigation();

  useEffect(() => {
    if (Platform.OS === "android") StatusBar.setBackgroundColor("#FFFFFF");
  }, []);

  // Random 6-character referral code (no API)
  const generatedCode = useMemo(() => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++)
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    return code;
  }, []);
  const [referralCode] = useState(generatedCode);

  const notify = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("", msg);
  };

  const handleCopy = async () => {
    await referralCode;
    notify("Referral code copied to clipboard");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `Join me on LYNKD! Use my referral code: ${referralCode}\n` +
          `Download: https://lynkd.app/app`,
      });
    } catch {}
  };

  const goViewInvites = () => navigation.navigate("ViewInvites" as never);

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" />
      <Header title="Rewards" onRightPress={goViewInvites} />

      <ScrollView className="flex-1 mt-3" showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-2xl p-2 mx-3">
          <Text className="text-[#a87e00] text-base leading-5 mb-4 px-1">
            Share Lynkd with your friends for a chance to win ₹50,000 cash or
            gifts of greater value!
          </Text>

          <View className="mb-3 px-1">
            <TextInput
              className="h-12 px-3 rounded-xl border border-gray-300 text-sm bg-white"
              value={referralCode}
              editable={false}
              placeholder="SRAB6U"
              placeholderTextColor="#A3A3A3"
            />
          </View>

          {/* Social Row */}
          <View className="flex-row items-center justify-between mt-2 px-1">
            <View className="flex-row items-center ">
              {/* WhatsApp */}
              <TouchableOpacity onPress={handleShare} activeOpacity={0.8}>
                <FontAwesome name="whatsapp" size={30} color="#25D366" />
              </TouchableOpacity>

              {/* Share (simple & clean) */}
              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.8}
                className="ml-2">
                <Ionicons name="share-outline" size={28} color="#000" />
              </TouchableOpacity>

              {/* Twitter/X (classic logo) */}
              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.8}
                className="ml-2">
                <FontAwesome name="twitter" size={30} color="#1DA1F2" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleCopy}
              activeOpacity={0.9}
              className="bg-black rounded-full px-3 h-10 items-center justify-center">
              <Text className="text-white font-semibold">Copy Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How it Works */}
        <Text className="text-[#a87e00] text-xl font-semibold mt-5 mb-2 px-3">
          How It Works ?
        </Text>

        <View className="bg-white rounded-2xl px-1 py-2 mx-3">
          <View className="flex-row items-start  mb-6">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-2">
              <Ionicons name="mail-outline" size={26} color="#000" />
            </View>
            <Text className="flex-1 text-base leading-6 mt-2">
              Invite your contacts to register on LYNKD
            </Text>
          </View>

          <View className="flex-row items-start mb-6">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-2">
              <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
            </View>
            <Text className="flex-1 text-base leading-6">
              Your friend register using the referral code and complete account
              setup
            </Text>
          </View>

          <View className="flex-row items-start mb-2">
            <View className="w-10 h-10 rounded-xl bg-yellow-100 items-center justify-center mr-2">
              <Ionicons
                name="document-text-outline"
                size={26}
                color="#A16207"
              />
            </View>
            <Text className="flex-1 text-base leading-6">
              You will be added to the rewards pool along with your friend
            </Text>
          </View>
        </View>

        {/* Gifts */}
        <Text className="text-[#a87e00] text-xl font-semibold mt-6 mb-2 px-3">
          Gifts
        </Text>
        <GiftsAutoScroll />

        <View className="h-12" />
      </ScrollView>
    </View>
  );
};

export default InviteHome;
