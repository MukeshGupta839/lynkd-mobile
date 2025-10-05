// CircularProgress.tsx
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Text as SvgText } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size: number;
  strokeWidth: number;
  progressPercent?: number; // 0..100
  progress?: number; // 0..1
  bgColor?: string;
  pgColor?: string;
  duration?: number;
  text?: string;
  textColor?: string;
  textSize?: number;
  startAngle?: number; // default -90
  roundedCaps?: boolean; // default true
  containerStyle?: any;
  showRing?: boolean; // ⬅️ NEW (default true)
};

const CircularProgressComponent: React.FC<Props> = ({
  size,
  strokeWidth,
  progressPercent,
  progress,
  bgColor = "#f2f2f2",
  pgColor = "#3b5998",
  duration = 200,
  text,
  textColor = "#333333",
  textSize = 10,
  startAngle = -90,
  roundedCaps = true,
  containerStyle,
  showRing = true, // ⬅️ default
}) => {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = useMemo(() => 2 * Math.PI * r, [r]);

  const target = Math.max(
    0,
    Math.min(
      1,
      progress !== undefined ? progress : (progressPercent ?? 0) / 100
    )
  );
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(target, { duration });
  }, [target, duration, p]);

  const animatedProps = useAnimatedProps(() => {
    return { strokeDashoffset: circumference * (1 - p.value) } as any;
  });

  return (
    <View style={[{ margin: 10 }, containerStyle]}>
      <Svg width={size} height={size}>
        {showRing && (
          <>
            {/* Background ring */}
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={bgColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress ring */}
            <AnimatedCircle
              cx={cx}
              cy={cy}
              r={r}
              stroke={pgColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference}, ${circumference}`}
              animatedProps={animatedProps}
              strokeLinecap={roundedCaps ? "round" : "butt"}
              // Use SVG transform rotate(angle cx cy) instead of deprecated props
              transform={`rotate(${startAngle} ${cx} ${cy})`}
            />
          </>
        )}

        {/* Center text */}
        {typeof text === "string" && text.length > 0 && (
          <SvgText
            x={cx}
            y={cy + textSize / 2 - 1}
            textAnchor="middle"
            fontSize={textSize}
            fill={textColor}
            fontFamily="OpenSans-Regular"
          >
            {text}
          </SvgText>
        )}
      </Svg>
    </View>
  );
};

const CircularProgress = React.memo(CircularProgressComponent);
CircularProgress.displayName = "CircularProgress";
export default CircularProgress;
