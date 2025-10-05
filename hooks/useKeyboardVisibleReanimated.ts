// useKeyboardVisibleReanimated.ts
import { useState } from "react";
import {
  KeyboardState,
  useAnimatedKeyboard,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type Options = {
  includeOpening?: boolean; // treat OPENING as visible
  minHeight?: number; // dp threshold to consider visible
};

type Result = {
  visible: boolean;
  height: number; // rounded dp
  state: KeyboardState;
};

export function useKeyboardVisibleReanimated({
  includeOpening = true,
  minHeight = 1,
}: Options = {}): Result {
  const { height: kbHeightSV, state: kbStateSV } = useAnimatedKeyboard();

  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(0);
  const [state, setState] = useState<KeyboardState>(KeyboardState.CLOSED);

  // prevent spamming RN with identical values
  const prevVisible = useSharedValue<boolean>(false);
  const prevHeight = useSharedValue<number>(0);
  const prevState = useSharedValue<KeyboardState>(KeyboardState.CLOSED);

  useDerivedValue(() => {
    const isStateOpen =
      kbStateSV.value === KeyboardState.OPEN ||
      (includeOpening && kbStateSV.value === KeyboardState.OPENING);

    const isHeightOpen = kbHeightSV.value > minHeight;
    const nextVisible = isStateOpen || isHeightOpen;

    if (nextVisible !== prevVisible.value) {
      prevVisible.value = nextVisible;
      // setVisible is defined on the RN Runtime (component scope) → valid to call here
      scheduleOnRN(setVisible, nextVisible);
    }

    const nextHeight = Math.max(0, Math.round(kbHeightSV.value));
    if (nextHeight !== prevHeight.value) {
      prevHeight.value = nextHeight;
      scheduleOnRN(setHeight, nextHeight);
    }

    if (kbStateSV.value !== prevState.value) {
      prevState.value = kbStateSV.value;
      scheduleOnRN(setState, kbStateSV.value);
    }
  });

  return { visible, height, state };
}
