import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../auth/AuthContext';
import { submitScan } from '../api/scans';
import { getOrderDetail } from '../api/orders';

const EVENT_TYPES = [
  { value: 'nhap_kho', label: 'Nhập kho' },
  { value: 'xuat_kho', label: 'Xuất kho' },
  { value: 'ban_giao', label: 'Bàn giao' },
];

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ScanScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [scannedCode, setScannedCode] = useState(null);
  const [eventType, setEventType] = useState('nhap_kho');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const lastScanRef = useRef(0);

  function handleBarcodeScanned(event) {
    const now = Date.now();
    if (now - lastScanRef.current < 1500) return; // debounce rapid repeat callbacks for the same code
    lastScanRef.current = now;
    setCameraActive(false);
    setScannedCode(event.data);
    setError('');
  }

  function handleManualSubmit() {
    if (!manualCode.trim()) return;
    setCameraActive(false);
    setScannedCode(manualCode.trim());
    setError('');
  }

  async function handleConfirmSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const scanRes = await submitScan({
        vtpCode: scannedCode,
        eventType,
        location: location || undefined,
        note: note || undefined,
        eventTime: new Date().toISOString(),
        requestId: generateRequestId(),
      });

      let orderInfo = null;
      try {
        orderInfo = await getOrderDetail(scanRes.internalCode);
      } catch {
        // detail lookup is a nice-to-have on top of an already-successful scan
      }

      setResult({ ...scanRes, order: orderInfo });
    } catch (err) {
      setError(err.message || 'Quét mã thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  function handleScanAgain() {
    setScannedCode(null);
    setManualCode('');
    setLocation('');
    setNote('');
    setResult(null);
    setError('');
    setCameraActive(true);
  }

  if (result) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.resultTitle}>{result.idempotent ? 'Đã ghi nhận trước đó' : 'Quét thành công'}</Text>
          <Text style={styles.resultLine}>Mã đơn: {result.internalCode}</Text>
          <Text style={styles.resultLine}>Loại sự kiện: {result.eventType}</Text>
          <Text style={styles.resultLine}>Thời gian: {new Date(result.eventTime).toLocaleString('vi-VN')}</Text>
          {result.order && (
            <>
              <View style={styles.divider} />
              <Text style={styles.resultLine}>Người nhận: {result.order.receiverName}</Text>
              {result.order.receiverPhone ? <Text style={styles.resultLine}>SĐT: {result.order.receiverPhone}</Text> : null}
              <Text style={styles.resultLine}>Trạng thái hiện tại: {result.order.currentStatus}</Text>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleScanAgain}>
          <Text style={styles.buttonText}>Quét mã tiếp theo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('History')}>
          <Text style={styles.linkButtonText}>Xem lịch sử quét</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (scannedCode) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>Mã đã quét</Text>
          <Text style={styles.scannedCode}>{scannedCode}</Text>

          <Text style={styles.label}>Loại sự kiện</Text>
          <View style={styles.eventTypeRow}>
            {EVENT_TYPES.map((et) => (
              <TouchableOpacity
                key={et.value}
                style={[styles.eventTypeChip, eventType === et.value && styles.eventTypeChipActive]}
                onPress={() => setEventType(et.value)}
              >
                <Text style={[styles.eventTypeChipText, eventType === et.value && styles.eventTypeChipTextActive]}>
                  {et.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Vị trí (tùy chọn)</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} />

          <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
          <TextInput style={styles.input} value={note} onChangeText={setNote} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleConfirmSubmit} disabled={submitting} testID="confirm-scan-button">
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác nhận</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={handleScanAgain}>
            <Text style={styles.linkButtonText}>Hủy, quét lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.userLine}>{user?.displayName || user?.username}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.linkButtonText}>Lịch sử quét</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout} testID="logout-button">
          <Text style={styles.linkButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {permission?.granted ? (
        cameraActive && (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          </View>
        )
      ) : (
        <View style={styles.permissionBox}>
          <Text style={styles.label}>Cần quyền truy cập camera để quét mã</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Cấp quyền camera</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.manualBox}>
        <Text style={styles.label}>Hoặc nhập mã VTP thủ công</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={[styles.input, styles.manualInput]}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="VD: VTP100000123"
            autoCapitalize="characters"
            testID="manual-code-input"
          />
          <TouchableOpacity style={styles.manualButton} onPress={handleManualSubmit} testID="manual-submit-button">
            <Text style={styles.buttonText}>Nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f4f6f8', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  userLine: { fontSize: 13, color: '#616e7c' },
  cameraWrap: { height: 320, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  camera: { flex: 1 },
  permissionBox: { padding: 20, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  manualBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  manualRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  manualInput: { flex: 1 },
  manualButton: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  label: { fontSize: 13, color: '#616e7c', marginTop: 12, marginBottom: 4 },
  scannedCode: { fontSize: 18, fontWeight: '700', color: '#1f2933' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e4e8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  error: { color: '#dc2626', backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginTop: 14, fontSize: 13 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  linkButton: { alignItems: 'center', marginTop: 12 },
  linkButtonText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  eventTypeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  eventTypeChip: { borderWidth: 1, borderColor: '#e0e4e8', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  eventTypeChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  eventTypeChipText: { fontSize: 13, color: '#1f2933' },
  eventTypeChipTextActive: { color: '#fff' },
  resultTitle: { fontSize: 17, fontWeight: '700', color: '#15803d', marginBottom: 10 },
  resultLine: { fontSize: 14, color: '#1f2933', marginBottom: 4 },
  divider: { height: 1, backgroundColor: '#e0e4e8', marginVertical: 10 },
});
