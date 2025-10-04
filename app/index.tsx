import { AuthContext } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const authContext = useContext(AuthContext);

  // Show loading spinner while checking authentication
  if (authContext?.loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If user is authenticated and has completed registration, go to tabs
  if (authContext?.user && authContext?.completedRegistration) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, redirect to auth screens
  return <Redirect href="/(auth)" />;
}
