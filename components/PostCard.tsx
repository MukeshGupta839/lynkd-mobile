// components/PostCard.tsx
import { FacebookStyleImage } from "@/components/FacebookStyleImage";
import { MultiImageCollage } from "@/components/MultiImageCollage";
import { MultiImageViewer } from "@/components/MultiImageViewer";
import { AuthContext } from "@/context/AuthContext";
import { apiCall } from "@/lib/api/apiService";
import { MaterialIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import { useRouter } from "expo-router";
import { Send } from "lucide-react-native";
import React, { useCallback, useContext, useRef, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureType,
} from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import ShareSectionBottomSheet from "./ShareSectionBottomSheet";
import StatusModal from "./StatusModal";

/* ===========================
   Media renderer (single opens; double toggles like via JS debounce + hard lock)
   =========================== */
const PostMedia = ({
  media,
  isVisible,
  postId,
  onLongPress,
  isGestureActive = false,
  panGesture,
  onDoubleLike, // <-- toggle like/unlike
}: {
  media?: string | { type: "images"; uris: string[] };
  isVisible: boolean;
  postId: string;
  onLongPress?: () => void;
  isGestureActive?: boolean;
  panGesture: GestureType;
  onDoubleLike: () => void;
}) => {
  const [showMultiViewer, setShowMultiViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // ---------- URI normalization (avoids viewer crash on Android) ----------
  const extractImagePath = (image: string) => {
    const parts = image?.split?.("posts-images/") ?? [];
    return parts.length > 1 ? parts[1] : image;
  };
  const buildUri = useCallback((u: string | undefined) => {
    if (!u) return "";
    return Platform.OS === "ios"
      ? u
      : `https://ik.imagekit.io/cs3lxv36v/lynkd-posts/${extractImagePath(u)}`;
  }, []);
  const normalizeUris = useCallback(
    (arr?: string[]) => (arr ?? []).map(buildUri).filter(Boolean),
    [buildUri]
  );

  // ---------- Tap logic: JS debounce + hard "double-tap lock" ----------
  const lastTapRef = useRef<number>(0);
  type Timer = ReturnType<typeof setTimeout>;
  const singleTimerRef = useRef<Timer | null>(null);
  const DOUBLE_DELAY = 260; // ms

  // When a double tap is detected, we lock out *any* open for a short time.
  const doubleTapLockRef = useRef(false);
  const armDoubleTapLock = useCallback(() => {
    doubleTapLockRef.current = true;
    setTimeout(() => {
      doubleTapLockRef.current = false;
    }, 360); // > DOUBLE_DELAY window
  }, []);

  // Open viewer safely
  const openViewer = useCallback(
    (index: number, images: string[]) => {
      if (isGestureActive) return;
      if (doubleTapLockRef.current) return; // ⛔ hard lock: do not open after a double
      if (!images?.length) return;
      setSelectedImageIndex(Math.min(Math.max(index, 0), images.length - 1));
      setShowMultiViewer(true);
    },
    [isGestureActive]
  );

  // Handle a tap (JS): if second tap within DOUBLE_DELAY -> toggle like + lock; else schedule open
  const handleTap = useCallback(
    (singleOpen: () => void, toggleLike: () => void) => {
      const now = Date.now();
      const delta = now - (lastTapRef.current || 0);
      lastTapRef.current = now;

      if (singleTimerRef.current) {
        clearTimeout(singleTimerRef.current);
        singleTimerRef.current = null;
      }

      if (delta < DOUBLE_DELAY) {
        // DOUBLE TAP → toggle like + lock out opening
        toggleLike();
        armDoubleTapLock();
        return;
      }

      // SINGLE TAP → open after delay (gives chance for 2nd tap to cancel)
      singleTimerRef.current = setTimeout(() => {
        singleTimerRef.current = null;
        if (!doubleTapLockRef.current) singleOpen();
      }, DOUBLE_DELAY + 10);
    },
    [armDoubleTapLock]
  );

  // fresh Tap gesture factory (so we don't mutate an already-used gesture)
  const makeTapGesture = useCallback(
    (onTap: () => void) =>
      Gesture.Tap()
        .numberOfTaps(1)
        .maxDelay(DOUBLE_DELAY + 40)
        .simultaneousWithExternalGesture(panGesture)
        .onEnd((_e: unknown, success: boolean) => {
          "worklet";
          if (success) scheduleOnRN(onTap);
        }),
    [panGesture]
  );

  // helper: wrap children with a new detector each time
  const wrapWithTap = useCallback(
    (children: React.ReactNode, onTap: () => void) => (
      <GestureDetector gesture={makeTapGesture(onTap)}>
        <View>{children}</View>
      </GestureDetector>
    ),
    [makeTapGesture]
  );

  // ---------- Render variants ----------
  if (!media) return null;

  // Single image via string
  if (typeof media === "string") {
    const uri = buildUri(media);
    const images = [uri].filter(Boolean);

    const onTap = () =>
      handleTap(
        () => openViewer(0, images),
        () => onDoubleLike()
      );

    return (
      <>
        {wrapWithTap(
          <FacebookStyleImage
            uri={uri}
            // IMPORTANT: parent controls taps; child must not have its own taps
            disableInteractions
          />,
          onTap
        )}
        <MultiImageViewer
          images={images}
          visible={showMultiViewer}
          initialIndex={selectedImageIndex}
          onClose={() => setShowMultiViewer(false)}
        />
      </>
    );
  }

  // Single image in array
  if (media.type === "images" && media.uris?.length === 1) {
    const uri = buildUri(media.uris[0]);
    const images = [uri].filter(Boolean);

    const onTap = () =>
      handleTap(
        () => openViewer(0, images),
        () => onDoubleLike()
      );

    return (
      <>
        {wrapWithTap(
          <FacebookStyleImage
            uri={uri}
            style={{ marginBottom: 0 }}
            disableInteractions
          />,
          onTap
        )}
        <MultiImageViewer
          images={images}
          visible={showMultiViewer}
          initialIndex={selectedImageIndex}
          onClose={() => setShowMultiViewer(false)}
        />
      </>
    );
  }

  // Multiple images
  if (media.type === "images" && media.uris?.length > 1) {
    const images = normalizeUris(media.uris);

    const onTap = () =>
      handleTap(
        () => openViewer(0, images),
        () => onDoubleLike()
      );

    return (
      <GestureDetector gesture={makeTapGesture(onTap)}>
        <View>
          <MultiImageCollage
            images={images} // normalized URLs
            onPressImage={(i) => openViewer(i, images)} // single press on tile
            disableInteractions
          />
          <MultiImageViewer
            images={images}
            visible={showMultiViewer}
            initialIndex={selectedImageIndex}
            onClose={() => setShowMultiViewer(false)}
          />
        </View>
      </GestureDetector>
    );
  }

  return (
    <View className="w-full h-24 bg-gray-200 rounded-lg items-center justify-center mb-2">
      <Text style={{ color: "#666", fontSize: 12 }}>
        Unsupported media type
      </Text>
    </View>
  );
};

/* ===========================
   Types
   =========================== */
export interface PostCardProps {
  item: any;
  isVisible: boolean;
  onLongPress?: (item: any) => void;
  isGestureActive?: boolean;
  panGesture: GestureType;
  onPressComments?: (post: any) => void;
  likedPostIDs?: string[];
  onToggleLike?: (postId: string) => void;
  toggleLike?: (postId: string) => void; // Backward compatibility
  onUpdatePost?: (postId: string, updates: any) => void;
  profilePostsMode?: boolean;
}

/* ===========================
   Card
   =========================== */
export const PostCard: React.FC<PostCardProps> = ({
  item,
  isVisible,
  onLongPress,
  isGestureActive = false,
  panGesture,
  onPressComments,
  likedPostIDs = [],
  onToggleLike,
  toggleLike: toggleLikeProp, // Support both prop names
  onUpdatePost,
  profilePostsMode = false,
}) => {
  const router = useRouter();
  const navigating = useRef(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [ecommerceStatusOpen, setEcommerceStatusOpen] = useState(false);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // Derive like state from props or item
  const postId = String(item.id);
  const isLikedFromProps = likedPostIDs.map(String).includes(postId);
  const liked = isLikedFromProps || Boolean(item?.liked);
  const likeCount =
    typeof item?.likes_count === "number" ? item.likes_count : 0;

  // Use whichever toggle function is provided
  const toggleLikeHandler = onToggleLike || toggleLikeProp;

  const openPostOptions = React.useCallback(() => {
    Vibration.vibrate(100);
    onLongPress?.(item);
  }, [item, onLongPress]);

  const handleUserPressSafe = () => {
    if (profilePostsMode || isGestureActive) return;
    router.push({
      pathname: "/(profiles)" as any,
      params: { user: item.user_id as number },
    });
  };

  const getHashtagsWithinLimit = (hashtags: string[], limit = 300) => {
    let totalLength = 0;
    if (!hashtags) return [];
    return hashtags.filter((tag) => {
      totalLength += tag.length + 1;
      return totalLength <= limit;
    });
  };
  const neededHashtags = getHashtagsWithinLimit(item.post_hashtags || []);

  const goToProductSafe = () => {
    if (isGestureActive) return;
    if (navigating.current) return;
    navigating.current = true;
    // router.push("/Product/Productview");
    setEcommerceStatusOpen(true);
    setTimeout(() => {
      navigating.current = false;
    }, 600);
  };

  const makeTapThatYieldsToPan = (onEnd: () => void) =>
    Gesture.Tap()
      .maxDuration(220)
      .maxDeltaX(10)
      .maxDeltaY(10)
      .simultaneousWithExternalGesture(panGesture)
      .onEnd((_e: unknown, success: boolean) => {
        "worklet";
        if (success) scheduleOnRN(onEnd);
      });

  const openProductTap = makeTapThatYieldsToPan(goToProductSafe);
  const openProfileTap = makeTapThatYieldsToPan(handleUserPressSafe);

  // Caption double-tap state
  const lastCaptionTapRef = useRef<number>(0);
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- Build a SAFE post preview for chat ---------- */
  const previewImage =
    typeof item.postImage === "string"
      ? item.postImage
      : item?.postImage?.type === "images"
        ? item?.postImage?.uris?.[0] || ""
        : "";

  const postPreview = {
    id: String(item.id),
    image: previewImage || "",
    author: item.username || "user",
    caption: item.caption || "",
    author_avatar: item.userProfilePic || "",
    verified: Boolean(
      item?.is_creator ||
        item?.verified ||
        item?.user?.verified ||
        item?.user?.isVerified
    ),
    likes: typeof item.likes_count === "number" ? item.likes_count : 0,
    comments: typeof item.comments_count === "number" ? item.comments_count : 0,
    videoUrl: typeof item.videoUrl === "string" ? item.videoUrl : undefined,
    thumb:
      typeof item.thumbUrl === "string"
        ? item.thumbUrl
        : typeof previewImage === "string"
          ? previewImage
          : undefined,
  };

  // like handlers with API integration
  const toggleLike = useCallback(async () => {
    if (!user?.id) {
      console.warn("User not authenticated");
      return;
    }

    const pid = String(item.id);
    // Check if post is currently liked from the derived state
    const isCurrentlyLiked =
      likedPostIDs.map(String).includes(pid) || Boolean(item?.liked);

    // Add vibration feedback
    Vibration.vibrate(100);

    // If parent provides handlers, use them (for home feed integration)
    if (toggleLikeHandler) {
      toggleLikeHandler(pid);
      return;
    }

    // Otherwise, handle locally with API call
    try {
      // Optimistically update local state
      const newLikeCount = likeCount + (isCurrentlyLiked ? -1 : 1);

      // Update parent if callback provided
      if (onUpdatePost) {
        onUpdatePost(pid, {
          liked: !isCurrentlyLiked,
          likes_count: newLikeCount,
        });
      }

      // Make API call
      const endpoint = isCurrentlyLiked
        ? `/api/likes/${pid}/${user.id}/unlike`
        : `/api/likes/${pid}/${user.id}/like`;

      await apiCall(endpoint, "POST");
    } catch (error) {
      console.error(`Error toggling like for post ${pid}:`, error);

      // Revert on error if callback provided
      if (onUpdatePost) {
        onUpdatePost(pid, {
          liked: isCurrentlyLiked,
          likes_count: likeCount,
        });
      }
    }
  }, [
    item.id,
    item.liked,
    user?.id,
    likedPostIDs,
    likeCount,
    toggleLikeHandler,
    onUpdatePost,
  ]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={() => onLongPress?.(item)}
      delayLongPress={500}
    >
      <View className="px-3 mt-2 bg-gray-100">
        <View
          style={{
            borderRadius: 16,
            elevation: Platform.OS === "android" ? 2 : 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          }}
        >
          <View
            className="bg-white py-3 gap-1.5"
            style={{ borderRadius: 16, overflow: "hidden" }}
          >
            {/* Header */}
            <View className="flex-row px-3 items-center h-10">
              {profilePostsMode ? (
                <View className="flex-row items-center flex-1 mr-2">
                  <Image
                    source={{ uri: item.userProfilePic }}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <View>
                    <View className="flex-row items-center">
                      <Text className="font-semibold text-lg">
                        {item.username}
                      </Text>
                      {Boolean(
                        item?.is_creator ||
                          item?.verified ||
                          item?.user?.verified ||
                          item?.user?.isVerified
                      ) && (
                        <Octicons
                          name="verified"
                          size={14}
                          color="#000"
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    {item.location && item.postDate && (
                      <View className="flex-row items-center">
                        {item.location && (
                          <Text className="text-xs text-[#257AF1] mr-2 font-opensans-regular">
                            {item.location}
                          </Text>
                        )}
                        <View className="w-1 h-1 rounded-full bg-black mr-1.5" />
                        {item.postDate && (
                          <Text className="text-xs text-black font-opensans-regular">
                            {item.postDate}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <GestureDetector gesture={openProfileTap}>
                  <TouchableOpacity
                    className="flex-row items-center flex-1 mr-2"
                    activeOpacity={0.7}
                    disabled={isGestureActive}
                  >
                    <Image
                      source={{ uri: item.userProfilePic }}
                      className="w-10 h-10 rounded-full mr-2"
                    />
                    <View>
                      <View className="flex-row items-center">
                        <Text className="font-semibold text-lg">
                          {item.username}
                        </Text>
                        {Boolean(
                          item?.is_creator ||
                            item?.verified ||
                            item?.user?.verified ||
                            item?.user?.isVerified
                        ) && (
                          <Octicons
                            name="verified"
                            size={14}
                            color="#000"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </View>
                      {item.location && item.postDate && (
                        <View className="flex-row items-center">
                          {item.location && (
                            <Text className="text-xs text-[#257AF1] mr-2 font-opensans-regular">
                              {item.location}
                            </Text>
                          )}
                          <View className="w-1 h-1 rounded-full bg-black mr-1.5" />
                          {item.postDate && (
                            <Text className="text-xs text-black font-opensans-regular">
                              {item.postDate}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </GestureDetector>
              )}
              {item.affiliated && item.affiliation && <View />}
            </View>

            {/* Media (single=viewer, double=toggle like via JS debounce + lock) */}
            <PostMedia
              media={item.postImage}
              isVisible={isVisible}
              postId={item.id}
              onLongPress={() => onLongPress?.(item)}
              isGestureActive={isGestureActive}
              panGesture={panGesture}
              onDoubleLike={toggleLike} // <<<<<< key: toggle on double tap
            />

            {/* (Optional) Affiliation card */}
            {item.affiliated && item.affiliation && (
              <GestureDetector gesture={openProductTap}>
                <TouchableOpacity
                  className="px-3"
                  onLongPress={() => onLongPress?.(item)}
                  delayLongPress={500}
                  disabled={isGestureActive}
                >
                  <View className="flex-row gap-x-3 rounded-lg border border-gray-200">
                    <View
                      className="basis-1/4 self-stretch relative"
                      style={{
                        borderTopLeftRadius: 6,
                        borderBottomLeftRadius: 6,
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        source={{ uri: item.affiliation.productImage }}
                        style={{ position: "absolute", inset: 0 as any }}
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-1 justify-between p-3">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row flex-1 items-center">
                          <Image
                            source={{ uri: item.affiliation.brandLogo }}
                            className="w-11 h-11 rounded-full mr-2"
                            resizeMode="contain"
                          />
                          <View className="flex-1">
                            <Text className="font-semibold text-sm text-gray-800">
                              {item.affiliation.brandName}
                            </Text>
                            <Text className="font-medium text-sm text-black">
                              {item.affiliation.productName}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          className="self-start"
                          disabled={isGestureActive}
                        >
                          <MaterialIcons
                            name="add-shopping-cart"
                            size={24}
                            color="#707070"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-sm text-gray-600 mb-2 leading-4">
                        {item.affiliation.productDescription}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-sm font-bold text-green-600 mr-2">
                          ₹{item.affiliation.productSalePrice}
                        </Text>
                        <Text className="text-sm text-gray-400 line-through">
                          ₹{item.affiliation.productRegularPrice}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </GestureDetector>
            )}

            {/* Caption */}
            <View>
              {(() => {
                const caption = item.caption || "";
                const captionLimit = 150;
                const shouldTruncate = caption.length > captionLimit;
                const displayCaption =
                  shouldTruncate && !showFullCaption
                    ? caption.substring(0, captionLimit)
                    : caption;

                // Handle caption tap with JS-based debounce (same as media)
                const CAPTION_DOUBLE_DELAY = 260;

                const handleCaptionTap = (singleTapAction?: () => void) => {
                  const now = Date.now();
                  const delta = now - (lastCaptionTapRef.current || 0);
                  lastCaptionTapRef.current = now;

                  if (captionTimerRef.current) {
                    clearTimeout(captionTimerRef.current);
                    captionTimerRef.current = null;
                  }

                  if (delta < CAPTION_DOUBLE_DELAY) {
                    // DOUBLE TAP on caption → toggle like
                    Vibration.vibrate(100);
                    toggleLike();
                    return;
                  }

                  // SINGLE TAP → execute single tap action if provided
                  if (singleTapAction) {
                    captionTimerRef.current = setTimeout(() => {
                      captionTimerRef.current = null;
                      singleTapAction();
                    }, CAPTION_DOUBLE_DELAY + 10);
                  }
                };

                return caption ? (
                  <View>
                    <Pressable
                      onPress={
                        isGestureActive ? undefined : () => handleCaptionTap()
                      }
                      onLongPress={openPostOptions}
                      delayLongPress={500}
                    >
                      <Text className="text-sm px-3 text-gray-900">
                        {displayCaption
                          .split(/((?:@|#)[\w.]+|(?:https?:\/\/|www\.)\S+)/gi)
                          .map((part: string, index: number) => {
                            if (part && part.startsWith("@")) {
                              return (
                                <Text
                                  key={`cap-mention-${index}`}
                                  className="text-blue-600"
                                  suppressHighlighting
                                  onPress={
                                    isGestureActive
                                      ? undefined
                                      : (e) => {
                                          e.stopPropagation();
                                          handleCaptionTap(() =>
                                            router.push({
                                              pathname: "/(profiles)/" as any,
                                              params: {
                                                username: part.slice(1),
                                              },
                                            })
                                          );
                                        }
                                  }
                                  onLongPress={openPostOptions}
                                >
                                  {part}
                                </Text>
                              );
                            }
                            if (part && part.startsWith("#")) {
                              return (
                                <Text
                                  key={`cap-hash-${index}`}
                                  className="text-blue-600"
                                  suppressHighlighting
                                  onPress={
                                    isGestureActive
                                      ? undefined
                                      : (e) => {
                                          e.stopPropagation();
                                          handleCaptionTap(() =>
                                            router.push({
                                              pathname:
                                                "/(search)/tagPostSearch" as any,
                                              params: { tag: part },
                                            })
                                          );
                                        }
                                  }
                                  onLongPress={openPostOptions}
                                >
                                  {part}
                                </Text>
                              );
                            }
                            if (part && /^(https?:\/\/|www\.)/i.test(part)) {
                              const url = part.startsWith("www.")
                                ? `https://${part}`
                                : part;
                              return (
                                <Text
                                  key={`cap-link-${index}`}
                                  className="text-blue-600 underline"
                                  suppressHighlighting
                                  onPress={
                                    isGestureActive
                                      ? undefined
                                      : (e) => {
                                          e.stopPropagation();
                                          handleCaptionTap(() =>
                                            Linking.openURL(url)
                                          );
                                        }
                                  }
                                  onLongPress={openPostOptions}
                                >
                                  {part}
                                </Text>
                              );
                            }
                            return (
                              <Text
                                key={`cap-plain-${index}`}
                                className="text-gray-900"
                              >
                                {part}
                              </Text>
                            );
                          })}
                      </Text>
                    </Pressable>

                    {shouldTruncate && !showFullCaption && (
                      <Pressable
                        onPress={
                          isGestureActive
                            ? undefined
                            : () => setShowFullCaption(true)
                        }
                        hitSlop={8}
                        style={{ marginLeft: 2, alignSelf: "baseline" }}
                        onLongPress={openPostOptions}
                        delayLongPress={500}
                      >
                        <Text className="text-sm text-gray-500 px-3 font-medium">
                          Show more
                        </Text>
                      </Pressable>
                    )}

                    {shouldTruncate && showFullCaption && (
                      <Pressable
                        onPress={
                          isGestureActive
                            ? undefined
                            : () => setShowFullCaption(false)
                        }
                        hitSlop={8}
                        style={{ marginLeft: 2, alignSelf: "baseline" }}
                        onLongPress={openPostOptions}
                        delayLongPress={500}
                      >
                        <Text className="text-sm text-gray-500 px-3 font-medium">
                          Show less
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ) : null;
              })()}

              {/* {item?.post_hashtags?.length ? (
                <Text className="text-blue-600 mt-1 px-3">
                  {neededHashtags.map((tag: string, i: number) => (
                    <Text
                      key={`hash-${tag}`}
                      onPress={
                        isGestureActive
                          ? undefined
                          : () =>
                              router.push({
                                pathname: "/(search)/tagPostSearch" as any,
                                params: { tag: "#" + tag },
                              })
                      }
                    >
                      #{tag}
                      {i < neededHashtags.length - 1 ? <Text> </Text> : null}
                    </Text>
                  ))}
                </Text>
              ) : null} */}
            </View>

            {/* Actions */}
            <View className="px-3">
              <View className="flex-row items-center gap-x-2">
                {/* Like */}
                <TouchableOpacity
                  className="flex-row items-center"
                  disabled={isGestureActive}
                  onPress={toggleLike}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={20}
                    color={liked ? "#ff3b30" : "#000"}
                  />
                  <Text className="ml-1 text-sm font-medium">{likeCount}</Text>
                </TouchableOpacity>

                {/* Comment */}
                <TouchableOpacity
                  className="flex-row items-center"
                  disabled={isGestureActive}
                  onPress={
                    isGestureActive ? undefined : () => onPressComments?.(item)
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#000" />
                  <Text className="ml-1 text-sm font-medium">
                    {item.comments_count}
                  </Text>
                </TouchableOpacity>

                {/* Share */}
                <TouchableOpacity
                  disabled={isGestureActive}
                  onPress={() => setShareOpen(true)}
                  // onPress={() => setStatusOpen(true)}
                  activeOpacity={0.8}
                  className="flex-row items-center"
                >
                  {/* wrapper lets us rotate + offset without affecting layout */}
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      justifyContent: "center",

                      // fine-tune here:
                      transform: [{ rotate: "15deg" }], // tilt to the right
                    }}
                  >
                    <Send
                      width={18}
                      height={18}
                      stroke="#262626"
                      strokeWidth={1.6}
                      fill="none"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Share sheet */}
      <ShareSectionBottomSheet
        show={shareOpen}
        setShow={setShareOpen}
        users={item?.shareUsers || []}
        postId={item.id}
        postPreview={postPreview}
        initialHeightPct={0.4}
        maxHeightPct={0.9}
        maxSelect={5}
      />
      <StatusModal
        visible={statusOpen}
        onClose={() => setStatusOpen(false)}
        showImage={false}
        showHeading={false}
        showDescription={true}
        description="Share feature is not available right now it will be available soon"
        showButton={false}
      />

      <StatusModal
        visible={ecommerceStatusOpen}
        onClose={() => setEcommerceStatusOpen(false)}
        showImage={false}
        showHeading={false}
        showDescription={true}
        description="E-commerce feature is not available right now it will be available soon"
        showButton={false}
      />
    </TouchableOpacity>
  );
};
