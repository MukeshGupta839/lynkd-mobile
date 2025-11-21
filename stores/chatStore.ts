import { create } from "zustand";

// Lightweight chat store. Message shape is application-defined; use `any` here
// to avoid circular type imports. Consumers in chat screens should cast
// to the local `Message` type used there.

type Msg = any;

interface ChatState {
  messages: Msg[];
  setMessages: (next: Msg[] | ((prev: Msg[]) => Msg[])) => void;
  addMessage: (m: Msg) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  setMessages: (next) =>
    set((state) => ({
      messages:
        typeof next === "function" ? (next as any)(state.messages) : next,
    })),
  addMessage: (m) => set((s) => ({ messages: [m, ...s.messages] })),
  clearMessages: () => set({ messages: [] }),
}));

export default useChatStore;
