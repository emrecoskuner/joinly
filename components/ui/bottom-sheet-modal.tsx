import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BottomSheetModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
};

const COLLAPSED_SNAP = 0.62;
const EXPANDED_SNAP = 0.9;
const CLOSE_THRESHOLD = 140;

export function BottomSheetModal({
  visible,
  onRequestClose,
  children,
}: BottomSheetModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  const collapsedTranslate = useMemo(
    () => windowHeight * (1 - COLLAPSED_SNAP),
    [windowHeight]
  );
  const expandedTranslate = useMemo(
    () => windowHeight * (1 - EXPANDED_SNAP),
    [windowHeight]
  );
  const hiddenTranslate = useMemo(() => windowHeight, [windowHeight]);
  const translateY = useRef(new Animated.Value(hiddenTranslate)).current;
  const lastSnapRef = useRef(collapsedTranslate);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const snapTo = useCallback(
    (value: number) => {
      lastSnapRef.current = value;
      Animated.spring(translateY, {
        toValue: value,
        damping: 24,
        mass: 0.9,
        stiffness: 220,
        useNativeDriver: true,
      }).start();
    },
    [translateY]
  );

  const closeSheet = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: hiddenTranslate,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onRequestClose();
      }
    });
  }, [hiddenTranslate, onRequestClose, translateY]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(hiddenTranslate);
      lastSnapRef.current = collapsedTranslate;
      return;
    }

    lastSnapRef.current = collapsedTranslate;
    Animated.spring(translateY, {
      toValue: collapsedTranslate,
      damping: 22,
      mass: 0.95,
      stiffness: 210,
      useNativeDriver: true,
    }).start();
  }, [collapsedTranslate, hiddenTranslate, translateY, visible]);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      snapTo(expandedTranslate);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [expandedTranslate, snapTo, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          const nextValue = Math.max(
            expandedTranslate,
            lastSnapRef.current + gestureState.dy
          );
          translateY.setValue(nextValue);
        },
        onPanResponderRelease: (_, gestureState) => {
          const releaseValue = lastSnapRef.current + gestureState.dy;

          if (gestureState.dy > CLOSE_THRESHOLD) {
            closeSheet();
            return;
          }

          const nextSnap =
            Math.abs(releaseValue - expandedTranslate) < Math.abs(releaseValue - collapsedTranslate)
              ? expandedTranslate
              : collapsedTranslate;
          snapTo(nextSnap);
        },
        onPanResponderTerminate: () => {
          snapTo(lastSnapRef.current);
        },
      }),
    [closeSheet, collapsedTranslate, expandedTranslate, snapTo, translateY]
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={closeSheet}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeSheet} />
        <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={styles.safeArea}>
          <Animated.View
            style={[
              styles.sheet,
              {
                height: windowHeight * EXPANDED_SNAP,
                paddingBottom: keyboardHeight,
                transform: [{ translateY }],
              },
            ]}>
            <View {...panResponder.panHandlers} style={styles.dragRegion}>
              <View style={styles.handle} />
            </View>
            {children}
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20, 16, 12, 0.26)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFDFC',
    borderTopWidth: 1,
    borderColor: '#EFE4D6',
    overflow: 'hidden',
  },
  dragRegion: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#DED4C6',
  },
});
