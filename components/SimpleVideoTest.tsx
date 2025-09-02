import { Asset } from "expo-asset";
import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SimpleVideoTest() {
  // Test with a simple remote video first
  const remoteVideoUri =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  // Test with local asset
  const localAsset = Asset.fromModule(
    require("../assets/videos/dummyVerticalVideo.mp4")
  );
  console.log("Local asset info:", {
    uri: localAsset.uri,
    localUri: localAsset.localUri,
    downloaded: localAsset.downloaded,
    hash: localAsset.hash,
  });

  const remotePlayer = useVideoPlayer(remoteVideoUri, (player) => {
    player.loop = true;
    player.muted = true;
  });

  const localPlayer = useVideoPlayer(localAsset.uri || "", (player) => {
    player.loop = true;
    player.muted = true;
  });

  React.useEffect(() => {
    // Try to download the local asset
    if (!localAsset.downloaded) {
      localAsset
        .downloadAsync()
        .then(() => {
          console.log("Asset downloaded:", localAsset.localUri);
        })
        .catch(console.error);
    }
  }, []);

  React.useEffect(() => {
    const remoteSubscription = remotePlayer.addListener(
      "statusChange",
      (status) => {
        console.log("Remote video status:", status);
      }
    );

    const localSubscription = localPlayer.addListener(
      "statusChange",
      (status) => {
        console.log("Local video status:", status);
      }
    );

    return () => {
      remoteSubscription?.remove();
      localSubscription?.remove();
    };
  }, [remotePlayer, localPlayer]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video Test</Text>

      <Text style={styles.subtitle}>Remote Video (Should work)</Text>
      <VideoView
        player={remotePlayer}
        style={styles.video}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      <Text style={styles.subtitle}>Local Video (Android issue)</Text>
      <VideoView
        player={localPlayer}
        style={styles.video}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  video: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
  },
});
