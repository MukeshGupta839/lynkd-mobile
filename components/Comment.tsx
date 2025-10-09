// components/CommentsSheet.tsx
import { useKeyboardVisibleReanimated } from "@/hooks/useKeyboardVisibleReanimated";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
  type BottomSheetModalProps,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { KeyboardState } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: screenHeight } = Dimensions.get("window");

export type CommentsSheetHandle = { present: () => void; dismiss: () => void };

type EdgeInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type CommentsSheetProps = Omit<
  BottomSheetModalProps,
  "ref" | "children"
> & {
  title?: string;
  showHandle?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  // optional controlled input (if you still want to sync elsewhere)
  typedComment?: string;
  setTypedComment?: (v: string) => void;
  onSendComment?: (text: string) => void;
  currentUserAvatar?: string;
  // API integration props
  comments?: CommentItem[]; // Pass comments from API
  postId?: string; // Current post ID
  onFetchComments?: (postId: string) => Promise<void>; // Fetch comments callback
};

type CommentItem = {
  id: number;
  userId: number;
  comment: string;
  username: string;
  userImage: string;
  time: string;
  likes: number;
};

// --- Dummy comments ---
const comments: CommentItem[] = [
  {
    id: 1,
    userId: 101,
    comment: "This is amazing! Great work!",
    username: "john.doe",
    userImage: "https://randomuser.me/api/portraits/men/40.jpg",
    time: "1 hour ago",
    likes: 10,
  },
  {
    id: 2,
    userId: 102,
    comment: "Absolutely stunning view!...",
    username: "Jane.smith",
    userImage: "https://randomuser.me/api/portraits/women/45.jpg",
    time: "3 hours ago",
    likes: 8,
  },
  {
    id: 3,
    userId: 103,
    comment: "I love the colors in this picture!...",
    username: "Alex.jones",
    userImage: "https://randomuser.me/api/portraits/men/50.jpg",
    time: "1 day ago",
    likes: 15,
  },
  {
    id: 4,
    userId: 104,
    comment: "This is breathtaking. Well done!...",
    username: "Emily.davis",
    userImage: "https://randomuser.me/api/portraits/women/30.jpg",
    time: "2 days ago",
    likes: 12,
  },
  {
    id: 5,
    userId: 105,
    comment: "Such a peaceful place. Great shot!...",
    username: "Michael.brown",
    userImage: "https://randomuser.me/api/portraits/men/60.jpg",
    time: "3 days ago",
    likes: 5,
  },
  {
    id: 6,
    userId: 106,
    comment: "Wow, this is incredible!...",
    username: "Sarah.miller",
    userImage: "https://randomuser.me/api/portraits/women/35.jpg",
    time: "5 hours ago",
    likes: 20,
  },
  {
    id: 7,
    userId: 107,
    comment: "The lighting is perfect here.",
    username: "Daniel.taylor",
    userImage: "https://randomuser.me/api/portraits/men/55.jpg",
    time: "6 hours ago",
    likes: 18,
  },
  {
    id: 8,
    userId: 108,
    comment: "Such a unique perspective!",
    username: "Olivia.anderson",
    userImage: "https://randomuser.me/api/portraits/women/40.jpg",
    time: "1 day ago",
    likes: 22,
  },
  {
    id: 9,
    userId: 109,
    comment: "This reminds me of my last vacation.",
    username: "Matthew.white",
    userImage: "https://randomuser.me/api/portraits/men/65.jpg",
    time: "2 days ago",
    likes: 14,
  },
  {
    id: 10,
    userId: 110,
    comment: "The composition is excellent!",
    username: "Isabella.johnson",
    userImage: "https://randomuser.me/api/portraits/women/50.jpg",
    time: "2 days ago",
    likes: 25,
  },
  {
    id: 11,
    userId: 111,
    comment: "Love the contrast in this photo.",
    username: "Ethan.martin",
    userImage: "https://randomuser.me/api/portraits/men/45.jpg",
    time: "3 days ago",
    likes: 17,
  },
  {
    id: 12,
    userId: 112,
    comment: "This shot is simply amazing!",
    username: "Sophia.lee",
    userImage: "https://randomuser.me/api/portraits/women/60.jpg",
    time: "4 days ago",
    likes: 30,
  },
  {
    id: 13,
    userId: 113,
    comment: "Great use of natural light.",
    username: "James.harris",
    userImage: "https://randomuser.me/api/portraits/men/75.jpg",
    time: "4 days ago",
    likes: 13,
  },
  {
    id: 14,
    userId: 114,
    comment:
      "Such a serene image. Such a serene image. Such a serene image. Such a serene image. Such a serene image. Such a serene image. Such a serene image. Such a serene image. Such a serene image. Such a serene image. Such a serene image.",
    username: "Ava.carter",
    userImage: "https://randomuser.me/api/portraits/women/55.jpg",
    time: "5 days ago",
    likes: 19,
  },
  {
    id: 15,
    userId: 115,
    comment: "This photo has a calming effect.",
    username: "Liam.walker",
    userImage: "https://randomuser.me/api/portraits/men/85.jpg",
    time: "6 days ago",
    likes: 16,
  },
];

