import { useLocalSearchParams } from "expo-router";
import ProfileScreen from "../../components/ProfileScreen";

const ProfileIndex = () => {
  const params = useLocalSearchParams();

  // Get user ID from URL params (from navigation)
  const viewingUserId = params.user
    ? Number(Array.isArray(params.user) ? params.user[0] : params.user)
    : undefined;

  const viewingUsername = params.username
    ? Array.isArray(params.username)
      ? params.username[0]
      : params.username
    : undefined;

  console.log("ProfileIndex - Viewing user:", viewingUserId, viewingUsername);

  // Example API functions - replace with your actual API calls
  const fetchUserDetails = async (userId: number, username?: string) => {
    console.log("Fetching user details for:", userId, username);

    // TODO: Call your API here
    // const response = await fetch(`https://your-api.com/api/users/${userId}`);
    // return await response.json();

    // Return mock data for now - remove this when implementing real API
    // This mock data should show DIFFERENT users based on the userId
    const mockUsers: Record<number, any> = {
      1: {
        id: 1,
        username: "john_doe",
        first_name: "John",
        last_name: "Doe",
        bio: "Tech enthusiast 🚀 | Coffee lover ☕",
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
      },
      2: {
        id: 2,
        username: "jane_smith",
        first_name: "Jane",
        last_name: "Smith",
        bio: "Designer • Traveler 🌍 | Living life to the fullest",
        profile_picture: "https://randomuser.me/api/portraits/women/2.jpg",
        banner_image:
          "https://img.freepik.com/free-vector/gradient-blue-background_23-2149379618.jpg",
        is_creator: false,
        postsCount: 8,
        reelsCount: 3,
        followersCount: 850,
        followingCount: 620,
        social_media_accounts: [
          {
            instagram_username: "janesmith_design",
            twitter_username: "janesmith",
            youtube_username: "",
          },
        ],
      },
      3: {
        id: 3,
        username: "alex_harma",
        first_name: "Alex",
        last_name: "Harma",
        bio: "Photographer 📸 | Nature lover 🌲",
        profile_picture: "https://randomuser.me/api/portraits/men/3.jpg",
        banner_image:
          "https://img.freepik.com/free-vector/gradient-purple-background_23-2149379617.jpg",
        is_creator: true,
        postsCount: 24,
        reelsCount: 12,
        followersCount: 3500,
        followingCount: 450,
        social_media_accounts: [
          {
            instagram_username: "alex_harma_photos",
            twitter_username: "alexharma",
            youtube_username: "alexharmaphoto",
          },
        ],
      },
    };

    // Add more mock users to match your POSTS data
    const additionalMockUsers: Record<number, any> = {
      11: {
        id: 11,
        username: "alex_harma",
        first_name: "Alex",
        last_name: "Harma",
        bio: "Photographer 📸 | Content Creator | Living my best life",
        profile_picture: "https://randomuser.me/api/portraits/men/32.jpg",
        banner_image:
          "https://img.freepik.com/free-vector/gradient-purple-background_23-2149379617.jpg",
        is_creator: true,
        postsCount: 45,
        reelsCount: 18,
        followersCount: 5200,
        followingCount: 890,
        social_media_accounts: [
          {
            instagram_username: "alex_harma",
            twitter_username: "alexharma",
            youtube_username: "alexharma",
          },
        ],
      },
      12: {
        id: 12,
        username: "alex_harma",
        first_name: "Alex",
        last_name: "Harma",
        bio: "Photographer 📸 | Content Creator | Living my best life",
        profile_picture: "https://randomuser.me/api/portraits/men/32.jpg",
        banner_image:
          "https://img.freepik.com/free-vector/gradient-purple-background_23-2149379617.jpg",
        is_creator: true,
        postsCount: 45,
        reelsCount: 18,
        followersCount: 5200,
        followingCount: 890,
        social_media_accounts: [
          {
            instagram_username: "alex_harma",
            twitter_username: "alexharma",
            youtube_username: "alexharma",
          },
        ],
      },
    };

    // Merge both mock user dictionaries
    const allMockUsers = { ...mockUsers, ...additionalMockUsers };

    // Return the specific user's data or a default
    return (
      allMockUsers[userId] || {
        id: userId,
        username: username || `user_${userId}`,
        first_name: "Unknown",
        last_name: "User",
        bio: "This user hasn't updated their bio yet.",
        profile_picture: `https://randomuser.me/api/portraits/${userId % 2 ? "women" : "men"}/${(userId % 20) + 1}.jpg`,
        banner_image:
          "https://img.freepik.com/free-vector/gradient-trendy-background_23-2150417179.jpg",
        is_creator: false,
        postsCount: 0,
        reelsCount: 0,
        followersCount: 0,
        followingCount: 0,
        social_media_accounts: [],
      }
    );
  };

  const fetchUserPosts = async (userId: number) => {
    console.log("Fetching posts for user:", userId);

    // TODO: Call your API here
    // const response = await fetch(`https://your-api.com/api/users/${userId}/posts`);
    // return await response.json();

    // Return mock posts data for now
    return [
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
    ];
  };

  const fetchUserReels = async (userId: number) => {
    console.log("Fetching reels for user:", userId);

    // TODO: Call your API here
    // const response = await fetch(`https://your-api.com/api/users/${userId}/reels`);
    // return await response.json();

    // Return mock reels data
    return [
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
    ];
  };

  const fetchUserProducts = async (userId: number) => {
    console.log("Fetching products for user:", userId);

    // TODO: Call your API here
    // const response = await fetch(`https://your-api.com/api/users/${userId}/products`);
    // return await response.json();

    // Return mock products data
    return [
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
    ];
  };

  const handleFollow = async (userId: number) => {
    // Call your follow API here
    // await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
    console.log("Following user:", userId);
  };

  const handleUnfollow = async (userId: number) => {
    // Call your unfollow API here
    // await fetch(`/api/users/${userId}/unfollow`, { method: 'POST' });
    console.log("Unfollowing user:", userId);
  };

  return (
    <ProfileScreen
      userId={viewingUserId} // Pass the user ID from navigation params
      username={viewingUsername} // Pass the username from navigation params
      currentUserId={1} // Pass your current logged-in user ID
      fetchUserDetails={fetchUserDetails}
      fetchUserPosts={fetchUserPosts}
      fetchUserReels={fetchUserReels}
      fetchUserProducts={fetchUserProducts}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
    />
  );
};

export default ProfileIndex;
