// context/SocketProvider.tsx
import { useAuth } from "@/hooks/useAuth";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";

interface WebSocketContextValue {
  socket: Socket | null;
  isConnected: boolean; // Added helper state
  sendMessage: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(
  undefined
);

const getSocketEndpoint = () => {
  // 1. Check Expo Config (app.json/app.config.js)
  const configUrl = Constants.expoConfig?.extra?.API_URL;
  if (configUrl) return configUrl;

  // 2. Check Environment variable
  if (process.env.API_URL) return process.env.API_URL;

  // 3. Fallbacks for Emulators
  if (Platform.OS === "android") return "http://10.0.2.2:5000";
  // Note: If testing on a REAL Android device, you must use your PC's local IP (e.g., http://192.168.1.5:5000)

  return "http://localhost:5000";
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use a ref to track if we are already connecting to avoid double-init
  const connectionRef = useRef<Socket | null>(null);

  useEffect(() => {
    const userId = user?.id;

    if (!userId) {
      if (connectionRef.current) {
        console.log("User logged out, disconnecting...");
        connectionRef.current.disconnect();
        connectionRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Prevent reconnecting if we are already connected with the same ID
    if (connectionRef.current && connectionRef.current.connected) {
      return;
    }

    const initSocket = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const api = getSocketEndpoint();

        console.log("🔌 Connecting Socket to:", api);

        // CRITICAL FIX: Force websocket transport
        const newSocket = io(api, {
          path: "/socket.io/",
          transports: ["websocket"], // <--- REQUIRED FOR REACT NATIVE
          auth: { token },
          query: { userId },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        });

        connectionRef.current = newSocket;

        newSocket.on("connect", () => {
          console.log("✅ Socket Connected:", newSocket.id);
          setIsConnected(true);

          // 🔹 Just emit like your old code, no callback
          newSocket.emit("join", { userId });
          console.log("📨 join emitted with userId:", userId);

          setSocket(newSocket);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("❌ Socket Disconnected:", reason);
          setIsConnected(false);
          // Do not nullify socket state immediately on temporary disconnects
          // to allow auto-reconnect logic to work
        });

        newSocket.on("connect_error", (err) => {
          console.log("⚠️ Socket Connection Error:", err.message);
          setIsConnected(false);
        });
      } catch (error) {
        console.error("Socket Init Error:", error);
      }
    };

    initSocket();

    // Cleanup only on unmount or user change
    return () => {
      // Optional: Keep socket alive if you navigate between screens,
      // only disconnect if this specific effect is torn down due to userId change.
      if (connectionRef.current) {
        // connectionRef.current.disconnect(); // Uncomment if you want strict disconnect
      }
    };
  }, [user?.id]);

  const sendMessage = useCallback(
    (event: string, data: any) => {
      if (socket && socket.connected) {
        socket.emit(event, data);
      } else {
        console.warn("Cannot send: Socket disconnected");
      }
    },
    [socket]
  );

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context)
    throw new Error("useSocket must be used within a WebSocketProvider");
  return context;
};
