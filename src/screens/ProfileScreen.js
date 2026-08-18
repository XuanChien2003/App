import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { changePassword } from '../api/auth';
import { useToast } from '../ui/Toast';

const BLUE = '#2f6cf6';
const PASSWORD_COMPLEXITY_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function handleChangePassword() {
    if (form.newPassword.length < 8 || !PASSWORD_COMPLEXITY_RE.test(form.newPassword)) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Đã đổi mật khẩu thành công');
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.bg}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.bg}
        contentContainerStyle={[styles.pad, { paddingBottom: Math.max(40, insets.bottom + 24) }]}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar barStyle="dark-content" backgroundColor="#f2f4f8" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN TÀI KHOẢN</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên đăng nhập</Text>
            <Text style={styles.infoValue}>{user?.username || '-'}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Họ tên</Text>
            <Text style={styles.infoValue}>{user?.displayName || '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ĐỔI MẬT KHẨU</Text>
          <TextInput
            style={styles.inputBox}
            value={form.currentPassword}
            onChangeText={(v) => setForm((f) => ({ ...f, currentPassword: v }))}
            placeholder="Mật khẩu hiện tại"
            placeholderTextColor="#aab0c2"
            secureTextEntry
            autoCapitalize="none"
            testID="current-password-input"
          />
          <TextInput
            style={styles.inputBox}
            value={form.newPassword}
            onChangeText={(v) => setForm((f) => ({ ...f, newPassword: v }))}
            placeholder="Mật khẩu mới"
            placeholderTextColor="#aab0c2"
            secureTextEntry
            autoCapitalize="none"
            testID="new-password-input"
          />
          <TextInput
            style={styles.inputBox}
            value={form.confirmPassword}
            onChangeText={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
            placeholder="Xác nhận mật khẩu mới"
            placeholderTextColor="#aab0c2"
            secureTextEntry
            autoCapitalize="none"
            testID="confirm-password-input"
          />
          <Text style={styles.hint}>Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.</Text>

          <TouchableOpacity
            style={[styles.btnPrimary, submitting && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={submitting}
            testID="change-password-button"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Đổi mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={logout} testID="logout-button">
          <Text style={styles.btnLogoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f2f4f8' },
  pad: { padding: 16 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8eaf2',
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#9ca3b8',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#f7f9fc',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaf2',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaf2',
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 13, color: '#5c6479' },
  infoValue: { fontSize: 13.5, fontWeight: '600', color: '#1a1f36', textAlign: 'right', flex: 1, marginLeft: 8 },

  inputBox: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 44,
    backgroundColor: '#f7f9fc',
    borderWidth: 1.5,
    borderColor: '#e4e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1a1f36',
  },
  hint: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 11.5,
    color: '#9ca3b8',
  },

  btnPrimary: {
    backgroundColor: BLUE,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },

  btnLogout: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f3b4b4',
    backgroundColor: '#fff5f5',
  },
  btnLogoutText: { color: '#c53030', fontWeight: '700', fontSize: 14.5 },
});
