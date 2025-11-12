import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useMicrophonePermission,
} from "react-native-vision-camera";

interface StoriesCameraProps {
  onMediaCaptured: (mediaUri: string, isVideo: boolean) => void;
  onClose: () => void;
  disableVideo?: boolean;
}

export default function StoriesCamera({
  onMediaCaptured,
  onClose,
  disableVideo = false,
}: StoriesCameraProps) {
  const camera = useRef<Camera>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<"back" | "front">(
    "back"
  );
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [isVideo, setIsVideo] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [galleryPermission, requestGalleryPermission] =
    ImagePicker.useMediaLibraryPermissions();
  const [isActive, setIsActive] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<"4:3" | "16:9" | "1:1">("4:3");

  // Get camera device
  const device = useCameraDevice(cameraPosition);

  // Calculate aspect ratio as decimal for format filter
  const aspectRatioValue =
    aspectRatio === "4:3" ? 4 / 3 : aspectRatio === "16:9" ? 16 / 9 : 1; // 1:1

  // Get camera format with aspect ratio filter and high resolution
  const format = useCameraFormat(device, [
    { videoResolution: "max" },
    { photoResolution: "max" },
    { videoAspectRatio: aspectRatioValue },
    { photoAspectRatio: aspectRatioValue },
  ]);

  // Get permissions
  const {
    hasPermission: hasCameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: hasMicPermission,
    requestPermission: requestMicPermission,
  } = useMicrophonePermission();

  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    (async () => {
      if (!hasCameraPermission) {
        await requestCameraPermission();
      }
      if (!hasMicPermission) {
        await requestMicPermission();
      }
    })();
  }, [
    hasCameraPermission,
    hasMicPermission,
    requestCameraPermission,
    requestMicPermission,
  ]);

  // Cleanup: Stop recording when component unmounts
  useEffect(() => {
    return () => {
      if (isRecording && camera.current) {
        camera.current.stopRecording();
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  // Check permissions
  if (!hasCameraPermission || !hasMicPermission) {
    return (
      <View className="flex-1 bg-black justify-center">
        <Text className="text-white text-base text-center w-4/5 self-center">
          Camera and Microphone permissions are required to take photos and
          record videos.
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }}
          className="p-3 bg-white rounded-lg mt-4 w-[200px] self-center"
        >
          <Text className="text-black text-base text-center font-semibold">
            Continue to Use Camera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View className="flex-1 justify-center bg-black">
        <Text className="text-white text-base text-center w-4/5 self-center">
          No camera device found
        </Text>
      </View>
    );
  }

  // Function to stop recording
  const stopRecording = async () => {
    if (camera.current && isRecording) {
      try {
        await camera.current.stopRecording();
        setIsRecording(false);
      } catch (error) {
        console.error("Error stopping recording:", error);
      }
    }
  };

  // Function to start recording a video
  const handleStartRecording = async () => {
    if (camera.current) {
      try {
        setIsRecording(true);
        camera.current.startRecording({
          flash: flash === "on" ? "on" : "off",
          onRecordingFinished: (video) => {
            console.log("Video recording completed", video.path);
            onMediaCaptured(`file://${video.path}`, true);
            onClose();
          },
          onRecordingError: (error) => {
            console.error("Error recording video:", error);
            setIsRecording(false);
          },
        });
      } catch (error) {
        console.error("Error starting recording:", error);
        setIsRecording(false);
      }
    }
  };

  // Function to take a picture
  const handleTakePicture = async () => {
    if (camera.current && !isRecording) {
      try {
        const photo = await camera.current.takePhoto({
          flash: flash === "on" ? "on" : "off",
          enableShutterSound: false,
        });
        if (photo?.path) {
          onMediaCaptured(`file://${photo.path}`, false);
          onClose();
        }
      } catch (error) {
        console.error("Error taking picture:", error);
      }
    }
  };

  // Gallery picker
  const handleGalleryPick = async () => {
    if (!galleryPermission?.granted) {
      const permission = await requestGalleryPermission();
      if (!permission.granted) {
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: !disableVideo ? ["images", "videos"] : ["images"],
        allowsEditing: Platform.OS === "ios" ? false : true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const isVideo = result.assets[0].type === "video";
        onMediaCaptured(result.assets[0].uri, isVideo);
        onClose();
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === "back" ? "front" : "back"));
  };

  const toggleAspectRatio = () => {
    setAspectRatio((current) => {
      if (current === "4:3") return "16:9";
      if (current === "16:9") return "1:1";
      return "4:3";
    });
  };

  // Calculate camera classes based on aspect ratio
  const getCameraClasses = () => {
    switch (aspectRatio) {
      case "4:3":
        return "w-full aspect-[3/4]";
      case "16:9":
        return "w-full aspect-[9/16]";
      case "1:1":
        return "w-full aspect-square";
      default:
        return "w-full aspect-[3/4]";
    }
  };

  return (
    <View className="flex-1 bg-black">
      {/* Black background layer */}
      <View className="absolute inset-0 bg-black" />

      {/* Camera container with aspect ratio - centered vertically */}
      <View className="absolute inset-0 justify-center items-center">
        <View className={`overflow-hidden ${getCameraClasses()}`}>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive}
            photo={true}
            video={true}
            audio={true}
            format={format}
            videoStabilizationMode="auto"
            photoQualityBalance="quality"
            enableZoomGesture={true}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Recording Timer */}
      {isRecording && (
        <View className="absolute top-[60px] self-center flex-row items-center bg-black/50 px-3 py-2 rounded-[20px]">
          <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
          <Text className="text-white text-base font-semibold">
            {recordingTime}s
          </Text>
        </View>
      )}

      {/* Capture Button */}
      {!isVideo ? (
        <TouchableOpacity
          className="absolute bottom-10 self-center w-[70px] h-[70px] rounded-full bg-white/30 justify-center items-center"
          onPress={handleTakePicture}
          disabled={isRecording}
        >
          <View className="w-[60px] h-[60px] rounded-full bg-white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="absolute bottom-10 self-center w-[70px] h-[70px] rounded-full bg-white/30 justify-center items-center"
          onPress={isRecording ? stopRecording : handleStartRecording}
          onLongPress={handleStartRecording}
          onPressOut={stopRecording}
        >
          {!isRecording ? (
            <View className="w-[60px] h-[60px] rounded-full bg-[#ff3b30]" />
          ) : (
            <View className="w-[60px] h-[60px] rounded-full bg-white justify-center items-center">
              <View className="w-[30px] h-[30px] bg-[#ff3b30] rounded" />
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Back button */}
      <TouchableOpacity
        className="absolute top-[60px] left-5"
        onPress={onClose}
      >
        <Ionicons name="close" size={30} color="white" />
      </TouchableOpacity>

      {/* Aspect Ratio Button */}
      <TouchableOpacity
        className="absolute top-[60px] right-5 px-3 py-2 bg-black/50 rounded-[20px]"
        onPress={toggleAspectRatio}
      >
        <Text className="text-white text-sm font-semibold">{aspectRatio}</Text>
      </TouchableOpacity>

      {/* Flip Camera */}
      <TouchableOpacity
        className="absolute bottom-[50px] right-5 p-2.5 bg-black/50 rounded-[20px]"
        onPress={toggleCamera}
      >
        <Ionicons name="camera-reverse" size={24} color="white" />
      </TouchableOpacity>

      {/* Button to change camera mode from photo to video */}
      {!disableVideo && (
        <TouchableOpacity
          className="absolute bottom-[50px] left-5 p-2.5 bg-black/50 rounded-[20px]"
          onPress={() => setIsVideo((prev) => !prev)}
        >
          {!isVideo ? (
            <Ionicons name="videocam" size={24} color="white" />
          ) : (
            <Ionicons name="camera" size={24} color="white" />
          )}
        </TouchableOpacity>
      )}

      {/* Gallery Button */}
      <TouchableOpacity
        className="absolute bottom-[50px] left-24 p-2.5 bg-black/50 rounded-[20px]"
        onPress={handleGalleryPick}
      >
        <Ionicons name="images" size={24} color="white" />
      </TouchableOpacity>

      {/* Flash Button */}
      {device.hasFlash && (
        <TouchableOpacity
          className="absolute bottom-[50px] right-24 p-2.5 bg-black/50 rounded-[20px]"
          onPress={toggleFlash}
        >
          <Ionicons
            name={flash === "off" ? "flash-off" : "flash"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
