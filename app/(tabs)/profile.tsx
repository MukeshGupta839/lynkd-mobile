import ProfileScreen from "../../components/ProfileScreen";

const Profile = () => {
  // Example API functions - replace with your actual API calls
  const fetchUserDetails = async (userId: number, username?: string) => {
    // Call your API here
    // const response = await fetch(`/api/users/${userId}`);
    // return await response.json();

    // Return mock data for now - remove this when implementing real API
    return {
      id: userId,
      username: username || "current_user",
      first_name: "John",
      last_name: "Doe",
      bio: "Your bio here",
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
          instagram_username: "your_instagram",
          twitter_username: "your_twitter",
          youtube_username: "your_youtube",
        },
      ],
    };
  };

  const fetchUserPosts = async (userId: number) => {
    // TODO: Replace with real API call
    // const response = await fetch(`/api/users/${userId}/posts`);
    // return await response.json();

    console.log("Fetching posts for user:", userId);

    // Mock posts data (same as profiles route for consistency)
    return [
      {
        id: 101,
        imageUrl:
          "https://img.freepik.com/free-photo/painting-mountain-lake-with-mountain-background_188544-9126.jpg",
        type: "image",
      },
      {
        id: 102,
        imageUrl:
          "https://img.freepik.com/free-photo/wide-angle-shot-single-tree-growing-clouded-sky-during-sunset-surrounded-by-grass_181624-22807.jpg",
        type: "image",
      },
      {
        id: 103,
        imageUrl:
          "https://img.freepik.com/free-photo/beautiful-shot-sea-with-black-sand-beach-stokksnes-iceland_181624-9274.jpg",
        type: "image",
      },
      {
        id: 104,
        imageUrl:
          "https://img.freepik.com/free-photo/beautiful-shot-white-british-shorthair-kitten_181624-57681.jpg",
        type: "image",
      },
      {
        id: 105,
        imageUrl:
          "https://img.freepik.com/free-photo/view-illuminated-neon-gaming-keyboard-setup-controller_23-2149529367.jpg",
        type: "image",
      },
      {
        id: 106,
        imageUrl:
          "https://img.freepik.com/free-photo/top-view-desk-concept-with-tech-device_23-2148757781.jpg",
        type: "image",
      },
      {
        id: 107,
        type: "text",
        text: "Just finished reading an amazing book! 📚 Highly recommend it to everyone!",
        timestamp: "2024-03-15",
      },
      {
        id: 108,
        imageUrl:
          "https://img.freepik.com/free-photo/workplace-with-smartphone-laptop_23-2147842490.jpg",
        type: "image",
      },
      {
        id: 109,
        imageUrl:
          "https://img.freepik.com/free-photo/beautiful-tropical-beach-sea_74190-6786.jpg",
        type: "image",
      },
      {
        id: 110,
        type: "text",
        text: "Starting a new project today! Excited for what's ahead 🚀 #motivation #productivity",
        timestamp: "2024-03-10",
      },
      {
        id: 111,
        imageUrl:
          "https://img.freepik.com/free-photo/creative-reels-composition_23-2149711507.jpg",
        type: "image",
      },
      {
        id: 112,
        imageUrl:
          "https://img.freepik.com/free-photo/delicious-italian-pasta-white-surface_144627-43981.jpg",
        type: "image",
      },
      {
        id: 113,
        type: "text",
        text: "Coffee + Code = Productivity ☕💻 #developerlife #coding",
        timestamp: "2024-03-08",
      },
      {
        id: 114,
        imageUrl:
          "https://img.freepik.com/free-photo/red-white-cat-i-white-studio_155003-13189.jpg",
        type: "image",
      },
      {
        id: 115,
        imageUrl:
          "https://img.freepik.com/free-photo/photorealistic-view-tree-nature-with-branches-trunk_23-2151478039.jpg",
        type: "image",
      },
      {
        id: 116,
        type: "text",
        text: "Weekend vibes! Time to relax and recharge 🌴 #weekend #selfcare",
        timestamp: "2024-03-05",
      },
      {
        id: 117,
        imageUrl:
          "https://img.freepik.com/free-photo/sports-car-driving-asphalt-road-night-generative-ai_188544-8052.jpg",
        type: "image",
      },
      {
        id: 118,
        imageUrl:
          "https://img.freepik.com/free-photo/abstract-autumn-beauty-multi-colored-leaf-vein-pattern-generated-by-ai_188544-9871.jpg",
        type: "image",
      },
      {
        id: 119,
        type: "text",
        text: "Grateful for all the support! Thank you everyone 🙏❤️",
        timestamp: "2024-03-01",
      },
      {
        id: 120,
        imageUrl:
          "https://img.freepik.com/free-photo/milky-way-starry-night-sky-astronomy-photography_53876-148115.jpg",
        type: "image",
      },
      {
        id: 121,
        imageUrl:
          "https://img.freepik.com/free-photo/colorful-design-with-spiral-design_188544-9588.jpg",
        type: "image",
      },
      {
        id: 122,
        type: "text",
        text: "New blog post is live! Check it out 🎉 Link in bio #blog #writing",
        timestamp: "2024-02-28",
      },
      {
        id: 123,
        imageUrl:
          "https://img.freepik.com/free-photo/futuristic-moon-background_23-2150931730.jpg",
        type: "image",
      },
      {
        id: 124,
        type: "text",
        text: "Learning something new every day! 📖✨ #growth #learning",
        timestamp: "2024-01-25",
      },
    ];
  };

  const fetchUserReels = async (userId: number) => {
    // TODO: Replace with real API call
    // const response = await fetch(`/api/users/${userId}/reels`);
    // return await response.json();

    console.log("Fetching reels for user:", userId);

    // Mock reels data - must match the expected structure
    return [
      {
        id: 201,
        thumbnail_url:
          "https://img.freepik.com/free-photo/beautiful-scenery-phragmites-australis-communis-reeds-sunset_181624-29440.jpg",
        reels_views_aggregate: { aggregate: { count: 1200000 } }, // 1.2M views
      },
      {
        id: 202,
        thumbnail_url:
          "https://img.freepik.com/free-photo/wide-angle-shot-single-tree-growing-clouded-sky-during-sunset-surrounded-by-grass_181624-22807.jpg",
        reels_views_aggregate: { aggregate: { count: 856000 } }, // 856K views
      },
      {
        id: 203,
        thumbnail_url:
          "https://img.freepik.com/free-photo/wide-angle-shot-single-tree-growing-clouded-sky-during-sunset-surrounded-by-grass_181624-22807.jpg",
        reels_views_aggregate: { aggregate: { count: 856000 } }, // 856K views
      },
    ];
  };

  const fetchUserProducts = async (userId: number) => {
    // TODO: Replace with real API call
    // const response = await fetch(`/api/users/${userId}/products`);
    // return await response.json();

    console.log("Fetching products for user:", userId);

    // Mock products data
    return [
      {
        id: 301,
        imageUrl:
          "https://img.freepik.com/free-photo/levitating-music-headphones-display_23-2149817605.jpg",
        name: "Premium Headphones",
        price: "$199",
      },
      {
        id: 302,
        imageUrl:
          "https://img.freepik.com/free-photo/still-life-wireless-cyberpunk-headphones_23-2151072247.jpg",
        name: "Wireless Earbuds",
        price: "$149",
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

export default Profile;
