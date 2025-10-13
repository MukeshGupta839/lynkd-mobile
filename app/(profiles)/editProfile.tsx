import { AuthContext } from "@/context/AuthContext";
import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import { apiCall } from "@/lib/api/apiService";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PhoneNumberInput from "../../components/PhoneNumberInput";

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const kbHeight = useGradualAnimation();

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("EditProfile must be used within an AuthProvider");
  }

  const { firebaseUser, user, setUser, isCreator, setIsCreator } = context;

  const [name, setName] = useState(
    user ? `${user.first_name} ${user.last_name}` : ""
  );
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [image, setImage] = useState(user?.profile_picture || "");
  const [uploading, setUploading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [bannerImage, setBannerImage] = useState(
    user?.banner_image ||
    "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg"
  );
  const [imageSelector, setImageSelector] = useState("profile");
  const [displaySaveChanges, setDisplaySaveChanges] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [fetchedUser, setFetchedUser] = useState<any>(null);
  const initialImage = user?.profile_picture || "";
  const initialBannerImage = user?.banner_image || "";

  const keyboardPadding = useAnimatedStyle(() => {
    return {
      paddingBottom: kbHeight.value,
    };
  }, [kbHeight]);

  const fetchUserProfile = useCallback(async () => {
    try {
      if (!firebaseUser) throw new Error("No authenticated user found.");

      const uid = firebaseUser.uid;

      const response = await apiCall(`/api/users/${uid}`, "GET");
      console.log(response.user.social_media_accounts[0]);

      if (response.user) {
        const userData = response.user;
        setFetchedUser(userData);
        setName(
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim()
        );
        setUsername(userData.username || "");
        setBio(userData.bio || "");
        setImage(
          userData.profile_picture ||
          "https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0="
        );
        setBannerImage(
          userData.banner_image ||
          "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg?semt=ais_hybrid"
        );
        setTwitterHandle(
          userData?.social_media_accounts?.[0]?.twitter_username || ""
        );
        setInstagramHandle(
          userData?.social_media_accounts?.[0]?.instagram_username || ""
        );
        setYoutubeChannel(
          userData?.social_media_accounts?.[0]?.youtube_username || ""
        );
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  useEffect(() => {
    setIsLoading(true);
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (Platform.OS === "ios") {
      const keyboardDidShowListener = Keyboard.addListener(
        "keyboardDidShow",
        () => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }
      );

      const keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide",
        () => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }
  }, []);

  function handleSelectedCountry(country: any) {
    setSelectedCountry(country);
  }

  // Keyboard listener to hide save changes
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setDisplaySaveChanges(false);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setDisplaySaveChanges(true);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const pickImage = async (
    source: "launchCameraAsync" | "launchImageLibraryAsync"
  ) => {
    try {
      // Request permissions based on source
      if (source === "launchCameraAsync") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Camera permissions are required to take a photo."
          );
          return;
        }
      } else {
        // Request media library permissions for gallery
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Photo library permissions are required to choose a photo."
          );
          return;
        }
      }

      let result;
      if (imageSelector === "profile") {
        if (source === "launchCameraAsync") {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.75,
          });
        } else {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.75,
          });
        }

        if (!result.canceled) {
          const compressed = await manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 500, height: 500 } }],
            { compress: 0.7, format: SaveFormat.JPEG }
          );
          setImage(compressed.uri);
        }
      } else {
        // Banner image - use 16:9 aspect ratio to match banner dimensions (h-52 height)
        // This ensures the crop perfectly fits the banner display area
        if (source === "launchCameraAsync") {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: Platform.OS !== "ios",
            aspect: Platform.OS !== "ios" ? [206, 75] : [1, 1],
            quality: 0.75,
          });
        } else {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: Platform.OS !== "ios",
            aspect: Platform.OS !== "ios" ? [206, 75] : [1, 1],
            quality: 0.75,
          });
        }

        if (!result.canceled) {
          let compressed;
          if (Platform.OS === "ios") {
            const { width, height } = result.assets[0];
            const cropWidth = width;
            const cropHeight = (width * 75) / 206;
            const originY = (height - cropHeight) / 2;
            compressed = await manipulateAsync(
              result.assets[0].uri,
              [
                {
                  crop: {
                    originX: 0,
                    originY,
                    width: cropWidth,
                    height: cropHeight,
                  },
                },
              ],
              { compress: 0.7, format: SaveFormat.JPEG }
            );
          } else {
            compressed = await manipulateAsync(
              result.assets[0].uri,
              [{ resize: { width: 412, height: 150 } }],
              { compress: 0.7, format: SaveFormat.JPEG }
            );
          }
          setBannerImage(compressed.uri);
        }
      }
    } catch (error) {
      console.error("Error picking/compressing image:", error);
      Alert.alert("Error", "Failed to pick or compress the image.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!firebaseUser) throw new Error("No authenticated user found.");

      const uid = firebaseUser.uid;
      const formData = new FormData();

      formData.append("uid", uid);
      formData.append("firstName", name.split(" ")[0].trim());
      formData.append("lastName", name.split(" ").slice(1).join(" ").trim());
      formData.append("username", username.trim());
      formData.append("bio", bio.trim());
      formData.append("isCreator", String(isCreator));
      formData.append(
        "phone_number",
        selectedCountry
          ? selectedCountry?.callingCode + " " + phoneNumber
          : fetchedUser?.phone_number || ""
      );

      if (initialImage !== image && image && !image.startsWith("http")) {
        formData.append("profile_picture", {
          uri: image,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);
      }

      if (
        initialBannerImage !== bannerImage &&
        bannerImage &&
        !bannerImage.startsWith("http")
      ) {
        formData.append("banner_image", {
          uri: bannerImage,
          type: "image/jpeg",
          name: "banner.jpg",
        } as any);
      }

      formData.append("user_id", String(user?.id || ""));
      formData.append("twitter_handle", twitterHandle || "");
      formData.append("instagram_handle", instagramHandle || "");
      formData.append("youtube_channel", youtubeChannel || "");

      setUploading(true);
      const url = `/api/users/editing/${uid}`;
      console.log("URL:", url);

      // Use 'apiCall' for the API call
      const response = await apiCall(url, "POST", formData, {
        "Content-Type": "multipart/form-data",
      });

      if (response.user) {
        const updatedUser = {
          ...user,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          username: response.user.username,
          bio: response.user.bio,
          profile_picture: response.user.profile_picture,
          is_verified: response.user.is_verified,
          is_creator: response.user.is_creator,
          phone_number: response.user?.phone_number,
        };

        setUser(updatedUser);
        setIsCreator(response.user.is_creator);

        Alert.alert("Success", "Profile updated successfully!");
        router.back();
      } else {
        throw new Error("Failed to update profile.");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      Alert.alert(
        "Profile Update Failed",
        error instanceof Error ? error.message : "Issue updating your profile."
      );
    } finally {
      setUploading(false);
    }
  };

  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
  });

  const renderSection = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    isMultiline = false
  ) => {
    return (
      <View className="flex-row justify-start items-center px-4 gap-2.5">
        <Text
          className={`text-base w-[120px] ${label === "Bio" ? "self-start pt-[15px]" : "self-center pt-0"
            }`}
        >
          {label}
        </Text>
        <View className="flex-row items-center gap-2 border-t border-gray-200">
          {label !== "Phone Number" ? (
            <TextInput
              className={`text-base text-gray-600 w-[225px] ${label === "Bio"
                ? "h-[100px] align-top pt-[15px]"
                : "h-[40px] align-middle pt-0"
                }`}
              value={value}
              onChangeText={onChangeText}
              placeholder={"Type your " + label}
              multiline={isMultiline}
              numberOfLines={isMultiline ? 5 : 1}
              selection={selection}
              onFocus={() => {
                setSelection({ start: 0, end: 0 });
              }}
              editable={["Username", "Email"].includes(label) ? false : true}
              onSelectionChange={(syntheticEvent: any) => {
                const { nativeEvent } = syntheticEvent;
                const { selection } = nativeEvent;
                setSelection(selection);
              }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => setPhoneModalVisible(true)}
              className="flex-row items-center justify-between w-[230px] h-[40px]"
            >
              <Text className="text-base text-gray-600">
                {selectedCountry?.callingCode && phoneNumber
                  ? selectedCountry.callingCode + " " + phoneNumber
                  : fetchedUser?.phone_number || "Add phone number"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return isLoading ? (
    <ActivityIndicator
      size="large"
      color="#000"
      className="flex-1 justify-center items-center"
    />
  ) : (
    <View className="flex-1 bg-white relative">
      <ScrollView
        className="flex-1"
        ref={scrollRef}
        bounces={false}
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {/* Header with Banner */}
        <View className="relative h-52">
          <TouchableOpacity
            onPress={() => {
              setMenuVisible(true);
              setImageSelector("banner");
            }}
            className="w-full h-full"
          >
            <Image
              source={{
                uri:
                  bannerImage ||
                  "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg",
              }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </TouchableOpacity>

          {/* Back Button Overlay */}
          <View
            className="absolute inset-0 flex-row justify-between px-4"
            style={{ paddingTop: insets.top - 10 }}
          >
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Social Media Buttons */}
          <View className="flex-row absolute bottom-9 right-4 gap-2">
            {twitterHandle && twitterHandle.length > 0 && (
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                onPress={() =>
                  Linking.openURL(`https://twitter.com/${twitterHandle}`)
                }
              >
                <FontAwesome5 name="twitter" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {instagramHandle && instagramHandle.length > 0 && (
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                onPress={() =>
                  Linking.openURL(`https://instagram.com/${instagramHandle}`)
                }
              >
                <FontAwesome5 name="instagram" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {youtubeChannel && youtubeChannel.length > 0 && (
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                onPress={() =>
                  Linking.openURL(`https://youtube.com/${youtubeChannel}`)
                }
              >
                <FontAwesome5 name="youtube" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content Section with Rounded Top */}
        <View className="px-4 pt-4 bg-gray-100 rounded-t-3xl -mt-4">
          {/* Profile Image */}
          <TouchableOpacity
            onPress={() => {
              setMenuVisible(true);
              setImageSelector("profile");
            }}
            className="-mt-16 mb-4 w-24 h-24 rounded-full"
          >
            <Image
              source={{ uri: image }}
              className="w-24 h-24 rounded-full border-4 border-white"
            />
          </TouchableOpacity>

          {renderSection("Name", name, setName)}
          {renderSection("Username", username, setUsername)}
          {renderSection("Email", user.email, () => { })}
          {renderSection("Phone Number", phoneNumber, () => { })}
          {renderSection("Bio", bio, setBio, true)}

          <View className="pt-4 px-4">
            <Text className="text-base mb-4">Socials</Text>

            <View className="flex-row items-center gap-2.5 mb-4 border-t border-gray-200">
              <View className="w-[120px] flex-row items-center gap-2">
                <Image
                  source={{
                    uri: "https://cdn-icons-png.flaticon.com/512/81/81609.png",
                  }}
                  className="w-5 h-5"
                  style={{ resizeMode: "contain" }}
                />
                <Text className="text-sm text-gray-700">Twitter</Text>
              </View>
              <TextInput
                className="text-base text-gray-600 w-[225px] h-[40px]"
                value={twitterHandle}
                placeholder="Twitter handle"
                placeholderTextColor="#999"
                onChangeText={setTwitterHandle}
              />
            </View>

            <View className="flex-row items-center gap-2.5 mb-4 border-t border-gray-200">
              <View className="w-[120px] flex-row items-center gap-2">
                <Image
                  source={{
                    uri: "https://cdn-icons-png.flaticon.com/512/87/87390.png",
                  }}
                  className="w-5 h-5"
                  style={{ resizeMode: "contain" }}
                />
                <Text className="text-sm text-gray-700">Instagram</Text>
              </View>
              <TextInput
                className="text-base text-gray-600 w-[225px] h-[40px]"
                value={instagramHandle}
                placeholder="Instagram handle"
                placeholderTextColor="#999"
                onChangeText={setInstagramHandle}
              />
            </View>

            <View className="flex-row items-center gap-2.5 mb-4 border-t border-gray-200">
              <View className="w-[120px] flex-row items-center gap-2">
                <Image
                  source={{
                    uri: "https://www.iconpacks.net/icons/1/free-youtube-icon-123-thumb.png",
                  }}
                  className="w-5 h-5"
                  style={{ resizeMode: "contain" }}
                />
                <Text className="text-sm text-gray-700">YouTube</Text>
              </View>
              <TextInput
                className="text-base text-gray-600 w-[225px] h-[40px]"
                value={youtubeChannel}
                placeholder="YouTube channel"
                placeholderTextColor="#999"
                onChangeText={setYoutubeChannel}
              />
            </View>
          </View>

          {/* Spacing at bottom */}
          <View className="h-[320px]" />
        </View>
      </ScrollView>

      {displaySaveChanges && (
        <TouchableOpacity
          className="bg-black p-2.5 rounded-[10px] items-center absolute w-[96%] self-center"
          onPress={handleSaveProfile}
          style={{
            bottom: Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
          }}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      )}

      <Modal
        visible={phoneModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPhoneModalVisible(false)}
      >
        <Animated.View className="flex-1" style={[keyboardPadding]}>
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={() => setPhoneModalVisible(false)}
          >
            <View className="bg-white rounded-t-2xl max-h-[70%]">
              <View className="flex-row justify-between items-center p-4">
                <TouchableOpacity onPress={() => setPhoneModalVisible(false)}>
                  <Text className="text-red-600 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-base font-semibold">Phone Number</Text>
                <TouchableOpacity
                  onPress={() => {
                    setPhoneModalVisible(false);
                  }}
                >
                  <Text className="text-black text-sm font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <View className="p-4">
                <PhoneNumberInput
                  inputValue={phoneNumber}
                  handleInputValue={setPhoneNumber}
                  selectedCountry={selectedCountry}
                  handleSelectedCountry={handleSelectedCountry}
                />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Modal>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-xl p-4">
            <TouchableOpacity
              className="py-4 border-b border-gray-200"
              onPress={() => {
                pickImage("launchCameraAsync");
                setMenuVisible(false);
              }}
            >
              <Text className="text-base text-center text-black font-semibold">
                Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-4 border-b border-gray-200"
              onPress={() => {
                pickImage("launchImageLibraryAsync");
                setMenuVisible(false);
              }}
            >
              <Text className="text-base text-center text-black font-semibold">
                Choose From Gallery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-4 mt-2"
              onPress={() => setMenuVisible(false)}
            >
              <Text className="text-base text-center text-red-600 font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
