import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { apiCall } from "../lib/api/apiService";

interface AuthTokenState {
    authToken: string | null;
    setAuthToken: (token: string | null) => Promise<void>;
    registerUser: (credentials: {
        username: string;
        password: string;
        user_id: string;
    }) => Promise<any>;
    loginUser: (credentials: {
        username: string;
        password: string;
    }) => Promise<any>;
    logoutUser: () => Promise<void>;
    loadToken: () => Promise<void>;
}

const useAuthTokenStore = create<AuthTokenState>((set) => ({
    authToken: null,

    setAuthToken: async (token: string | null) => {
        if (token) {
            await SecureStore.setItemAsync("authToken", token);
        } else {
            await SecureStore.deleteItemAsync("authToken");
        }
        set({ authToken: token });
    },

    registerUser: async (credentials) => {
        try {
            const response = await apiCall("/api/tokenAuthentication/register", "POST", credentials, {
                "Content-Type": "application/json"
            });

            if (response.token) {
                await SecureStore.setItemAsync("authToken", response.token);
                set({ authToken: response.token });
            }

            console.log("User registered:", response);
            return response;
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    },

    loginUser: async (credentials) => {
        try {
            const response = await apiCall("/api/tokenAuthentication/login", "POST", credentials, {
                "Content-Type": "application/json"
            });

            if (response && response.token) {
                await SecureStore.setItemAsync("authToken", response.token);
                set({ authToken: response.token });
            }

            console.log("User logged in:", response);
            return response;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    },

    logoutUser: async () => {
        await SecureStore.deleteItemAsync("authToken");
        set({ authToken: null });
    },

    loadToken: async () => {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            set({ authToken: token });
        } catch (error) {
            console.error("Error loading auth token:", error);
        }
    },
}));

export default useAuthTokenStore;
