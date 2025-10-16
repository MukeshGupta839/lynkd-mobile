import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import Logo from "../assets/splash3.png";
export default function Index() {
  const bounceAnimation = useRef(new Animated.Value(0)).current;
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  const authContext = useContext(AuthContext);

  // Preload the destination route when auth context is loaded
  useEffect(() => {
    if (!authContext?.loading) {
      // Preload/prepare the navigation target
      if (authContext?.user && authContext?.completedRegistration) {
        // Preload tabs route in background
        router.push("/(tabs)");
      } else {
        // Preload auth route in background
        router.push("/(auth)");
      }
    }
  }, [authContext?.loading, authContext?.user, authContext?.completedRegistration]);

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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
      setShouldRedirect(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (authContext?.loading || minLoadingTime || !shouldRedirect) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* <ActivityIndicator size="large" /> */}
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
  return null;
}
