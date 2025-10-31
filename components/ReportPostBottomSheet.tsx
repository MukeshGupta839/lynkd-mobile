import { reportPostApi } from "@/lib/api/api";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ReportPostBottomSheet = ({
  show,
  setShow,
  postId,
  userId,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  postId: string;
  userId: string;
}) => {
  const [reported, setReported] = useState(false);
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
        duration: 900,
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
        duration: 900,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        setShow(false);
        isAnimating.current = false;
        if (reported) {
          setReported(false);
        }
      }, 10);
    } else {
      setShow(true);
    }
  };

  const reportReasons = [
    {
      id: 1,
      reason: "Spam",
      description: "Unwanted commercial content or spam",
    },
    {
      id: 2,
      reason: "Nudity or sexual content",
      description: "Adult content or explicit material",
    },
    {
      id: 3,
      reason: "Hate speech or symbols",
      description: "Racism, homophobia, or discriminatory content",
    },
    {
      id: 4,
      reason: "Violence or dangerous organizations",
      description: "Graphic violence or promotion of terrorism",
    },
    {
      id: 5,
      reason: "Sale of illegal or regulated goods",
      description: "Drugs, weapons, or counterfeit items",
    },
    {
      id: 6,
      reason: "Bullying or harassment",
      description: "Offensive behavior targeting individuals",
    },
    {
      id: 7,
      reason: "Intellectual property violation",
      description: "Copyright or trademark infringement",
    },
    {
      id: 8,
      reason: "False information",
      description: "Deliberately false or misleading content",
    },
    {
      id: 9,
      reason: "Suicide or self-injury",
      description: "Content promoting self-harm",
    },
    { id: 10, reason: "Other", description: "Other concerns not listed above" },
  ];

  const handleReport = async (reasonId: number) => {
    try {
      const reasonObj = reportReasons.find((r) => r.id === reasonId);
      // Ensure `reason` is always a string (provide a sensible default).
      const reason: string = reasonObj?.reason ?? "Other";

      // Call API (reason is guaranteed to be a string now)
      await reportPostApi(postId, userId, reason);
      setReported(true);
    } catch (error) {
      console.error("Error reporting post:", error);
    }
  };

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
          className="bg-white rounded-t-[20px]"
          style={{
            transform: [{ translateY: slideAnim }],
            maxHeight: "80%",
          }}
        >
          {/* Handle */}
          <TouchableOpacity className="self-center pt-3" onPress={toggleSheet}>
            <View className="bg-gray-300 w-12 h-1 rounded-full" />
          </TouchableOpacity>

          {!reported ? (
            <>
              <View className="p-5 border-b border-gray-200 w-full">
                <Text className="text-2xl font-worksans-600 mb-3 text-center">
                  Report Post
                </Text>
                <Text className="w-full text-base text-gray-500 leading-5 font-worksans-400">
                  Your report is anonymous, except if you&apos;re reporting an
                  intellectual property infringement. If someone is in immediate
                  danger, call local emergency services.
                </Text>
              </View>
              <ScrollView
                className="max-h-[70%]"
                showsVerticalScrollIndicator={false}
              >
                {reportReasons.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row items-center p-4 border-b border-gray-200 justify-between"
                    onPress={() => handleReport(item.id)}
                  >
                    <Text className="text-base font-worksans-500 flex-1">
                      {item.reason}
                    </Text>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : (
            <View className="p-5 items-center">
              <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
              <Text className="text-xl font-bold mt-5 mb-3">
                Thanks for letting us know
              </Text>
              <Text className="text-sm text-gray-600 text-center leading-5 mb-5">
                Your feedback helps us maintain community guidelines and ensure
                a safe environment. We&apos;ll review this report within 24
                hours.
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ReportPostBottomSheet;
