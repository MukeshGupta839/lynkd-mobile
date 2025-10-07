import { useGradualAnimation } from "@/hooks/useGradualAnimation";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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

  // TODO: Replace with actual AuthContext
  // const { firebaseUser, user, setUser, isCreator, setIsCreator } = useContext(AuthContext);

  // Mock user data - replace with actual context
  const mockUser = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    username: "john_doe",
    email: "john@example.com",
    bio: "Your bio here",
    profile_picture: "https://randomuser.me/api/portraits/men/1.jpg",
    banner_image:
      "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg",
    phone_number: "",
    is_creator: true,
  };

  const user = mockUser;

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
  const [fetchedUser, setFetchedUser] = useState(mockUser);

  const keyboardPadding = useAnimatedStyle(() => {
    return {
      paddingBottom: kbHeight.value,
    };
  }, [kbHeight]);

  const fetchUserProfile = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await apiCall(`/api/users/${firebaseUser.uid}`, 'GET');

      // Mock data for now
      const userData = mockUser;
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

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          // Use the image directly - ImagePicker already applies quality and editing
          setImage(result.assets[0].uri);
        }
      } else {
        // Banner image - use 16:9 aspect ratio to match banner dimensions (h-52 height)
        // This ensures the crop perfectly fits the banner display area
        if (source === "launchCameraAsync") {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });
        } else {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
          });
        }

        if (!result.canceled) {
          // Use the image directly - ImagePicker already applies quality and editing
          setBannerImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error picking/compressing image:", error);
      Alert.alert("Error", "Failed to pick or compress the image.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: Implement actual API call with formData
      setUploading(true);

      console.log("Saving profile...", {
        name,
        username,
        bio,
        image,
        bannerImage,
        twitterHandle,
        instagramHandle,
        youtubeChannel,
        phoneNumber,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Success", "Profile updated successfully!");

      setUploading(false);
    } catch (error) {
      console.error("Profile update failed:", error);
      Alert.alert("Profile Update Failed", "Issue updating your profile.");
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
          className={`text-base w-[120px] ${
            label === "Bio" ? "self-start pt-[15px]" : "self-center pt-0"
          }`}
        >
          {label}
        </Text>
        <View className="flex-row items-center gap-2 border-t border-gray-200">
          {label !== "Phone Number" ? (
            <TextInput
              className={`text-base text-gray-600 w-[225px] ${
                label === "Bio"
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
          {renderSection("Email", user.email, () => {})}
          {renderSection("Phone Number", phoneNumber, () => {})}
          {renderSection("Bio", bio, setBio, true)}

          <View className="pt-4">
            <Text className="text-base mb-4">Socials</Text>

            <View className="flex-row mb-4 justify-between">
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/81/81609.png",
                }}
                className="w-5 h-5 left-[5px] top-[2px]"
                style={{ resizeMode: "contain" }}
              />
              <TextInput
                className="text-base text-gray-600 w-[225px]"
                value={twitterHandle}
                placeholder="Twitter handle"
                placeholderTextColor="#999"
                onChangeText={setTwitterHandle}
              />
            </View>

            <View className="flex-row mb-4 justify-between">
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/87/87390.png",
                }}
                className="w-5 h-5 left-[5px] top-[2px]"
                style={{ resizeMode: "contain" }}
              />
              <TextInput
                className="text-base text-gray-600 w-[225px]"
                value={instagramHandle}
                placeholder="Instagram handle"
                placeholderTextColor="#999"
                onChangeText={setInstagramHandle}
              />
            </View>

            <View className="flex-row mb-4 justify-between">
              <Image
                source={{
                  uri: "https://e7.pngegg.com/pngimages/901/503/png-clipart-black-play-button-icon-youtube-computer-icons-social-media-play-button-angle-rectangle-thumbnail.png",
                }}
                className="w-5 h-5 left-[5px] top-[2px]"
                style={{ resizeMode: "contain" }}
              />
              <TextInput
                className="text-base text-gray-600 w-[225px]"
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
