import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../ui/Toast';

export function LoginScreen() {
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>V</Text>
        </View>
      </View>

      <Text style={styles.title}>VTP Scanner</Text>
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

        <TextInput
          style={[styles.input, { marginTop: 12 }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Mật khẩu"
          placeholderTextColor="#aab0c2"
          secureTextEntry
          autoCapitalize="none"
          testID="password-input"
        />

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
    </KeyboardAvoidingView>
  );
}

const BLUE = '#2f6cf6';

const styles = StyleSheet.create({
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
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
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
