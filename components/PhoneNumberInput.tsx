import { useState } from "react";
import { Text, View } from "react-native";
import PhoneInput from "react-native-international-phone-number";

interface PhoneNumberInputProps {
  inputValue: string;
  handleInputValue: (value: string) => void;
  selectedCountry: any;
  handleSelectedCountry: (country: any) => void;
}

export default function PhoneNumberInput(props: PhoneNumberInputProps) {
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handlePhoneNumberChange = (phoneNumber: string) => {
    // Validate based on country
    if (props.selectedCountry) {
      const countryCode = props.selectedCountry.cca2;
      const cleanNumber = phoneNumber.replace(/\D/g, ""); // Remove non-digits

      let isValidNumber = true;
      let error = "";

      // Country-specific validation with automatic length restriction
      switch (countryCode) {
        case "IN": // India - max 10 digits
          // Prevent typing more than 10 digits
          if (cleanNumber.length > 10) {
            return; // Don't update if exceeds max
          }
          if (cleanNumber.length > 0 && cleanNumber.length < 10) {
            isValidNumber = false;
            error = "Phone number should be 10 digits";
          }
          break;

        case "US": // United States - 10 digits
        case "CA": // Canada - 10 digits
          if (cleanNumber.length > 10) {
            return; // Don't update if exceeds max
          }
          if (cleanNumber.length > 0 && cleanNumber.length < 10) {
            isValidNumber = false;
            error = "Phone number should be 10 digits";
          }
          break;

        case "GB": // United Kingdom - 10-11 digits
          if (cleanNumber.length > 11) {
            return; // Don't update if exceeds max
          }
          if (cleanNumber.length > 0 && cleanNumber.length < 10) {
            isValidNumber = false;
            error = "Phone number should be at least 10 digits";
          }
          break;

        case "AU": // Australia - 10 digits
          if (cleanNumber.length > 10) {
            return; // Don't update if exceeds max
          }
          if (cleanNumber.length > 0 && cleanNumber.length < 10) {
            isValidNumber = false;
            error = "Phone number should be 10 digits";
          }
          break;

        case "CN": // China - 11 digits
          if (cleanNumber.length > 11) {
            return; // Don't update if exceeds max
          }
          if (cleanNumber.length > 0 && cleanNumber.length < 11) {
            isValidNumber = false;
            error = "Phone number should be 11 digits";
          }
          break;

        case "JP": // Japan - 10-11 digits
          if (cleanNumber.length > 11) {
            return; // Don't update if exceeds max
          }
          if (cleanNumber.length > 0 && cleanNumber.length < 10) {
            isValidNumber = false;
            error = "Phone number should be at least 10 digits";
          }
          break;

        case "BR": // Brazil - 10-11 digits
          if (cleanNumber.length > 11) {
            return; // Don't update if exceeds max
          }
          if (cleanNumber.length > 0 && cleanNumber.length < 10) {
            isValidNumber = false;
            error = "Phone number should be at least 10 digits";
          }
          break;

        case "FR": // France - 9-10 digits
        case "DE": // Germany - 9-10 digits
        case "IT": // Italy - 9-10 digits
        case "ES": // Spain - 9-10 digits
          if (cleanNumber.length > 10) {
            return; // Don't update if exceeds max
          }
          if (cleanNumber.length > 0 && cleanNumber.length < 9) {
            isValidNumber = false;
            error = "Phone number should be at least 9 digits";
          }
          break;

        default:
          // Generic validation for other countries (6-15 digits max)
          if (cleanNumber.length > 15) {
            return; // Don't update if exceeds max
          }
          if (cleanNumber.length > 0 && cleanNumber.length < 6) {
            isValidNumber = false;
            error = "Phone number is too short";
          }
      }

      setIsValid(isValidNumber);
      setErrorMessage(error);
    }

    // Update the input value
    props.handleInputValue(phoneNumber);
  };

  return (
    <View style={{ flex: 1, marginBottom: 70 }}>
      <PhoneInput
        value={props.inputValue}
        onChangePhoneNumber={handlePhoneNumberChange}
        selectedCountry={props.selectedCountry}
        onChangeSelectedCountry={props.handleSelectedCountry}
        placeholder="Enter your number"
        defaultCountry="IN"
      />
      {!isValid && errorMessage && (
        <Text className="text-red-500 text-sm mt-2 ml-1">{errorMessage}</Text>
      )}
    </View>
  );
}
