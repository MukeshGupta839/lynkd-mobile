import { create } from "zustand";

type ChatItemAny = any;

interface ChatListState {
  chatList: ChatItemAny[];
  setChatList: (
    next: ChatItemAny[] | ((prev: ChatItemAny[]) => ChatItemAny[])
  ) => void;
  addChatItem: (item: ChatItemAny) => void;
  clearChatList: () => void;
}

export const useChatListStore = create<ChatListState>((set) => ({
  chatList: [],
  setChatList: (next) =>
    set((state) => ({
      chatList:
        typeof next === "function" ? (next as any)(state.chatList) : next,
    })),
  addChatItem: (item) => set((s) => ({ chatList: [item, ...s.chatList] })),
  clearChatList: () => set({ chatList: [] }),
}));

export default useChatListStore;
