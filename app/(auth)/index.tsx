import OrDivider from "@/components/OrDivider";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Text as RNText,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  ActivityIndicator as PaperSpinner,
  Text,
  TextInput,
} from "react-native-paper";
import GoogleLogo from "../../assets/svg/google-icon-logo.svg";

interface FormContentProps {
  email: React.RefObject<string>;
  password: React.RefObject<string>;
  passwordVisible: boolean;
  setPasswordVisible: (value: boolean | ((prev: boolean) => boolean)) => void;
  emailError: string;
  setEmailError: (error: string) => void;
  passwordError: string;
  setPasswordError: (error: string) => void;
  disableButton: boolean;
  validateEmail: (str: string) => boolean;
  isKeyboardVisible: boolean;
  onAppleSignIn: () => void;
  onGoogleSignIn: () => void;
  socialLoginError: string;
}

const UsernameSetupContent = ({
  username,
  usernameError,
  clearToMove,
  onUsernameChange,
  onSaveUsername,
  onToggleAgreement,
  disableButton,
}: {
  username: string;
  usernameError: string;
  clearToMove: boolean;
  onUsernameChange: (text: string) => void;
  onSaveUsername: () => void;
  onToggleAgreement: () => void;
  disableButton: boolean;
}) => {
  const [setupPassword, setSetupPassword] = useState("");
  const [setupPasswordError, setSetupPasswordError] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const handlePasswordChange = (text: string) => {
    setSetupPassword(text);
    setSetupPasswordError("");

    // Basic password validation
    if (text.length < 6) {
      setSetupPasswordError("Password must be at least 6 characters long.");
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(text)) {
      setSetupPasswordError(
        "Password must contain at least one letter and one number."
      );
    }
  };

  return (
    <View className="bg-white p-4 rounded-2xl">
      <RNText className="text-black text-2xl pt-5 pb-6 font-worksans-500">
        Set Username
      </RNText>

      <View className="justify-center">
        <View className="w-full mt-3">
          <TextInput
            label="Username"
            value={username}
            onChangeText={onUsernameChange}
            mode="outlined"
            error={
              !!usernameError && usernameError !== "Username is available."
            }
            theme={{
              colors: { background: "white" },
              roundness: 12,
            }}
            outlineColor={
              username === ""
                ? "#bdbdbd"
                : usernameError === "" ||
                    usernameError === "Username is available."
                  ? "green"
                  : "red"
            }
            activeOutlineColor={
              usernameError === "" || usernameError === "Username is available."
                ? "green"
                : "red"
            }
          />
          {usernameError && (
            <Text
              style={{
                color:
                  usernameError === "Username is available." ? "green" : "red",
                marginTop: 4,
              }}
            >
              *{usernameError}
            </Text>
          )}
        </View>

        <View className="w-full mt-3">
          <TextInput
            label="Password"
            value={setupPassword}
            onChangeText={handlePasswordChange}
            mode="outlined"
            secureTextEntry={true}
            error={!!setupPasswordError}
            theme={{
              colors: { background: "white" },
              roundness: 12,
            }}
            outlineColor="#bdbdbd"
            activeOutlineColor="#1b1b1b"
          />
          {setupPasswordError && (
            <Text style={{ color: "red", marginTop: 4 }}>
              *{setupPasswordError}
            </Text>
          )}
        </View>

        <View className="w-full mt-3">
          <TextInput
            label="Referral Code (Optional)"
            value={referralCode}
            onChangeText={setReferralCode}
            mode="flat" // 👈 underline-only
            style={{ backgroundColor: "white" }} // match your card bg
            underlineColor="#bdbdbd" // inactive underline
            activeUnderlineColor="#1b1b1b" // focused underline
            theme={{ colors: { background: "white" } }}
          />
        </View>

        <View className="mt-6">
          <TouchableOpacity
            className="flex-row items-start"
            onPress={onToggleAgreement}
            activeOpacity={0.7}
          >
            <FontAwesome5
              name={clearToMove ? "check-square" : "square"}
              size={20}
              color={clearToMove ? "#000" : "#666"}
              style={{ marginTop: 2 }}
            />
            <View className="flex-1 ml-3">
              <RNText className="text-xs text-gray-500 leading-4">
                By proceeding, you agree to our{" "}
                <RNText className="text-xs text-blue-500 underline">
                  EULA
                </RNText>
                {", "}
                <RNText className="text-xs text-blue-500 underline">
                  Terms of Use
                </RNText>{" "}
                and{" "}
                <RNText className="text-xs text-blue-500 underline">
                  Privacy Policy.
                </RNText>
              </RNText>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          disabled={!clearToMove || disableButton || !!setupPasswordError}
          activeOpacity={0.8}
          className={`h-13 px-4 items-center justify-center rounded-xl mt-6 ${
            clearToMove && !disableButton && !setupPasswordError
              ? "bg-black"
              : "bg-gray-400"
          } shadow-sm`}
          onPress={onSaveUsername}
        >
          {disableButton ? (
            <PaperSpinner size="small" color="white" />
          ) : (
            <RNText className="text-white text-lg font-semibold">Finish</RNText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FormContent = ({
  email,
  password,
  passwordVisible,
  setPasswordVisible,
  emailError,
  setEmailError,
  passwordError,
  setPasswordError,
  disableButton,
  validateEmail,
  isKeyboardVisible,
  onAppleSignIn,
  onGoogleSignIn,
  socialLoginError,
}: FormContentProps) => {
  return (
    <View className="bg-white p-4 rounded-2xl">
      <RNText className="text-black text-2xl pt-5 pb-10 font-worksans-500">
        Get Started!
      </RNText>
      <View className="w-full mt-3">
        <TextInput
          label="Email"
          onChangeText={(text) => {
            email.current = text;
            if (emailError) setEmailError("");
          }}
          onBlur={() => {
            if (!validateEmail(email.current)) {
              setEmailError("Please enter a valid email address.");
            }
          }}
          placeholderTextColor="#ccc"
          autoCapitalize="none"
          mode="outlined"
          error={!!emailError}
          keyboardType="email-address"
          theme={{
            colors: { background: "white" },
            roundness: 12,
          }}
          outlineColor="#bdbdbd"
          activeOutlineColor="#1b1b1b"
        />
        {emailError && (
          <Text style={{ color: "red", marginTop: 4 }}>{emailError}</Text>
        )}
      </View>

      <View className="w-full mt-3">
        <TextInput
          label="Password"
          secureTextEntry={!passwordVisible}
          onChangeText={(text) => {
            password.current = text;
            if (passwordError) setPasswordError("");
          }}
          mode="outlined"
          right={
            <TextInput.Icon
              icon={passwordVisible ? "eye" : "eye-off"}
              onPress={() => setPasswordVisible((v) => !v)}
            />
          }
          placeholderTextColor="#ccc"
          theme={{
            colors: { background: "white" },
            roundness: 12,
          }}
          outlineColor="#bdbdbd"
          activeOutlineColor="#1b1b1b"
          error={!!passwordError}
          className="rounded-lg"
        />
        {passwordError && (
          <Text style={{ color: "red", marginTop: 4 }}>{passwordError}</Text>
        )}
      </View>

      <TouchableOpacity className="my-3 self-end">
        <RNText className="text-gray-400">Forgot Password?</RNText>
      </TouchableOpacity>

      <View className="w-full">
        <TouchableOpacity
          disabled={disableButton}
          activeOpacity={0.8}
          className={`h-13 px-4 items-center justify-center rounded-xl ${
            disableButton ? "bg-gray-400" : "bg-black"
          } shadow-sm`}
          onPress={() => router.push("/(tabs)")}
        >
          {disableButton ? (
            <PaperSpinner size="small" color="white" />
          ) : (
            <RNText className="text-white text-lg font-semibold">Log In</RNText>
          )}
        </TouchableOpacity>
      </View>

      {!isKeyboardVisible && (
        <>
          <OrDivider />

          {/* Social Login Error Display */}
          {socialLoginError && (
            <View className="mb-3">
              <Text style={{ color: "red", textAlign: "center", fontSize: 14 }}>
                {socialLoginError}
              </Text>
            </View>
          )}

          <View className="flex-row">
            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center py-2 px-3 rounded-xl bg-gray-200 mr-2"
              onPress={onAppleSignIn}
              disabled={disableButton}
            >
              {disableButton ? (
                <PaperSpinner size="small" color="#000" />
              ) : (
                <>
                  <FontAwesome5 name="apple" size={22} color="#000" />
                  <RNText className="ml-2 text-black text-sm">
                    Sign in with Apple
                  </RNText>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center py-2 px-3 rounded-xl bg-gray-200 ml-2"
              onPress={onGoogleSignIn}
              disabled={disableButton}
            >
              {disableButton ? (
                <PaperSpinner size="small" color="#000" />
              ) : (
                <>
                  <GoogleLogo width={22} height={22} />
                  <RNText className="ml-2 text-black text-sm">
                    Sign in with Google
                  </RNText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default function LoginScreen() {
  const email = useRef("");
  const password = useRef("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [disableButton, setDisableButton] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [socialLoginError, setSocialLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [clearToMove, setClearToMove] = useState(false);

  // Social login handlers
  const handleAppleSignIn = async () => {
    try {
      setSocialLoginError("");
      setDisableButton(true);

      // TODO: Implement Apple Sign In logic here
      // For now, simulating success
      console.log("Apple Sign In initiated");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // On success, show username setup
      setShowUsernameSetup(true);
    } catch (error) {
      console.error("Apple Sign In Error:", error);
      setSocialLoginError("Failed to sign in with Apple. Please try again.");
    } finally {
      setDisableButton(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSocialLoginError("");
      setDisableButton(true);

      // TODO: Implement Google Sign In logic here
      // For now, simulating success
      console.log("Google Sign In initiated");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // On success, show username setup
      setShowUsernameSetup(true);
    } catch (error) {
      console.error("Google Sign In Error:", error);
      setSocialLoginError("Failed to sign in with Google. Please try again.");
    } finally {
      setDisableButton(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    setUsernameError("");

    // Basic username validation
    if (text.length < 3) {
      setUsernameError("Username must be at least 3 characters long.");
    } else if (!/^[a-zA-Z0-9._]+$/.test(text)) {
      setUsernameError(
        "Username can only contain letters, numbers, dots, and underscores."
      );
    } else {
      setUsernameError("Username is available.");
    }
  };

  const handleSaveUsername = async () => {
    try {
      if (usernameError && usernameError !== "Username is available.") {
        return;
      }

      if (!clearToMove) {
        return;
      }

      setDisableButton(true);

      // TODO: Implement save username API call
      console.log("Saving username:", username);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to main app or next step
      console.log("Username saved successfully!");
    } catch (error) {
      console.error("Save Username Error:", error);
      setUsernameError("Failed to save username. Please try again.");
    } finally {
      setDisableButton(false);
    }
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const validateEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  return (
    <View
      className={`flex-1 bg-black ${Platform.OS === "ios" ? "px-3 pt-safe -pb-safe-offset-3" : "px-3 py-safe"}`}
    >
      <StatusBar style="light" />
      <TouchableOpacity className="border border-white px-3 py-1.5 rounded-2xl flex-row justify-center items-center gap-1.5 self-end">
        <RNText className="text-white font-poppins-regular text-sm">
          Explore
        </RNText>
        <FontAwesome5 name="shopping-bag" size={13} color="#fff" />
      </TouchableOpacity>
      <View className="absolute top-24 w-full left-5 right-5">
        <RNText className="text-white text-6xl text-center tracking-ultra-wide mt-24 font-poppins-light leading-[55px]">
          LYNKD
        </RNText>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={10}
        extraKeyboardSpace={-10}
      >
        {showUsernameSetup ? (
          <UsernameSetupContent
            username={username}
            usernameError={usernameError}
            clearToMove={clearToMove}
            onUsernameChange={handleUsernameChange}
            onSaveUsername={handleSaveUsername}
            onToggleAgreement={() => setClearToMove(!clearToMove)}
            disableButton={disableButton}
          />
        ) : (
          <FormContent
            email={email}
            password={password}
            passwordVisible={passwordVisible}
            setPasswordVisible={setPasswordVisible}
            emailError={emailError}
            setEmailError={setEmailError}
            passwordError={passwordError}
            setPasswordError={setPasswordError}
            disableButton={disableButton}
            validateEmail={validateEmail}
            isKeyboardVisible={isKeyboardVisible}
            onAppleSignIn={handleAppleSignIn}
            onGoogleSignIn={handleGoogleSignIn}
            socialLoginError={socialLoginError}
          />
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
