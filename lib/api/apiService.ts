import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

const API_PORT = 5000; // Define the port here

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

  try {
    const base = process.env.API_URL ?? "http://localhost";
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const fullUrl = `${base}:${API_PORT}${path}`;

    console.log(`Making API request to: ${fullUrl}`);

    // Determine sensible Content-Type when not provided
    const defaultContentType =
      data instanceof FormData ? "multipart/form-data" : "application/json";
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
      throw new Error(
        err.response?.data?.message ?? err.message ?? "API request failed"
      );
    }

    console.error("API request failed:", err);
    throw new Error("API request failed");
  }
};
