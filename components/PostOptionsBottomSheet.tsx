import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  isButton?: boolean;
  textColor?: string;
  onPress: () => void;
}

const PostOptionsBottomSheet = ({
  show,
  setShow,
  setBlockUser,
  setReportVisible,
  setFocusedPost,
  isFollowing,
  toggleFollow,
  focusedPost,
  deleteAction,
  user,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  setBlockUser: (show: boolean) => void;
  setReportVisible: (show: boolean) => void;
  setFocusedPost: (post: any) => void;
  isFollowing: boolean;
  toggleFollow: () => void;
  focusedPost: any;
  deleteAction: (postId: string) => void;
  user: any;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  const isAnimating = useRef(false);

  // Modal visibility control
  useEffect(() => {
    if (show && !modalVisible) {
      setModalVisible(true);
    } else if (!show && modalVisible) {
      setModalVisible(false);
    }
  }, [show, modalVisible]);

  // Animation effect when modal becomes visible
  useEffect(() => {
    if (modalVisible && show) {
      slideAnim.setValue(Dimensions.get("window").height);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, show, slideAnim]);

  const toggleSheet = () => {
    if (isAnimating.current) return;

    if (show) {
      isAnimating.current = true;
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 300,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        setShow(false);
        isAnimating.current = false;
      }, 10);
    } else {
      setShow(true);
    }
  };

  const menuItems = useMemo(() => {
    const baseMenuItems: MenuItem[] = [
      {
        id: "following",
        icon: "person-add-outline",
        label: isFollowing ? "Following" : "Follow",
        isButton: true,
        onPress: toggleFollow,
      },
      {
        id: "message",
        icon: "chatbubble-outline",
        label: "Message",
        isButton: true,
        onPress: () => {
          setShow(false);
          // TODO: Navigate to chat screen when it's available
          console.log("Navigate to message:", focusedPost?.username);
          // Example navigation (uncomment when route is available):
          // navigation.navigate("chat/[id]", {
          //   id: focusedPost?.user_id,
          //   username: focusedPost?.username,
          //   profilePicture: focusedPost?.photoURL || 'https://via.placeholder.com/150',
          // });
        },
      },
      {
        id: "favorite",
        icon: "star-outline",
        label: "Add to favorites",
        onPress: () => {
          console.log("Add to favorites");
          setShow(false);
        },
      },
      {
        id: "block",
        icon: "ban-outline",
        label: "Block",
        textColor: "#000",
        onPress: () => {
          setBlockUser(true);
          setShow(false);
        },
      },
      {
        id: "notInterested",
        icon: "close-circle-outline",
        label: "Not Interested",
        onPress: () => {
          console.log("Not interested");
          setShow(false);
        },
      },
      {
        id: "hide",
        icon: "eye-off-outline",
        label: "Hide",
        onPress: () => {
          console.log("Hide post");
          setShow(false);
        },
      },
      {
        id: "report",
        icon: "flag-outline",
        label: "Report",
        textColor: "#FF3B30",
        onPress: () => {
          setReportVisible(true);
          setShow(false);
        },
      },
    ];

    const ownPostMenuItems: MenuItem[] = [
      {
        id: "favorite",
        icon: "star-outline",
        label: "Add to favorites",
        onPress: () => {
          console.log("Add to favorites");
          setShow(false);
        },
      },
      {
        id: "boost",
        icon: "trending-up-outline",
        label: "Boost",
        onPress: () => {
          console.log("Boost post");
          setShow(false);
        },
      },
      {
        id: "delete",
        icon: "trash-outline",
        label: "Delete",
        textColor: "#FF3B30",
        onPress: () => {
          deleteAction(focusedPost.id);
          setShow(false);
        },
      },
    ];

    return focusedPost?.user_id === user?.id ? ownPostMenuItems : baseMenuItems;
  }, [
    focusedPost,
    user,
    isFollowing,
    toggleFollow,
    setShow,
    setBlockUser,
    setReportVisible,
    deleteAction,
  ]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        if (!isAnimating.current) toggleSheet();
      }}
      statusBarTranslucent // <-- covers the status bar (removes white strip)
      hardwareAccelerated // <-- avoids tiny rendering glitches while animating
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={toggleSheet}
      >
        <Animated.View
          className="bg-white rounded-t-3xl mx-1 pt-2 px-3"
          style={{
            transform: [{ translateY: slideAnim }],
            maxHeight: "90%",
          }}
        >
          {/* Handle */}
          <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-2" />

          <ScrollView
            className="max-h-full"
            showsVerticalScrollIndicator={false}
          >
            {focusedPost?.user_id !== user?.id && (
              <View className="flex-row pt-2 gap-2">
                {menuItems
                  .filter((item) => item.isButton)
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      className="flex-1 bg-gray-100 rounded-full p-3 items-center justify-center flex-row gap-2"
                      onPress={() => {
                        Vibration.vibrate(50);
                        item.onPress();
                      }}
                    >
                      <Text className="text-sm font-medium">{item.label}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}

            <View className="mb-8">
              {menuItems
                .filter((item) => !item.isButton)
                .map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row items-center px-2 py-3 justify-between"
                    onPress={() => {
                      Vibration.vibrate(50);
                      item.onPress();
                    }}
                  >
                    <View className="flex-row items-center gap-4">
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={item.textColor || "#000"}
                      />
                      <View className="flex-1">
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color: item.textColor || "#000",
                          }}
                        >
                          {item.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default PostOptionsBottomSheet;
