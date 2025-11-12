import { AuthContext } from "@/context/AuthContext";
import { useReelsStore } from "@/stores/useReelsStore";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import Logo from "../assets/splash3.png";

export default function Index() {
  const bounceAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const authContext = useContext(AuthContext);

  // --- State for Navigation Logic ---
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);
  const [readyToNavigate, setReadyToNavigate] = useState(false);
  const [prefetchTriggered, setPrefetchTriggered] = useState(false);

  // --- Zustand Store Subscriptions ---
  const prefetchReels = useReelsStore((state) => state.prefetchReels);
  const isPrefetching = useReelsStore((state) => state.isPrefetching);
  const reelsLoaded = useReelsStore((state) => state.reels.length > 0);

  // Animation logic (unchanged)
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: -10,
          duration: 500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 10,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: -10,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [bounceAnimation]);

  // Timer for minimum splash screen time
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTimePassed(true);
    }, 1000); // Your 1-second minimum
    return () => clearTimeout(timer);
  }, []);

  // Logic for data loading and navigation readiness
  useEffect(() => {
    if (authContext?.loading) {
      return; // Wait for auth to finish loading
    }

    const isUserRegistered =
      authContext?.user &&
      authContext?.completedRegistration &&
      authContext?.user?.email?.split("@")[0] !== authContext?.user?.username;

    if (isUserRegistered) {
      // User is logged in
      if (!prefetchTriggered && !reelsLoaded) {
        // Trigger prefetch ONCE if not already triggered and no reels are loaded
        console.log("🎬 Starting reels prefetch...");
        prefetchReels(String(authContext.user.id));
        setPrefetchTriggered(true);
      }

      // We are ready to navigate if...
      if (
        (prefetchTriggered && !isPrefetching) || // EITHER prefetch was triggered AND finished
        reelsLoaded // OR reels were already loaded (from a previous session)
      ) {
        setReadyToNavigate(true);
      }
    } else {
      // User not logged in or registration incomplete
      setReadyToNavigate(true); // Ready to navigate to (auth)
    }
  }, [
    authContext,
    prefetchReels,
    isPrefetching,
    prefetchTriggered,
    reelsLoaded,
  ]);

  // Navigation logic
  useEffect(() => {
    // Navigate ONLY when BOTH min time has passed AND data/auth check is ready
    if (minLoadingTimePassed && readyToNavigate) {
      const isUserRegistered =
        authContext?.user &&
        authContext?.completedRegistration &&
        authContext?.user?.email?.split("@")[0] !== authContext?.user?.username;

      if (isUserRegistered) {
        console.log("✅ Min time passed & data ready, navigating to (tabs)");
        router.replace("/(tabs)");
      } else {
        console.log("✅ Min time passed & auth checked, navigating to (auth)");
        router.replace("/(auth)");
      }
    }
  }, [minLoadingTimePassed, readyToNavigate, authContext, router]);

  // Keep showing splash while auth is loading OR min time hasn't passed OR prefetching is in progress
  if (
    authContext?.loading ||
    !minLoadingTimePassed ||
    (prefetchTriggered && isPrefetching)
  ) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Animated.Image
          source={Logo}
          style={{
            width: 100,
            height: 100,
            transform: [{ translateY: bounceAnimation }],
          }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return null; // Render null during the brief moment of navigation
}
