// components/CommentsSheet.tsx
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Platform, Text, View } from "react-native";

export type CommentsSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

const CommentsSheet = forwardRef<CommentsSheetHandle>((_props, ref) => {
  const modalRef = useRef<BottomSheetModalType>(null);

  const snapPoints = useMemo(() => ["35%", "70%"], []);

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      index={0} // start at '35%'
      enablePanDownToClose
      backdropComponent={(backdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
      // Make the sheet container transparent so inner colors render on iOS
      backgroundStyle={{ backgroundColor: "transparent" }}
      handleIndicatorStyle={{ backgroundColor: "#cfd2d7" }}
      topInset={Platform.OS === "ios" ? 16 : 0} // nice breathing room under notch
    >
      <BottomSheetView style={{ padding: 16, gap: 12 }}>
        {/* Inner card with red background (equivalent to bg-red-500) so text is visible */}
        <View
          style={{ backgroundColor: "#ef4444", borderRadius: 12, padding: 12 }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}>
            Comments
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: "rgba(255,255,255,0.4)",
              marginVertical: 8,
            }}
          />
          {/* Put your list/input here. If using a list, prefer BottomSheetFlatList for perf */}
          <Text style={{ color: "#fff" }}>Drop your comment UI here…</Text>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

CommentsSheet.displayName = "CommentsSheet";

export default CommentsSheet;
