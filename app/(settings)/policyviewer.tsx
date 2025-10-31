import ScreenHeaderBack from "@/components/ScreenHeaderBack";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Text,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// PDFs (keep these)
const TermsOfUsePDF = require("../../assets/policies/Terms of Use.pdf");
const PrivacyPolicyPDF = require("../../assets/policies/Privacy Policy.pdf");
const CommunityGuidelinesPDF = require("../../assets/policies/Community Guidelines.pdf");
const OtherPoliciesPDF = require("../../assets/policies/Other Policies.pdf");
const CommissionsPolicyPDF = require("../../assets/policies/Commissions and Fees Policy.pdf");
const EndUserLicenseAgreementPDF = require("../../assets/policies/End User License Agreement.pdf");

// NOTE: we intentionally DO NOT map the AI policy to a PDF now
type PolicyKey =
  | "Terms of Use"
  | "End User License Agreement (EULA)"
  | "Privacy Policy"
  | "Community Guidelines"
  | "Commissions & Fees Policy"
  | "AI Generated Content Policy (In Development)"
  | "Other Policies";

const getPdfForPolicy = (policy: PolicyKey | string | undefined) => {
  switch (policy) {
    case "Terms of Use":
      return TermsOfUsePDF;
    case "End User License Agreement (EULA)":
      return EndUserLicenseAgreementPDF;
    case "Privacy Policy":
      return PrivacyPolicyPDF;
    case "Community Guidelines":
      return CommunityGuidelinesPDF;
    case "Commissions & Fees Policy":
      return CommissionsPolicyPDF;
    case "Other Policies":
      return OtherPoliciesPDF;
    // "AI Generated Content Policy (In Development)" => return null on purpose
    default:
      return null;
  }
};

const { width, height } = Dimensions.get("window");

const PolicyViewer = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ policyTitle?: string }>();

  const policyTitle = params.policyTitle ?? "Policy";
  const isInDev =
    policyTitle === "AI Generated Content Policy (In Development)";

  // Gate: never load a PDF if it's in development
  const pdfSource = useMemo(
    () => (isInDev ? null : getPdfForPolicy(policyTitle)),
    [isInDev, policyTitle]
  );

  // Short header title so it doesn’t overlap/back
  const headerTitle = isInDev ? "AI Generated Content Policy" : policyTitle;

  const [loading, setLoading] = useState(true);

  return (
    <View
      className="flex-1 bg-gray-100"
      style={{ paddingTop: insets.top - 10 }}
    >
      <ScreenHeaderBack title={headerTitle} onBack={() => router.back()} />

      {isInDev && (
        <View className="px-4 py-3 bg-amber-400">
          <Text className="text-[14px] text-gray-800 text-center">
            This feature is currently in development, policy will be updated
            when feature is live.
          </Text>
        </View>
      )}

      {/* When in development: show info instead of a PDF */}
      {isInDev ? (
        <View className="m-3 rounded-xl bg-white p-4">
          <Text className="text-[14px] text-gray-800">
            The AI Generated Content Policy is being finalized. Please check
            back soon.
          </Text>
        </View>
      ) : (
        <View
          className="flex-1 items-center justify-start bg-white rounded-xl mx-3 overflow-hidden"
          style={{
            marginBottom:
              Platform.OS === "ios" ? insets.bottom - 10 : insets.bottom,
          }}
        >
          {loading && (
            <View className="absolute inset-0 z-10 items-center justify-center bg-white/80">
              <ActivityIndicator size="large" />
            </View>
          )}

          {pdfSource ? (
            <View style={{ flex: 1, overflow: "hidden" }}>
              <Pdf
                source={pdfSource}
                trustAllCerts={false}
                onLoadComplete={() => setLoading(false)}
                onError={(error) => {
                  console.log("PDF Error:", error);
                  setLoading(false);
                }}
                onPressLink={(uri) => console.log(`Link pressed: ${uri}`)}
                style={{ flex: 1, width, height }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-[14px] text-gray-700">
                Unable to load the document.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default PolicyViewer;
