// app/(account)/change-password.tsx
import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useMemo, useState } from "react";
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

  const handleSubmit = () => {
    // purely UI: pretend to submit
    if (!isValid) {
      setTouched({ current: true, next: true, confirm: true });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Password updated (UI only).", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }, 900);
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

          {/* Footer note */}
          <Text className="text-xs text-zinc-500 mt-3 text-center">
            This screen is UI only. Hook it up to your auth flow later.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
    // {/* </SafeAreaView> */}
  );
}