const NullHandle: BottomSheetModalProps["handleComponent"] = () => null;

const FOOTER_HEIGHT = 54;

const CommentsFooter = memo(function CommentsFooter({
  animatedFooterPosition,
  bottomInset,
  onSend,
  onLayoutHeight,
}: BottomSheetFooterProps & {
  bottomInset: EdgeInsets;
  onSend?: (t: string) => void;
  onLayoutHeight?: (h: number) => void;
}) {
  const [text, setText] = useState("");
  const { state } = useKeyboardVisibleReanimated({
    includeOpening: true,
    minHeight: 1,
  });

  const isKeyboardUp =
    state === KeyboardState.OPEN || state === KeyboardState.OPENING;

  const handleSend = useCallback(() => {
    const t = text.trim();
    if (!t) return;
    onSend?.(t);
    setText("");
  }, [text, onSend]);

  return (
    <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
      <View
        onLayout={(e) => onLayoutHeight?.(e.nativeEvent.layout.height)}
        className="flex-row gap-2 items-center bg-white border-t border-gray-200 px-3"
        style={{
          paddingTop: 12,
          paddingBottom: !isKeyboardUp
            ? Platform.OS === "ios"
              ? bottomInset.bottom - 10
              : bottomInset.bottom
            : 12,
          minHeight: FOOTER_HEIGHT,
        }}
      >
        <BottomSheetTextInput
          placeholder="Reply"
          value={text}
          onChangeText={setText}
          multiline
          scrollEnabled
          textAlignVertical="center"
          submitBehavior="newline"
          className="flex-1"
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 20,
            backgroundColor: "#fff",
            fontSize: 14,
            maxHeight: 80,
            minHeight: 40,
          }}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!text.trim()}
          style={{
            opacity: !text.trim() ? 0.5 : 1,
          }}
          className="items-center justify-center bg-black px-4 py-2.5 rounded-full"
        >
          <Text className="text-white font-opensans-semibold text-sm">
            Reply
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetFooter>
  );
});

