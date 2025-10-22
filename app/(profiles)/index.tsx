import { useLocalSearchParams } from "expo-router";
import { useContext } from "react";
import ProfileScreen from "../../components/ProfileScreen";
import { AuthContext } from "../../context/AuthContext";
import { apiCall } from "../../lib/api/apiService";

const ProfileIndex = () => {
  const params = useLocalSearchParams();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("ProfileIndex must be used within AuthProvider");
  }

  const { user } = authContext;

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

  // Fetch user details with real API integration
  const fetchUserDetails = async (userId: number, username?: string) => {
    try {
      let userResponse;

      if (username) {
        // Fetch by username if provided
        userResponse = await apiCall(`/api/users/username/${username}`, "GET");
      } else {
        // Fetch by userId
        userResponse = await apiCall(`/api/users/${userId}`, "GET");
      }

      if (userResponse.user) {
        const userData = userResponse.user;

        // Fetch additional data
        const [brandResponse, reelsResponse] = await Promise.all([
          apiCall(
            `/api/affiliations/user/${userData.id}/affiliated-brands/`,
            "GET"
          ),
          apiCall(`/api/posts/reels/user/${userData.id}?limit=100`, "GET"),
        ]);

        return {
          ...userData,
          postsCount: userData.postsCount || 0,
          reelsCount: reelsResponse.data?.length || 0,
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
          brandsAffiliated:
            brandResponse.data?.map((brand: any) => ({
              name: brand.brand.brand_name,
              logo: brand.brand.brandLogoURL,
              id: brand.brand.id,
            })) || [],
        };
      }

      throw new Error("User not found");
    } catch (error) {
      console.error("Error fetching user details:", error);
      throw error;
    }
  };

  // Fetch user posts with real API integration
  const fetchUserPosts = async (userId: number) => {
    try {
      const response = await apiCall(`/api/posts/user/${userId}`, "GET");

      if (response?.data) {
        const postsData = response.data.map((post: any) => {
          return {
            id: post.id,
            user_id: post.user_id,
            caption: post.caption,
            createdAt: post.created_at,
            created_at: post.created_at,
            username: post.user.username,
            userProfilePic: post.user.profile_picture,
            postImage: post.media_url,
            media_url: post.media_url,
            aspect_ratio: post.aspect_ratio,
            affiliated: post?.affiliated,
            affiliation: {
              affiliationID: post.PostToPostAffliation?.id,
              brandName: post.PostToPostAffliation?.brand?.brand_name,
              productID: post.PostToPostAffliation?.productID,
              productURL: post.PostToPostAffliation?.productURL,
              productName: post.PostToPostAffliation?.product?.name,
              productImage: post.PostToPostAffliation?.product?.main_image,
              brandLogo: post.PostToPostAffliation?.brand?.brandLogoURL,
              productDescription:
                post.PostToPostAffliation?.product?.description,
              productRegularPrice:
                post.PostToPostAffliation?.product?.regular_price,
              productSalePrice: post.PostToPostAffliation?.product?.sale_price,
            },
            likes_count: post.likes_aggregate?.aggregate?.count || 0,
            comments_count: post.comments_aggregate?.aggregate?.count || 0,
            text_post: post.text_post,
            post_hashtags:
              post.PostToTagsMultiple?.map((tag: any) => tag.tag.name) || [],
            type: post.text_post ? "text" : "image",
            imageUrl: post.media_url,
            text: post.text_post ? post.caption : undefined,
            timestamp: post.created_at,
            ...post,
          };
        });

        // Sort by creation date (newest first)
        postsData.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return postsData;
      }

      return [];
    } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
  };

  // Fetch user reels with real API integration
  const fetchUserReels = async (userId: number) => {
    try {
      const response = await apiCall(
        `/api/posts/reels/user/${userId}?limit=100`,
        "GET"
      );

      if (response.data) {
        return response.data.map((reel: any) => ({
          id: reel.id,
          thumbnail_url: reel.thumbnail_url,
          reels_views_aggregate: reel.reels_views_aggregate || {
            aggregate: { count: 0 },
          },
          ...reel,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching reels:", error);
      return [];
    }
  };

  // Fetch user products with real API integration
  const fetchUserProducts = async (userId: number) => {
    try {
      const response = await apiCall(
        `/api/affiliations/creator/${userId}/affiliated-products`,
        "GET"
      );

      if (response.data) {
        return response.data.map((product: any) => ({
          id: product.id,
          imageUrl: product.main_image,
          name: product.name,
          price: `₹${product.sale_price}`,
          main_image: product.main_image,
          sale_price: product.sale_price,
          regular_price: product.regular_price,
          description: product.description,
          ...product,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  // Handle follow action with real API integration
  const handleFollow = async (userId: number) => {
    try {
      if (!user?.id) {
        console.error("User not authenticated");
        return;
      }

      const response = await apiCall(
        `/api/follows/follow/${user.id}/${userId}`,
        "POST"
      );
      console.log("Follow response:", response);
      return response;
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  };

  // Handle unfollow action with real API integration
  const handleUnfollow = async (userId: number) => {
    try {
      if (!user?.id) {
        console.error("User not authenticated");
        return;
      }

      const response = await apiCall(
        `/api/follows/unfollow/${user.id}/${userId}`,
        "DELETE"
      );
      console.log("Unfollow response:", response);
      return response;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  };

  // Check follow status with real API integration
  const checkFollowStatus = async (userId: number) => {
    try {
      if (!user?.id || userId === user.id) {
        // Don't check follow status for own profile
        return null;
      }

      const response = await apiCall(
        `/api/follows/isFollowing/${user.id}/${userId}`,
        "GET"
      );
      console.log("Follow status response:", response);
      return response.isFollowing; // Returns 'followed', 'pending', or false/null
    } catch (error) {
      console.error("Error checking follow status:", error);
      return null;
    }
  };

  return (
    <ProfileScreen
      userId={viewingUserId} // Pass the user ID from navigation params
      username={viewingUsername} // Pass the username from navigation params
      currentUserId={user?.id || 1} // Pass current logged-in user ID from context
      fetchUserDetails={fetchUserDetails}
      fetchUserPosts={fetchUserPosts}
      fetchUserReels={fetchUserReels}
      fetchUserProducts={fetchUserProducts}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
      checkFollowStatus={checkFollowStatus}
    />
  );
};

export default ProfileIndex;
