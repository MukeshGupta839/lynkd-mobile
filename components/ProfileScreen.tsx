import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Icons
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Octicons from "@expo/vector-icons/Octicons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";

// Components
import TextPost from "./TextPost";

const { width } = Dimensions.get("window");

interface UserDetails {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_picture?: string;
  banner_image?: string;
  is_creator: boolean;
  postsCount: number;
  reelsCount: number;
  followersCount: number;
  followingCount: number;
  social_media_accounts?: {
    instagram_username?: string;
    twitter_username?: string;
    youtube_username?: string;
  }[];
}

interface ProfileScreenProps {
  userId?: number;
  username?: string;
  fetchUserDetails?: (
    userId: number,
    username?: string
  ) => Promise<UserDetails>;
  fetchUserPosts?: (userId: number) => Promise<any[]>;
  fetchUserReels?: (userId: number) => Promise<any[]>;
  fetchUserProducts?: (userId: number) => Promise<any[]>;
  onFollow?: (userId: number) => Promise<void>;
  onUnfollow?: (userId: number) => Promise<void>;
  checkFollowStatus?: (userId: number) => Promise<string | null>;
  currentUserId?: number;
}

const ProfileScreen = ({
  userId: propUserId,
  username: propUsername,
  fetchUserDetails,
  fetchUserPosts,
  fetchUserReels,
  fetchUserProducts,
  onFollow,
  onUnfollow,
  checkFollowStatus,
  currentUserId,
}: ProfileScreenProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Mock user data - replace with your actual user context
  const currentUser = {
    id: currentUserId || 1,
    username: "current_user",
    profile_picture: "https://randomuser.me/api/portraits/men/1.jpg",
  };

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([
    // March 2024
    {
      id: 1,
      media_url: "https://picsum.photos/400/400?random=1",
      text_post: false,
      created_at: "2024-03-28",
      username: "john_doe",
    },
    {
      id: 2,
      media_url: "https://picsum.photos/400/400?random=2",
      text_post: false,
      created_at: "2024-03-25",
      username: "john_doe",
    },

    // February 2024
    {
      id: 8,
      media_url: "https://picsum.photos/400/400?random=6",
      text_post: false,
      created_at: "2024-02-28",
      username: "john_doe",
    },
    {
      id: 9,
      media_url: "https://picsum.photos/400/400?random=7",
      text_post: false,
      created_at: "2024-02-25",
      username: "john_doe",
    },
    {
      id: 10,
      media_url: "https://picsum.photos/400/400?random=8",
      text_post: false,
      created_at: "2024-02-22",
      username: "john_doe",
    },
    {
      id: 11,
      media_url: "https://picsum.photos/400/400?random=9",
      text_post: false,
      created_at: "2024-02-20",
      username: "john_doe",
    },
    {
      id: 12,
      text_post: true,
      caption:
        "Happy Valentine's Day! ❤️ Spreading love and positivity to everyone. What are you grateful for today?",
      created_at: "2024-02-14",
      post_hashtags: [
        "love",
        "valentinesday",
        "positivity",
        "grateful",
        "happiness",
      ],
      username: "john_doe",
      userProfilePic: "https://randomuser.me/api/portraits/men/1.jpg",
      is_creator: true,
      likes_count: 45,
      comments_count: 12,
    },
    {
      id: 13,
      media_url: "https://picsum.photos/400/400?random=10",
      text_post: false,
      created_at: "2024-02-10",
      username: "john_doe",
    },
    {
      id: 14,
      media_url: "https://picsum.photos/400/400?random=11",
      text_post: false,
      created_at: "2024-02-08",
      username: "john_doe",
    },
    {
      id: 15,
      text_post: true,
      caption:
        "Coffee and creativity ☕ Starting the day with fresh ideas and positive energy. What inspires you?",
      created_at: "2024-02-05",
      post_hashtags: [
        "coffee",
        "creativity",
        "inspiration",
        "morning",
        "energy",
      ],
      username: "john_doe",
      userProfilePic: "https://randomuser.me/api/portraits/men/1.jpg",
      is_creator: true,
      likes_count: 38,
      comments_count: 8,
      affiliated: true,
      affiliation: {
        productID: 101,
        brandName: "BrewMaster",
        brandLogo: "https://picsum.photos/100/100?random=20",
        productName: "Premium Coffee Beans",
        productImage: "https://picsum.photos/300/300?random=21",
        productDescription:
          "Freshly roasted premium coffee beans sourced from the best coffee farms around the world. Perfect for starting your creative morning with rich, aromatic flavor.",
        productRegularPrice: 899,
        productSalePrice: 649,
      },
    },

    // January 2024
    {
      id: 16,
      media_url: "https://picsum.photos/400/400?random=12",
      text_post: false,
      created_at: "2024-01-30",
      username: "john_doe",
    },
    {
      id: 17,
      media_url: "https://picsum.photos/400/400?random=13",
      text_post: false,
      created_at: "2024-01-28",
      username: "john_doe",
    },
    {
      id: 18,
      media_url: "https://picsum.photos/400/400?random=14",
      text_post: false,
      created_at: "2024-01-25",
      username: "john_doe",
    },
    {
      id: 19,
      text_post: true,
      caption:
        "New year, new adventures! 🎉 Already making progress on my 2024 goals. What's on your bucket list this year?",
      created_at: "2024-01-20",
      post_hashtags: [
        "newyear",
        "goals",
        "adventure",
        "2024",
        "motivation",
        "bucketlist",
      ],
      username: "john_doe",
      userProfilePic: "https://randomuser.me/api/portraits/men/1.jpg",
      is_creator: true,
      likes_count: 67,
      comments_count: 23,
    },
    {
      id: 20,
      media_url: "https://picsum.photos/400/400?random=15",
      text_post: false,
      created_at: "2024-01-15",
      username: "john_doe",
    },
    {
      id: 21,
      media_url: "https://picsum.photos/400/400?random=16",
      text_post: false,
      created_at: "2024-01-12",
      username: "john_doe",
    },
    {
      id: 22,
      text_post: true,
      caption:
        "Weekend vibes! 🌅 Sometimes the best moments are the quiet ones. Taking time to appreciate the little things.",
      created_at: "2024-01-08",
      post_hashtags: ["weekend", "vibes", "mindfulness", "grateful", "peace"],
      username: "john_doe",
      userProfilePic: "https://randomuser.me/api/portraits/men/1.jpg",
      is_creator: true,
      likes_count: 52,
      comments_count: 15,
    },
    {
      id: 23,
      media_url: "https://picsum.photos/400/400?random=17",
      text_post: false,
      created_at: "2024-01-05",
      username: "john_doe",
    },
    {
      id: 24,
      text_post: true,
      caption:
        "Fresh start, fresh mindset! 💫 Ready to make 2024 the best year yet. Here's to new beginnings!",
      created_at: "2024-01-01",
      post_hashtags: [
        "freshstart",
        "mindset",
        "2024",
        "newbeginnings",
        "motivation",
      ],
      username: "john_doe",
      userProfilePic: "https://randomuser.me/api/portraits/men/1.jpg",
      is_creator: true,
      likes_count: 89,
      comments_count: 34,
    },
  ]);
  const [userReels, setUserReels] = useState([
    {
      id: 1,
      thumbnail_url: "https://picsum.photos/400/600?random=4",
      reels_views_aggregate: { aggregate: { count: 1250 } },
    },
    {
      id: 2,
      thumbnail_url: "https://picsum.photos/400/600?random=5",
      reels_views_aggregate: { aggregate: { count: 3400 } },
    },
    {
      id: 3,
      thumbnail_url: "https://picsum.photos/400/600?random=5",
      reels_views_aggregate: { aggregate: { count: 3400 } },
    },
  ]);
  const [productsAffiliated, setProductsAffiliated] = useState([
    {
      id: 1,
      name: "Wireless Headphones",
      main_image: "https://picsum.photos/300/300?random=6",
      sale_price: 2999,
    },
    {
      id: 2,
      name: "Smartphone Case",
      main_image: "https://picsum.photos/300/300?random=7",
      sale_price: 799,
    },
  ]);
  const [userID, setUserID] = useState(
    propUserId ||
      (params.user
        ? Number(Array.isArray(params.user) ? params.user[0] : params.user) ||
          currentUser.id
        : currentUser.id)
  );
  const [following, setFollowing] = useState("");
  const [bioExpanded, setBioExpanded] = useState(false);

  // Function to format numbers (e.g., 1000 -> 1k)
  const kFormatter = (num: number): string => {
    if (Math.abs(num) > 999999999) {
      return (Math.sign(num) * (Math.abs(num) / 1000000000)).toFixed(1) + "B";
    } else if (Math.abs(num) > 999999) {
      return (Math.sign(num) * (Math.abs(num) / 1000000)).toFixed(1) + "M";
    } else if (Math.abs(num) > 999) {
      return (Math.sign(num) * (Math.abs(num) / 1000)).toFixed(1) + "K";
    } else {
      return (Math.sign(num) * Math.abs(num)).toString();
    }
  };

  // Fetch user details and data
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        let actualUserId = userID;
        const mentionedUsername = propUsername || (params.username as string);

        console.log("ProfileScreen loadUserData:", {
          propUserId,
          propUsername,
          userID,
          actualUserId,
          mentionedUsername,
          "currentUser.id": currentUser.id,
          "params.user": params.user,
          "params.username": params.username,
        });

        // If we have a username but no valid userId was passed, fetch user details first to get the userId
        // This happens when navigating with only username (no userId in params)
        const hasValidUserId = propUserId && propUserId !== currentUser.id;
        const needsUserIdResolution =
          mentionedUsername && !hasValidUserId && fetchUserDetails;

        console.log("Resolution check:", {
          hasValidUserId,
          needsUserIdResolution,
        });

        if (needsUserIdResolution) {
          console.log(
            "Fetching user details from username:",
            mentionedUsername
          );
          const details = await fetchUserDetails(
            actualUserId,
            mentionedUsername
          );
          setUserDetails(details);

          // Update the userID state with the fetched user's ID
          if (details.id && details.id !== actualUserId) {
            actualUserId = details.id;
            setUserID(details.id);
            console.log("Updated userID from username fetch:", details.id);
          }
        } else {
          // Fetch user details normally
          if (fetchUserDetails) {
            const details = await fetchUserDetails(
              actualUserId,
              mentionedUsername
            );
            setUserDetails(details);
          } else {
            // Mock data fallback
            setUserDetails({
              id: actualUserId,
              username: mentionedUsername || "john_doe",
              first_name: "John",
              last_name: "Doe",
              bio: "Photography enthusiast • Travel lover • Coffee addict ☕️ ssfsfs sffsfsf sffssfsf sfsfsfs sfsf sfsf sf sf sfsf sfsfsfs sfsf swrwrw wrwrwrwrw wwr wr wwrw wrwrwrrw wr wrwrwr wr wr wqahlskhlfkhashlf hahs ahfslkfh lkfhl akfhslksjhfalksfjh lakshf h afsakhflkfhlskhlak hasf hlakfh. fhashlffhfasl ",
              profile_picture: "https://randomuser.me/api/portraits/men/1.jpg",
              banner_image:
                "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg",
              is_creator: true,
              postsCount: 12,
              reelsCount: 5,
              followersCount: 1250,
              followingCount: 890,
              social_media_accounts: [
                {
                  instagram_username: "john_doe_photo",
                  twitter_username: "johndoe",
                  youtube_username: "johndoevlogs",
                },
              ],
            });
          }
        }

        // Now use the actual user ID for all subsequent API calls
        // Fetch user posts
        if (fetchUserPosts) {
          const userPosts = await fetchUserPosts(actualUserId);
          console.log("Loaded posts:", userPosts.length);
          console.log("Sample post:", userPosts[0]);
          setPosts(userPosts);
        }

        // Fetch user reels
        if (fetchUserReels) {
          const reels = await fetchUserReels(actualUserId);
          setUserReels(reels);
        }

        // Fetch user products
        if (fetchUserProducts) {
          const products = await fetchUserProducts(actualUserId);
          setProductsAffiliated(products);
        }

        // Check follow status if this is not the current user's profile
        if (checkFollowStatus && actualUserId !== currentUser.id) {
          const status = await checkFollowStatus(actualUserId);
          if (status) {
            setFollowing(status);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [
    propUserId,
    propUsername,
    params.username,
    fetchUserDetails,
    fetchUserPosts,
    fetchUserReels,
    fetchUserProducts,
    checkFollowStatus,
    userID,
    params.user,
    currentUser.id,
  ]);

  const toggleFollow = async () => {
    try {
      if (following === "followed") {
        // Unfollow
        if (onUnfollow) {
          await onUnfollow(userID);
        }
        setFollowing("");
      } else {
        // Follow
        if (onFollow) {
          await onFollow(userID);
        }
        setFollowing("followed");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleOpenSheet = async (label: string) => {
    console.log("Opening sheet for:", label);
  };

  const stats = [
    {
      label: "Posts",
      value: (userDetails?.postsCount || 0) + (userDetails?.reelsCount || 0),
    },
    { label: "Followers", value: userDetails?.followersCount || 0 },
    { label: "Following", value: userDetails?.followingCount || 0 },
  ];

  const tabs = userDetails?.is_creator
    ? ["All", "Photos", "Videos", "Notes", " "]
    : ["All", "Photos", "Videos", "Notes"];

  const renderGridLayout = () => {
    const groupedImages: { [key: string]: any[] } = {};
    const months: string[] = [];

    // Filter for posts with images (not text posts) and valid media_url
    const filteredPosts = posts.filter(
      (post) => post.text_post !== true && post.media_url
    );

    console.log("renderGridLayout - Total posts:", posts.length);
    console.log("renderGridLayout - Filtered posts:", filteredPosts.length);
    console.log("renderGridLayout - First post:", posts[0]);

    if (filteredPosts.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Feather name="image" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No posts yet. Content shared will appear here.
          </Text>
        </View>
      );
    }

    filteredPosts.forEach((image) => {
      const month = new Date(image.created_at).toLocaleString("default", {
        month: "long",
      });
      const year = new Date(image.created_at).getFullYear();
      const key = month + " " + year;

      if (!groupedImages[key]) {
        groupedImages[key] = [];
        months.push(key);
      }
      groupedImages[key].push(image);
    });

    // Calculate responsive dimensions for small screens
    const containerWidth = width - 32; // Account for horizontal padding
    const gap = 4;
    const imageHeight = Math.min(220, containerWidth * 0.6); // Responsive height with max limit

    return (
      <View>
        {Object.entries(groupedImages).map(([date, dateImages]) => (
          <View key={date} className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              {date}
            </Text>
            <View className="w-full">
              {/* Single image - full width */}
              {dateImages.length === 1 && (
                <TouchableOpacity
                  className="w-full rounded-xl overflow-hidden"
                  style={{ height: imageHeight }}
                  onPress={() => {
                    router.push({
                      pathname: "/(profiles)/profilePosts",
                      params: {
                        posts: JSON.stringify(posts),
                        focusedIndexPost: dateImages[0].id,
                      },
                    });
                  }}
                >
                  <Image
                    source={{ uri: dateImages[0].media_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                    onError={(error) => {
                      console.log(
                        "renderGridLayout image load error:",
                        error.nativeEvent.error
                      );
                    }}
                    onLoad={() => {
                      console.log("renderGridLayout image loaded successfully");
                    }}
                  />
                </TouchableOpacity>
              )}

              {/* Two images - side by side with equal width */}
              {dateImages.length === 2 && (
                <View className="flex-row justify-between">
                  {dateImages.map((image, index) => (
                    <TouchableOpacity
                      key={image.id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        width: (containerWidth - gap) / 2,
                        height: imageHeight * 0.8, // Slightly shorter for better proportion
                      }}
                      onPress={() => {
                        router.push({
                          pathname: "/(profiles)/profilePosts",
                          params: {
                            posts: JSON.stringify(posts),
                            focusedIndexPost: image.id,
                          },
                        });
                      }}
                    >
                      <Image
                        source={{ uri: image.media_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                        onError={(error) => {
                          console.log(
                            "renderGridLayout image load error:",
                            error.nativeEvent.error
                          );
                        }}
                        onLoad={() => {
                          console.log(
                            "renderGridLayout image loaded successfully"
                          );
                        }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Three images - one large on left, two stacked on right */}
              {dateImages.length === 3 && (
                <View className="flex-row" style={{ gap: gap }}>
                  {/* Large image on left */}
                  <TouchableOpacity
                    className="rounded-xl overflow-hidden"
                    style={{
                      width: (containerWidth - gap) * 0.6,
                      height: imageHeight,
                    }}
                    onPress={() => {
                      router.push({
                        pathname: "/(profiles)/profilePosts",
                        params: {
                          posts: JSON.stringify(posts),
                          focusedIndexPost: dateImages[0].id,
                        },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: dateImages[0].media_url }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Two smaller images stacked on right */}
                  <View className="flex-1" style={{ gap: gap }}>
                    {dateImages.slice(1, 3).map((image) => (
                      <TouchableOpacity
                        key={image.id}
                        className="rounded-xl overflow-hidden"
                        style={{
                          height: (imageHeight - gap) / 2,
                        }}
                        onPress={() => {
                          router.push({
                            pathname: "/(profiles)/profilePosts",
                            params: {
                              posts: JSON.stringify(posts),
                              focusedIndexPost: image.id,
                            },
                          });
                        }}
                      >
                        <Image
                          source={{ uri: image.media_url }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Four or more images - one large on top, three small below */}
              {dateImages.length >= 4 && (
                <View>
                  {/* Large featured image */}
                  <TouchableOpacity
                    className="w-full rounded-xl overflow-hidden mb-1"
                    style={{ height: imageHeight }}
                    onPress={() => {
                      router.push({
                        pathname: "/(profiles)/profilePosts",
                        params: {
                          posts: JSON.stringify(posts),
                          focusedIndexPost: dateImages[0].id,
                        },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: dateImages[0].media_url }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>

                  {/* Three images in a row below */}
                  <View className="flex-row justify-between">
                    {dateImages.slice(1, 4).map((image, index) => (
                      <TouchableOpacity
                        key={image.id}
                        className="rounded-xl overflow-hidden relative"
                        style={{
                          width: (containerWidth - gap * 2) / 3,
                          height: (containerWidth - gap * 2) / 3,
                        }}
                        onPress={() => {
                          router.push({
                            pathname: "/(profiles)/profilePosts",
                            params: {
                              posts: JSON.stringify(posts),
                              focusedIndexPost: image.id,
                            },
                          });
                        }}
                      >
                        <Image
                          source={{ uri: image.media_url }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="cover"
                        />
                        {/* Show overlay on last image if there are more */}
                        {index === 2 && dateImages.length > 4 && (
                          <View className="absolute inset-0 bg-black/60 justify-center items-center">
                            <Text className="text-white text-lg font-bold">
                              +{dateImages.length - 4}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSquareGrid = () => {
    // Filter for posts with images (not text posts) and valid media_url
    const filteredPosts = posts.filter(
      (post) => post.text_post !== true && post.media_url
    );

    console.log("renderSquareGrid - Total posts:", posts.length);
    console.log("renderSquareGrid - Filtered posts:", filteredPosts.length);

    if (filteredPosts.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Feather name="image" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No photos yet. Photos shared will appear here.
          </Text>
        </View>
      );
    }

    // Calculate responsive dimensions
    const containerWidth = width - 32; // Account for horizontal padding
    const gap = 2;
    const imageSize = (containerWidth - gap * 2) / 3; // 3 images per row with gaps

    // Group images into rows of 3
    const rows = [];
    for (let i = 0; i < filteredPosts.length; i += 3) {
      rows.push(filteredPosts.slice(i, i + 3));
    }

    return (
      <View>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row mb-1" style={{ gap: gap }}>
            {row.map((image, imageIndex) => (
              <TouchableOpacity
                key={image.id}
                className="rounded-xl overflow-hidden"
                style={{
                  width: imageSize,
                  height: imageSize,
                }}
                onPress={() => {
                  router.push({
                    pathname: "/(profiles)/profilePosts",
                    params: {
                      posts: JSON.stringify(posts),
                      focusedIndexPost: image.id,
                    },
                  });
                }}
              >
                <Image
                  source={{ uri: image.media_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}

            {/* Fill remaining space if row has less than 3 images */}
            {row.length < 3 && (
              <View
                style={{
                  flex: 3 - row.length,
                  minWidth:
                    imageSize * (3 - row.length) + gap * (3 - row.length - 1),
                }}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderVideosGrid = () => {
    if (userReels.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Feather name="video" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No videos yet. Videos shared will appear here.
          </Text>
        </View>
      );
    }

    // Calculate responsive dimensions
    const containerWidth = width - 32; // Account for horizontal padding
    const gap = 2;
    const videoWidth = (containerWidth - gap * 2) / 3; // 3 videos per row with gaps
    const videoHeight = videoWidth * 1.5; // 3:2 aspect ratio for videos

    // Group videos into rows of 3
    const rows = [];
    for (let i = 0; i < userReels.length; i += 3) {
      rows.push(userReels.slice(i, i + 3));
    }

    return (
      <View>
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            className="flex-row mb-1 gap-1"
            style={{ gap: gap }}
          >
            {row.map((video, videoIndex) => (
              <TouchableOpacity
                key={video.id}
                className="rounded-xl overflow-hidden relative"
                style={{
                  width: videoWidth,
                  height: videoHeight,
                }}
              >
                <Image
                  source={{ uri: video.thumbnail_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute bottom-2 left-2 flex-row items-center bg-black/50 px-2 py-1 rounded-xl">
                  <Feather name="play" size={16} color="#fff" />
                  <Text className="text-white text-xs ml-1">
                    {kFormatter(video?.reels_views_aggregate.aggregate.count)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Fill remaining space if row has less than 3 videos */}
            {row.length < 3 && (
              <View
                style={{
                  flex: 3 - row.length,
                  minWidth:
                    videoWidth * (3 - row.length) + gap * (3 - row.length - 1),
                }}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderProductGrid = () => {
    if (productsAffiliated.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <SimpleLineIcons name="handbag" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No affiliated products yet.
          </Text>
        </View>
      );
    }
    return (
      <View className="flex-row flex-wrap justify-between">
        {productsAffiliated.map((product) => (
          <TouchableOpacity
            key={product.id}
            className="mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-200"
            style={{ width: (width - 40) / 2 }}
          >
            <Image
              source={{ uri: product.main_image }}
              className="w-full h-40"
              resizeMode="cover"
            />
            <View className="p-2">
              <Text className="text-sm font-medium text-gray-900">
                {product.name.length > 15
                  ? product.name.slice(0, 15) + "..."
                  : product.name}
              </Text>
              <Text className="text-sm font-semibold text-gray-900 mt-1">
                ₹{product.sale_price}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTextPosts = () => {
    // Filter for text posts only
    const filteredPosts = posts.filter((post) => post.text_post === true);

    if (filteredPosts.length === 0) {
      return (
        <View className="items-center justify-center py-12">
          <Foundation name="text-color" size={48} color="#ccc" />
          <Text className="text-sm text-gray-500 text-center mt-4 max-w-4/5">
            No notes yet. Notes shared will appear here.
          </Text>
        </View>
      );
    }
    return (
      <View className="gap-2">
        {filteredPosts.map((item) => (
          <TextPost
            key={item.id}
            item={item}
            onPress={() => {
              router.push({
                pathname: "/(profiles)/profilePosts",
                params: {
                  posts: JSON.stringify(posts),
                  focusedIndexPost: item.id,
                },
              });
            }}
            likedPosts={[]}
            likedPostIDs={[]}
            handleShare={() => {}}
            toggleLike={() => {}}
            commentBox={() => {}}
            toggleFollow={() => {}}
            followedUsers={[]}
            setFocusedPostID={() => {}}
            hideActions={true}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-base text-gray-600 text-center">
          Failed to load user profile
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        nestedScrollEnabled={true}
      >
        {/* Header with Banner - Fixed height */}
        <View className="relative h-52">
          <Image
            source={{
              uri:
                userDetails.banner_image ||
                "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg?semt=ais_hybrid",
            }}
            className="w-full h-full"
            resizeMode="cover"
            onError={(error) => {
              console.log("Banner image load error:", error.nativeEvent.error);
            }}
            onLoad={() => {
              console.log("Banner image loaded successfully");
            }}
          />

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

            {userID === currentUser.id && (
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                onPress={() => {
                  router.push("/(settings)");
                }}
              >
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Social Media Buttons */}
          <View className="flex-row absolute bottom-9 right-4 gap-2">
            {userDetails?.social_media_accounts &&
              userDetails.social_media_accounts.length > 0 && (
                <>
                  {userDetails.social_media_accounts[0]?.instagram_username &&
                    userDetails.social_media_accounts[0].instagram_username
                      .length > 2 && (
                      <TouchableOpacity
                        className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                        onPress={() =>
                          Linking.openURL(
                            `https://instagram.com/${userDetails.social_media_accounts![0].instagram_username}`
                          )
                        }
                      >
                        <FontAwesome5 name="instagram" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                  {userDetails.social_media_accounts[0]?.twitter_username &&
                    userDetails.social_media_accounts[0].twitter_username
                      .length > 2 && (
                      <TouchableOpacity
                        className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                        onPress={() =>
                          Linking.openURL(
                            `https://twitter.com/${userDetails.social_media_accounts![0].twitter_username}`
                          )
                        }
                      >
                        <FontAwesome5 name="twitter" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                  {userDetails.social_media_accounts[0]?.youtube_username &&
                    userDetails.social_media_accounts[0].youtube_username
                      .length > 2 && (
                      <TouchableOpacity
                        className="w-9 h-9 rounded-full bg-black/30 bg-opacity-30 justify-center items-center"
                        onPress={() =>
                          Linking.openURL(
                            `https://youtube.com/${userDetails.social_media_accounts![0].youtube_username}`
                          )
                        }
                      >
                        <FontAwesome5 name="youtube" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                </>
              )}
          </View>
        </View>

        {/* Profile Info Section */}
        <View className="px-4 pt-4 bg-gray-100 rounded-t-3xl rounded-t-6 -mt-4">
          <View className="flex-row items-start">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                // Copy profile link functionality
                console.log("Profile link copied");
              }}
            >
              <Image
                source={{
                  uri:
                    userDetails.profile_picture ||
                    "https://media.istockphoto.com/id/1223671392/vector/default-profile-picture-avatar-photo-placeholder-vector-illustration.jpg?s=612x612&w=0&k=20&c=s0aTdmT5aU6b8ot7VKm11DeID6NctRCpB755rA1BIP0=",
                }}
                className="w-24 h-24 rounded-full border-4 border-white -mt-12"
              />
            </TouchableOpacity>

            <View className="ml-2 flex-1">
              <View className="mb-1 -mt-3">
                {(userDetails?.first_name || userDetails?.last_name) && (
                  <Text className="text-lg font-bold text-gray-900">
                    {(
                      (userDetails?.first_name || "") +
                      " " +
                      (userDetails?.last_name || "")
                    ).trim()}
                  </Text>
                )}
                <View className="flex-row items-center">
                  <Text className="text-base text-gray-600">
                    @{userDetails.username}
                  </Text>
                  {userDetails.is_creator && (
                    <Octicons
                      name="verified"
                      size={16}
                      color="#1a1a1a"
                      className="ml-1"
                    />
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Bio Section - Optimized for expansion */}
          <TouchableOpacity
            onPress={() => setBioExpanded(!bioExpanded)}
            className="py-2"
          >
            {userDetails?.bio && (
              <Text className="text-base text-gray-700 leading-5">
                {bioExpanded
                  ? userDetails?.bio
                  : userDetails?.bio?.length > 100
                    ? userDetails?.bio?.slice(0, 90).trim() + "..."
                    : userDetails?.bio?.trim()}
              </Text>
            )}
          </TouchableOpacity>

          {/* Stats Section */}
          <View className="flex-row justify-around py-1 border-gray-200 mb-1">
            {stats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                className="items-center"
                onPress={() => handleOpenSheet(stat.label)}
                disabled={userID !== currentUser.id || stat.label === "Posts"}
              >
                <Text className="text-sm font-bold text-gray-900">
                  {kFormatter(stat.value)}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mb-6">
            {userID === currentUser.id ? (
              <>
                <TouchableOpacity
                  className="flex-1 h-10 rounded-full justify-center items-center bg-white mr-2"
                  onPress={() => {
                    router.push("/(profiles)/editProfile");
                  }}
                >
                  <Text className="text-sm font-semibold text-gray-900">
                    Edit Profile
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 h-10 rounded-full justify-center items-center bg-gray-900 ml-2">
                  <Text className="text-sm font-semibold text-white">
                    Invite
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  className={`flex-1 h-10 rounded-full justify-center items-center ${
                    following === "followed" ? "bg-white" : "bg-gray-900"
                  }`}
                  onPress={toggleFollow}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      following === "followed" ? "text-gray-900" : "text-white"
                    }`}
                  >
                    {following === "followed"
                      ? "Following"
                      : following === "pending"
                        ? "Requested"
                        : "Follow"}
                  </Text>
                </TouchableOpacity>

                {following === "followed" && (
                  <TouchableOpacity className="flex-1 h-10 rounded-full justify-center items-center bg-white ml-2">
                    <Text className="text-sm font-semibold text-gray-900">
                      Message
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Content Tabs and Display */}
          {userDetails.is_creator ||
          following === "followed" ||
          userDetails.id === currentUser.id ? (
            <>
              <View className="flex-row justify-between mb-4">
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    className={`w-12 h-12 rounded-full justify-center items-center ${
                      activeTab === tab ? "bg-gray-900" : "bg-white"
                    }`}
                    onPress={() => setActiveTab(tab)}
                  >
                    {tab === "All" && (
                      <FontAwesome
                        name="snowflake-o"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                    {tab === "Photos" && (
                      <Foundation
                        name="photo"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                    {tab === "Videos" && (
                      <Foundation
                        name="play-video"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                    {tab === "Notes" && (
                      <Foundation
                        name="text-color"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                    {tab === " " && (
                      <SimpleLineIcons
                        name="handbag"
                        size={18}
                        color={activeTab === tab ? "#fff" : "#666"}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mb-6">
                {activeTab === "All" && renderGridLayout()}
                {activeTab === "Photos" && renderSquareGrid()}
                {activeTab === "Videos" && renderVideosGrid()}
                {activeTab === "Notes" && renderTextPosts()}
                {activeTab === " " && renderProductGrid()}
              </View>
            </>
          ) : (
            // Private account view
            <View className="items-center justify-center py-12">
              <View className="w-16 h-16 rounded-full bg-white justify-center items-center mb-4">
                <Ionicons name="lock-closed" size={24} color="#1a1a1a" />
              </View>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                This Account is Private
              </Text>
              <Text className="text-sm text-gray-600 text-center max-w-4/5">
                Follow this account to see their photos and videos
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
