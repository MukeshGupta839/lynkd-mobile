// store/useBoostStore.ts
import { create } from "zustand";

export type GoalId = "profile" | "website" | "message" | "mix";

export type WebsiteActionId =
  | "learn_more"
  | "shop_now"
  | "watch_more"
  | "contact_us"
  | "book_now"
  | "sign_up";

export type PreferenceId =
  | "engagement"
  | "profile_visits"
  | "messages_instagram"
  | "no_preference";

export type DurationMode = "run_until_paused" | "set_duration";
export type GenderId = "male" | "female";

type AudienceState = {
  location: string | null; // from Locations screen

  // LEGACY single age (min age) – kept for backward compatibility
  age: number | null;

  // 🔹 New range fields from Age & gender screen
  minAge: number | null;
  maxAge: number | null;

  genders: GenderId[]; // ["male", "female"]
  interests: string[]; // labels from Interests screen
};

type BudgetState = {
  dailyBudget: number; // from BudgetDuration
  durationMode: DurationMode; // "run_until_paused" | "set_duration"
  durationDays: number | null; // null when run_until_paused
};

type BoostState = {
  // ---- Goal ----
  goal: GoalId;
  website: string;
  websiteAction: WebsiteActionId;
  preference: PreferenceId | null;

  // ---- Audience + Budget ----
  audience: AudienceState;
  budget: BudgetState;

  // setters
  setGoal: (goal: GoalId) => void;
  setWebsite: (website: string, action: WebsiteActionId) => void;
  setPreference: (preference: PreferenceId | null) => void;

  setAudience: (audience: Partial<AudienceState>) => void;
  setBudget: (budget: Partial<BudgetState>) => void;

  reset: () => void;
};

const DEFAULT_WEBSITE_URL = "www.myshop.com";
const DEFAULT_WEBSITE_ACTION: WebsiteActionId = "shop_now";

const DEFAULT_AUDIENCE: AudienceState = {
  location: "India",
  age: null, // legacy single age
  minAge: null,
  maxAge: null,
  genders: ["male", "female"],
  interests: [],
};

const DEFAULT_BUDGET: BudgetState = {
  dailyBudget: 10,
  durationMode: "run_until_paused",
  durationDays: null,
};

export const useBoostStore = create<BoostState>((set) => ({
  // Goal defaults
  goal: "profile",
  website: DEFAULT_WEBSITE_URL,
  websiteAction: DEFAULT_WEBSITE_ACTION,
  preference: null,

  // Audience + Budget defaults (use fresh copies)
  audience: { ...DEFAULT_AUDIENCE },
  budget: { ...DEFAULT_BUDGET },

  // ---- setters ----
  setGoal: (goal) => set({ goal }),

  setWebsite: (website, websiteAction) => set({ website, websiteAction }),

  setPreference: (preference) => set({ preference }),

  setAudience: (audienceUpdate) =>
    set((state) => ({
      audience: {
        ...state.audience,
        ...audienceUpdate,
      },
    })),

  setBudget: (budgetUpdate) =>
    set((state) => ({
      budget: {
        ...state.budget,
        ...budgetUpdate,
      },
    })),

  reset: () =>
    set({
      goal: "profile",
      website: DEFAULT_WEBSITE_URL,
      websiteAction: DEFAULT_WEBSITE_ACTION,
      preference: null,
      audience: { ...DEFAULT_AUDIENCE },
      budget: { ...DEFAULT_BUDGET },
    }),
}));
