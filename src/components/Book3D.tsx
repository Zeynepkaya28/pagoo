import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing, cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withDecay, withRepeat, withSequence, withSpring, withTiming, SharedValue, useDerivedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { BookCover, CoverBook, coverColors } from './BookCover';

const P = 1100;

/**
 * A book drawn as three faces (cover, spine, page block) that share a hinge,
 * so it can be spun around like a real object.
 */
export function Book3D({ book, width = 170, interactive = true, sway = true, angle }: { book: CoverBook; width?: number; interactive?: boolean; sway?: boolean; angle?: SharedValue<number> }) {
  const W = width;
  const H = Math.round(W * 1.5);
  const D = Math.max(12, Math.round(W * 0.17));
  const own = useSharedValue(-24);
  const rot = angle ?? own;
  const tilt = useSharedValue(0);
  const [main, accent, paper] = coverColors(book);

  useEffect(() => {
    if (!sway || angle) return;
    rot.value = withRepeat(
      withSequence(withTiming(-34, { duration: 2600, easing: Easing.inOut(Easing.sin) }), withTiming(-14, { duration: 2600, easing: Easing.inOut(Easing.sin) })),
      -1,
      true,
    );
    return () => cancelAnimation(rot);
  }, [sway]);

  const pan = Gesture.Pan()
    .enabled(interactive)
    .onBegin(() => {
      cancelAnimation(rot);
    })
    .onChange((e) => {
      rot.value = Math.max(-80, Math.min(80, rot.value - e.changeX * 0.55));
      tilt.value = Math.max(-14, Math.min(14, tilt.value + e.changeY * 0.12));
    })
    .onEnd((e) => {
      rot.value = withDecay({ velocity: -e.velocityX * 0.3, clamp: [-78, 78], deceleration: 0.994 }, () => {
        rot.value = withSpring(-24, { damping: 12, stiffness: 60 });
      });
      tilt.value = withSpring(0, { damping: 10, stiffness: 90 });
    });

  // the visible spine rotates with the cover around the shared hinge (left edge)
  const theta = useDerivedValue(() => -rot.value);

  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: P }, { rotateX: `${tilt.value}deg` }, { rotateY: `${theta.value}deg` }],
  }));
  const spineStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: P }, { rotateX: `${tilt.value}deg` }, { rotateY: `${theta.value - 90}deg` }],
  }));
  const pagesStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: P }, { rotateX: `${tilt.value}deg` }, { translateX: -W }, { rotateY: `${theta.value}deg` }, { translateX: W }, { rotateY: '90deg' }],
  }));
  const sheen = useAnimatedStyle(() => ({ opacity: interpolate(theta.value, [-60, 0, 60], [0.05, 0.25, 0.4]) }));
  const spineShade = useAnimatedStyle(() => ({ opacity: interpolate(theta.value, [0, 70], [0.55, 0.05]) }));
  const pageShade = useAnimatedStyle(() => ({ opacity: interpolate(theta.value, [-70, 0], [0.0, 0.5]) }));
  const shadow = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(Math.abs(theta.value), [0, 80], [1, 0.45]) }],
    opacity: interpolate(Math.abs(theta.value), [0, 80], [0.35, 0.18]),
  }));

  // the hinge sits at the cover's left edge; shift so the book looks centred
  const offset = D * 0.5;

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: W + D * 2, height: H + 40, alignItems: 'center' }}>
        <Animated.View style={[{ position: 'absolute', bottom: 4, width: W * 1.05, height: 22, borderRadius: 100, backgroundColor: '#000' }, shadow, { filter: 'blur(10px)' } as any]} />
        <View style={{ width: W, height: H, marginLeft: offset }}>
          {/* spine */}
          <Animated.View
            style={[{ position: 'absolute', left: -D, top: 0, width: D, height: H, backgroundColor: main, transformOrigin: 'right center', backfaceVisibility: 'hidden' } as any, spineStyle]}
          >
            <LinearGradient colors={['rgba(255,255,255,0.18)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.25)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: H - 30, transform: [{ rotate: '90deg' }], alignItems: 'center' }}>
                <Text numberOfLines={1} style={{ fontFamily: 'Fraunces_700Bold', color: paper, fontSize: Math.max(8, D * 0.42) }}>
                  {book.title}
                </Text>
              </View>
              <View style={{ position: 'absolute', top: 10, width: D * 0.6, height: 2, backgroundColor: accent }} />
              <View style={{ position: 'absolute', bottom: 10, width: D * 0.6, height: 2, backgroundColor: accent }} />
            </LinearGradient>
            <Animated.View style={[{ position: 'absolute', inset: 0, backgroundColor: '#000' } as any, spineShade]} />
          </Animated.View>

          {/* page block */}
          <Animated.View
            style={[{ position: 'absolute', left: W, top: 3, width: D, height: H - 6, transformOrigin: 'left center', backfaceVisibility: 'hidden' } as any, pagesStyle]}
          >
            <LinearGradient
              colors={['#FBF7EE', '#E9E2D2', '#FBF7EE', '#E4DCCB', '#FAF5EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
            <Animated.View style={[{ position: 'absolute', inset: 0, backgroundColor: '#000' } as any, pageShade]} />
          </Animated.View>

          {/* cover */}
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: 'left center', backfaceVisibility: 'hidden' } as any, coverStyle]}>
            <BookCover book={book} width={W} radius={3} shadow={false} />
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0 } as any, sheen]}>
              <LinearGradient colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)']} locations={[0, 0.35, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </GestureDetector>
  );
}
