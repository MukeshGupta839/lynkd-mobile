// app/(account)/change-password.tsx
import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { AuthContext } from "@/context/AuthContext";
import { apiCall } from "@/lib/api/apiService";
import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { TextInput as PaperTextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FieldKey = "current" | "next" | "confirm";

// ---------------- Reusable Password Input Component (Outside) ----------------
const PasswordInput = React.memo(
  ({
    label,
    field,
    placeholder,
    value,
    onChangeText,
    onBlur,
    onFocus,
    secure,
    onToggleSecure,
    showError,
    errorMessage,
  }: {
    label: string;
    field: FieldKey;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    onBlur: () => void;
    onFocus?: () => void;
    secure: boolean;
    onToggleSecure: () => void;
    showError: boolean;
    errorMessage?: string;
  }) => {
    return (
      <View className="mb-4">
        <PaperTextInput
          label={label}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          onFocus={onFocus}
          mode="outlined"
          secureTextEntry={secure}
          error={showError}
          placeholder={placeholder}
          autoCapitalize="none"
          textContentType="password"
          autoCorrect={false}
          right={
            <PaperTextInput.Icon
              icon={() =>
                secure ? <Eye color="#6b7280" /> : <EyeOff color="#6b7280" />
              }
              onPress={onToggleSecure}
            />
          }
          theme={{
            colors: { background: "white" },
            roundness: 12,
          }}
          outlineColor={showError ? "#ef4444" : "#bdbdbd"}
          activeOutlineColor={showError ? "#ef4444" : "#111827"}
        />
        {showError && errorMessage ? (
          <Text className="text-red-500 text-xs mt-1">{errorMessage}</Text>
        ) : null}
      </View>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const firebaseUser = authContext?.firebaseUser;

  console.log("ChangePasswordScreen:", firebaseUser);

  // ---------------- Password state ----------------
  const [values, setValues] = useState<Record<FieldKey, string>>({
    current: "",
    next: "",
    confirm: "",
  });
  const [secure, setSecure] = useState<Record<FieldKey, boolean>>({
    current: true,
    next: true,
    confirm: true,
  });
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });
  const [confirmError, setConfirmError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user signed in with password provider
  const hasPasswordProvider = useMemo(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return false;
    return currentUser.providerData.some(
      (provider) => provider.providerId === "password"
    );
  }, []);

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!values.current) e.current = "Enter your current password";
    if (!values.next) e.next = "Enter a new password";
    if (values.next && values.next.length < 6)
      e.next = "Password must be at least 6 characters";
    if (!values.confirm) e.confirm = "Re-enter the new password";
    if (values.confirm && values.next !== values.confirm)
      e.confirm = "Passwords do not match";
    return e;
  }, [values]);

  const isValid =
    values.current.length > 0 &&
    values.next.length >= 6 &&
    values.next === values.confirm;

  const handleSubmit = async () => {
    // Input validation
    if (!firebaseUser) {
      Alert.alert("Error", "User not authenticated. Please log in again.");
      return;
    }

    if (!isValid) {
      setTouched({ current: true, next: true, confirm: true });
      return;
    }

    setLoading(true);

    try {
      // Get the current Firebase Auth user
      const currentUser = auth().currentUser;

      if (!currentUser || !currentUser.email) {
        throw new Error("User not found or email not available");
      }

      // Check if user has password provider
      const hasPasswordProvider = currentUser.providerData.some(
        (provider) => provider.providerId === "password"
      );

      if (!hasPasswordProvider) {
        Alert.alert(
          "Cannot Change Password",
          "You signed in with Google. To set a password, please link your email/password authentication first or contact support.",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }

      // Re-authenticate the user with email/password
      const credential = auth.EmailAuthProvider.credential(
        currentUser.email,
        values.current
      );
      await currentUser.reauthenticateWithCredential(credential);

      // Update password
      await currentUser.updatePassword(values.next);

      // Notify backend about password change
      await apiCall(
        `/api/users/last-password-changed/${currentUser.uid}`,
        "PUT"
      );

      Alert.alert("Success", "Password updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Password change error:", error);

      let errorMessage = "Failed to update password. Please try again.";

      switch (error.code) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "The current password is incorrect.";
          break;
        case "auth/weak-password":
          errorMessage = "The new password is too weak.";
          break;
        case "auth/requires-recent-login":
          errorMessage =
            "Please log out and log in again to change your password.";
          break;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    // <SafeAreaView
    //   className="flex-1 bg-zinc-100"
    //   edges={["top", "bottom", "left", "right"]}
    // >
    <View
      className="flex-1 bg-zinc-100"
      style={{ paddingTop: insets.top - 10 }}
    >
      <ScreenHeaderBack title="Change Password" onBack={() => router.back()} />

      {/* Form */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 px-3 pt-3">
          {/* Warning for Google sign-in users */}
          {!hasPasswordProvider && (
            <View className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <Text className="text-yellow-800 font-semibold mb-1">
                ⚠️ Password Not Available
              </Text>
              <Text className="text-yellow-700 text-sm">
                You signed in with Google. To set a password for your account,
                you&apos;ll need to link email/password authentication first.
              </Text>
            </View>
          )}

          {/* -------- Password fields -------- */}
          <PasswordInput
            label="Current Password"
            field="current"
            value={values.current}
            onChangeText={(text) => {
              setValues((prev) => ({ ...prev, current: text }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, current: true }))}
            secure={secure.current}
            onToggleSecure={() =>
              setSecure((s) => ({ ...s, current: !s.current }))
            }
            showError={touched.current && !!errors.current}
            errorMessage={errors.current}
          />
          <PasswordInput
            label="New Password"
            field="next"
            value={values.next}
            onChangeText={(text) => {
              setValues((prev) => ({ ...prev, next: text }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, next: true }))}
            secure={secure.next}
            onToggleSecure={() => setSecure((s) => ({ ...s, next: !s.next }))}
            showError={touched.next && !!errors.next}
            errorMessage={errors.next}
          />
          <PasswordInput
            label="Confirm New Password"
            field="confirm"
            value={values.confirm}
            onChangeText={(text) => {
              setValues((prev) => ({ ...prev, confirm: text }));
              // Real-time validation: check if new password starts with this text
              const isMatch = values.next.startsWith(text);
              if (!isMatch && text.length > 0) {
                setConfirmError(true);
              } else {
                setConfirmError(false);
              }
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, confirm: true }));
              setConfirmError(false);
            }}
            onFocus={() => setConfirmError(false)}
            secure={secure.confirm}
            onToggleSecure={() =>
              setSecure((s) => ({ ...s, confirm: !s.confirm }))
            }
            showError={(touched.confirm && !!errors.confirm) || confirmError}
            errorMessage={
              confirmError ? "Passwords do not match" : errors.confirm
            }
          />

          {/* Hint */}
          {!!values.next && (
            <Text className="text-xs text-zinc-500 -mt-2 mb-4">
              Tip: Use 6+ chars with letters & numbers.
            </Text>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid || loading}
            className={[
              "h-12 rounded-2xl items-center justify-center",
              isValid && !loading ? "bg-zinc-900" : "bg-zinc-400",
            ].join(" ")}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Change Password</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
    // {/* </SafeAreaView> */}
  );
}