const CommentsSheet = forwardRef<CommentsSheetHandle, CommentsSheetProps>(
  (
    {
      snapPoints = [
        screenHeight * 0.5,
        screenHeight * 0.75,
        screenHeight * 0.9,
      ],
      index = 0,
      enablePanDownToClose = true,
      backdropComponent,
      handleComponent,
      handleIndicatorStyle = { backgroundColor: "#cfd2d7" },
      backgroundStyle = { backgroundColor: "#fff" },
      topInset = Platform.OS === "ios" ? 16 : 0,
      title = "Comments",
      showHandle = true,
      contentContainerStyle,
      typedComment,
      setTypedComment,
      onSendComment,
      currentUserAvatar,
      // API integration props
      comments: commentsFromProps,
      postId,
      onFetchComments,
      ...rest
    },
    ref
  ) => {
    const modalRef = useRef<BottomSheetModalType>(null);
    const insets = useSafeAreaInsets();
    const [footerHeight, setFooterHeight] = useState(FOOTER_HEIGHT);

    // Use comments from props if provided, otherwise use dummy data
    const displayComments = commentsFromProps || comments;

    useImperativeHandle(ref, () => ({
      present: () => {
        modalRef.current?.present();
        // Don't fetch here - let the parent handle fetching before calling present()
      },
      dismiss: () => modalRef.current?.dismiss(),
    }));

    const DefaultBackdrop = (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    );

    const memoSnapPoints = useMemo<(string | number)[]>(
      () => snapPoints as (string | number)[],
      [snapPoints]
    );

    const keyExtractor = useCallback(
      (item: CommentItem) => String(item.id),
      []
    );

    const CommentRow = memo(({ item }: { item: CommentItem }) => {
      const [liked, setLiked] = useState(false);
      return (
        <View className="flex-row items-start py-2 px-3">
          <Image
            source={{ uri: item.userImage }}
            className="w-[38px] h-[38px] rounded-full mr-2.5"
          />
          <View className="flex-1">
            <View className="flex-row items-center mb-0.5">
              <Text className="text-sm text-black font-opensans-semibold">
                {item.username}
              </Text>
              <Text className="text-gray-400 text-sm mx-1 font-opensans-regular">
                ·
              </Text>
              <Text className="text-sm text-gray-400 font-opensans-regular">
                {item.time}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 font-opensans-regular mt-0.5">
              {item.comment}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setLiked((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="px-1 self-end"
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? "#e74c3c" : "#687684"}
            />
          </TouchableOpacity>
        </View>
      );
    });
    CommentRow.displayName = "CommentRow";

    const renderItem = useCallback(
      ({ item }: { item: CommentItem }) => <CommentRow item={item} />,
      [CommentRow]
    );

    // Parent send handler (still works; footer keeps its own text)
    const handleSendFromFooter = useCallback(
      (t: string) => {
        onSendComment?.(t);
      },
      [onSendComment]
    );

    // footerComponent must be STABLE (no deps that change on keystrokes)
    const renderFooter = useCallback(
      (footerProps: BottomSheetFooterProps) => (
        <CommentsFooter
          {...footerProps}
          onSend={handleSendFromFooter}
          bottomInset={insets}
          onLayoutHeight={setFooterHeight}
        />
      ),
      [handleSendFromFooter, insets]
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        index={index}
        snapPoints={memoSnapPoints}
        enablePanDownToClose={enablePanDownToClose}
        topInset={topInset}
        backdropComponent={backdropComponent ?? DefaultBackdrop}
        handleComponent={showHandle ? handleComponent : NullHandle}
        handleIndicatorStyle={handleIndicatorStyle}
        backgroundStyle={backgroundStyle}
        enableDynamicSizing={false}
        enableOverDrag={false}
        enableContentPanningGesture={false}
        enableHandlePanningGesture
        // ✅ v5 keyboard handling props
        keyboardBehavior="extend"
        keyboardBlurBehavior="none" // keep focus while layout changes
        enableDismissOnClose
        footerComponent={renderFooter}
        {...rest}
      >
        <BottomSheetFlatList
          data={displayComments}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          className="flex-1"
          ListHeaderComponent={
            <View>
              <View className="px-3 pb-2 items-center justify-center">
                <Text className="text-lg font-opensans-semibold text-black">
                  {title}
                </Text>
              </View>
              <View className="h-px bg-gray-200" />
            </View>
          }
          ListEmptyComponent={
            <View
              style={{
                height: screenHeight * 0.3,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text className="text-gray-400 font-opensans-regular text-base mt-3">
                No comments available
              </Text>
            </View>
          }
          contentContainerStyle={[
            {
              paddingBottom: footerHeight,
              flexGrow: 1,
            },
            contentContainerStyle as any,
          ]}
          ItemSeparatorComponent={() => <View className="h-2" />}
          showsVerticalScrollIndicator
          nestedScrollEnabled
          bounces
          overScrollMode="auto"
        />
      </BottomSheetModal>
    );
  }
);

CommentsSheet.displayName = "CommentsSheet";
export default CommentsSheet;
