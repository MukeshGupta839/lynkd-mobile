import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Get API URL from config with platform-specific fallback
// Note: URL should include port (e.g., http://192.168.1.61:5000)
const getApiUrl = (): string => {
  // First try to get from extra config (set in app.json)
  const configUrl = Constants.expoConfig?.extra?.API_URL;
  if (configUrl) return configUrl;

  // Platform-specific defaults with port
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000'; // Android emulator
  }

  return 'http://localhost:5000'; // iOS simulator and default
};

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | string;

/**
 * Generic API helper.
 * @param endpoint - Path part of the URL (should start with `/` or will be prefixed)
 * @param method - HTTP method
 * @param data - Request body (can be FormData for multipart)
 * @param headers - Additional headers
 */
export const apiCall = async (
  endpoint: string,
  method: HttpMethod = "GET",
  data?: any,
  headers?: Record<string, string>
): Promise<any> => {
  // get auth token from secure storage
  const authToken = await SecureStore.getItemAsync("authToken");

  const base = getApiUrl();
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${base}${path}`; // Base URL already includes port


  try {
    console.log(`Making API request to: ${fullUrl}`);

    // Determine sensible Content-Type when not provided
    let defaultContentType = "multipart/form-data";
    if (headers?.["Content-Type"] === "application/json" ||
      (data && typeof data === 'object' && !(data instanceof FormData))) {
      defaultContentType = "application/json";
    }

    const mergedHeaders: Record<string, string> = {
      "Content-Type": headers?.["Content-Type"] ?? defaultContentType,
      ...headers,
    };

    if (authToken) {
      mergedHeaders.Authorization = `Bearer ${authToken}`;
    }

    const config: AxiosRequestConfig = {
      method,
      url: fullUrl,
      data,
      headers: mergedHeaders,
    };

    const response: AxiosResponse = await axios.request(config);

    console.log("API response:", response.data);
    return response.data;
  } catch (err: any) {
    // Improve error logging when axios provides details
    if (isAxiosError(err)) {
      console.error(
        "API request failed:",
        err.message,
        err.response?.status,
        err.response?.data
      );

      // Handle specific network errors
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new Error(
          `Cannot connect to server at ${base}. Please ensure the backend server is running.`
        );
      }

      if (err.message === 'Network Error') {
        throw new Error(
          `Network error: Unable to reach server at ${base}. Check your internet connection and ensure the backend is running.`
        );
      }

      throw new Error(
        err.response?.data?.message ?? err.message ?? "API request failed"
      );
    }

    console.error("API request failed:", err);
    throw new Error("API request failed");
  }
};
