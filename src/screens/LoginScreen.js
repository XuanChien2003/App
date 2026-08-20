import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../ui/Toast';

export function LoginScreen() {
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!username || !password) {
      toast.error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setSubmitting(true);
    try {
      const loggedInUser = await login(username, password);
      toast.success(`Xin chào, ${loggedInUser?.displayName || loggedInUser?.username || ''}`);
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
      </View>

      <Text style={styles.title}>New Horizon Scanner</Text>
      <Text style={styles.subtitle}>Đăng nhập để quét mã đơn hàng</Text>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Tên đăng nhập"
          placeholderTextColor="#aab0c2"
          autoCapitalize="none"
          autoCorrect={false}
          testID="username-input"
        />

        <View style={styles.passwordField}>
        <TextInput
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Mật khẩu"
          placeholderTextColor="#aab0c2"
          secureTextEntry={!passwordVisible}
          autoCapitalize="none"
          autoCorrect={false}
          testID="password-input"
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setPasswordVisible((visible) => !visible)}
          accessibilityRole="button"
          accessibilityLabel={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          accessibilityState={{ selected: passwordVisible }}
          hitSlop={8}
          testID="password-visibility-toggle"
        >
          <Text style={styles.passwordToggleIcon}>{passwordVisible ? '◉' : '◉̸'}</Text>
        </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          testID="login-button"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const BLUE = '#2f6cf6';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  /* Logo */
  logoWrap: {
    marginBottom: 16,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1f36',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3b8',
    marginBottom: 28,
  },

  formCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#0a0f28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },

  input: {
    height: 46,
    backgroundColor: '#f7f9fc',
    borderWidth: 1.5,
    borderColor: '#e4e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1a1f36',
  },
  passwordField: {
    marginTop: 12,
    position: 'relative',
  },
  passwordInput: {
    height: 46,
    backgroundColor: '#f7f9fc',
    borderWidth: 1.5,
    borderColor: '#e4e8f0',
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 48,
    fontSize: 15,
    color: '#1a1f36',
  },
  passwordToggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordToggleIcon: {
    color: '#667085',
    fontSize: 22,
  },

  button: {
    backgroundColor: BLUE,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.6,
  },
});
