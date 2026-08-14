import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ToastContext = createContext(null);

const KIND = {
  success: { bg: '#0ea865', icon: '✓' },
  error: { bg: '#e53e3e', icon: '✕' },
  info: { bg: '#2f6cf6', icon: 'ℹ' },
};

const VISIBLE_MS = 2800;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, [anim]);

  const show = useCallback(
    (kind, message) => {
      if (!message) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ id: Date.now(), kind, message });
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      timerRef.current = setTimeout(hide, VISIBLE_MS);
    },
    [anim, hide]
  );

  const api = useRef({
    success: (message) => show('success', message),
    error: (message) => show('error', message),
    info: (message) => show('info', message),
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 10 }]}>
          <Animated.View
            style={[
              styles.toast,
              { backgroundColor: KIND[toast.kind].bg },
              {
                opacity: anim,
                transform: [
                  { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) },
                ],
              },
            ]}
          >
            <Text style={styles.icon}>{KIND[toast.kind].icon}</Text>
            <Text style={styles.message} numberOfLines={3}>
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 480,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  icon: { color: '#fff', fontWeight: '800', fontSize: 14 },
  message: { color: '#fff', fontWeight: '600', fontSize: 13.5, flex: 1 },
});
