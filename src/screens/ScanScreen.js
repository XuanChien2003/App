import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
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

const BLUE = '#2f6cf6';
const GREEN = '#0ea865';
const ORANGE = '#f59e0b';

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ─── Badge helper (khớp trạng thái BE) ─── */
function StatusBadge({ status }) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  let bg = '#eef1f7';
  let color = '#5a6480';
  let label = status;

  if (s.includes('đang vc') || s.includes('vận chuyển') || s.includes('dang vc')) {
    bg = '#fff7e0'; color = '#b45309'; label = 'Đang VC';
  } else if (s.includes('đã giao') || s.includes('da giao') || s.includes('giao thành công')) {
    bg = '#e2f9ee'; color = '#057a3e'; label = 'Đã giao';
  } else if (s.includes('phát') || s.includes('đang phát')) {
    bg = '#e8f0ff'; color = '#1c52c6'; label = 'Đang phát';
  } else if (s.includes('chờ') || s.includes('xl') || s.includes('mới')) {
    bg = '#eef1f7'; color = '#5a6480'; label = 'Chờ XL';
  } else if (s.includes('hoàn') || s.includes('hủy') || s.includes('thất bại')) {
    bg = '#fff0f0'; color = '#c53030'; label = 'Hoàn';
  }

  return (
    <View style={[badgeStyles.wrap, { backgroundColor: bg }]}>
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

/* ─── Màn hình QUÉT MÃ chính ─── */
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
    if (now - lastScanRef.current < 1500) return;
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
        // detail lookup nice-to-have
      }

      setResult({ ...scanRes, order: orderInfo });
    } catch (err) {
      setError(err.message || 'Quét mã thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLookupOnly() {
    setSubmitting(true);
    setError('');
    try {
      const orderInfo = await getOrderDetail(scannedCode);
      setResult({ lookupOnly: true, order: orderInfo });
    } catch (err) {
      setError(err.message || 'Không tìm thấy đơn hàng');
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

  /* ══════════════════════════════════════
     RESULT SCREEN
  ══════════════════════════════════════ */
  if (result) {
    const order = result.order;
    return (
      <ScrollView style={styles.bg} contentContainerStyle={styles.pad}>
        <StatusBar barStyle="dark-content" backgroundColor="#f2f4f8" />

        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroCode}>{result.order?.internalCode || result.internalCode}</Text>
          <View
            style={[
              styles.resultBanner,
              { backgroundColor: result.lookupOnly ? '#e8f0ff' : result.idempotent ? '#eef1f7' : '#e2f9ee' },
            ]}
          >
            <Text
              style={[
                styles.resultBannerText,
                { color: result.lookupOnly ? BLUE : result.idempotent ? '#5a6480' : '#057a3e' },
              ]}
            >
              {result.lookupOnly ? '🔍 Đã tra cứu (không ghi log)' : result.idempotent ? '✓ Đã ghi nhận trước đó' : '✓ Quét thành công'}
            </Text>
          </View>
        </View>

        {/* Thông tin sự kiện (chỉ hiện khi có ghi log quét) */}
        {!result.lookupOnly && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>THÔNG TIN SỰ KIỆN</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Loại sự kiện</Text>
              <Text style={styles.infoValue}>{result.eventType}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Thời gian</Text>
              <Text style={styles.infoValue}>
                {new Date(result.eventTime).toLocaleString('vi-VN')}
              </Text>
            </View>
          </View>
        )}

        {/* Thông tin đơn hàng */}
        {order && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>THÔNG TIN ĐƠN</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người nhận</Text>
              <Text style={styles.infoValue}>{order.receiverName || '-'}</Text>
            </View>
            {order.receiverPhone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>SĐT</Text>
                <Text style={styles.infoValue}>{order.receiverPhone}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái</Text>
              <StatusBadge status={order.currentStatus} />
            </View>
            {order.serviceName ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dịch vụ</Text>
                <Text style={styles.infoValue}>{order.serviceName}</Text>
              </View>
            ) : null}
            {order.cod != null ? (
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>COD</Text>
                <Text style={styles.infoValue}>{order.cod.toLocaleString('vi-VN')}đ</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity style={styles.btnPrimary} onPress={handleScanAgain}>
          <Text style={styles.btnPrimaryText}>Quét mã tiếp theo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnLink} onPress={() => navigation.navigate('History')}>
          <Text style={styles.btnLinkText}>Xem lịch sử quét</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ══════════════════════════════════════
     CONFIRM SCREEN (sau khi quét được mã)
  ══════════════════════════════════════ */
  if (scannedCode) {
    return (
      <ScrollView style={styles.bg} contentContainerStyle={styles.pad}>
        <StatusBar barStyle="dark-content" backgroundColor="#f2f4f8" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MÃ ĐÃ QUÉT</Text>
          <Text style={styles.scannedCode}>{scannedCode}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOẠI SỰ KIỆN</Text>
          <View style={styles.chipRow}>
            {EVENT_TYPES.map((et) => (
              <TouchableOpacity
                key={et.value}
                style={[styles.chip, eventType === et.value && styles.chipActive]}
                onPress={() => setEventType(et.value)}
              >
                <Text style={[styles.chipText, eventType === et.value && styles.chipTextActive]}>
                  {et.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VỊ TRÍ (tùy chọn)</Text>
          <TextInput
            style={styles.inputBox}
            value={location}
            onChangeText={setLocation}
            placeholder="VD: Bưu cục Gia Lâm"
            placeholderTextColor="#aab0c2"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GHI CHÚ (tùy chọn)</Text>
          <TextInput
            style={styles.inputBox}
            value={note}
            onChangeText={setNote}
            placeholder="Ghi chú thêm..."
            placeholderTextColor="#aab0c2"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btnPrimary, submitting && { opacity: 0.7 }]}
          onPress={handleConfirmSubmit}
          disabled={submitting}
          testID="confirm-scan-button"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Xác nhận</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnLink}
          onPress={handleLookupOnly}
          disabled={submitting}
          testID="lookup-only-button"
        >
          <Text style={styles.btnLinkText}>Chỉ xem thông tin (không ghi log)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnLink} onPress={handleScanAgain}>
          <Text style={styles.btnLinkText}>Hủy, quét lại</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ══════════════════════════════════════
     MAIN SCAN SCREEN
  ══════════════════════════════════════ */
  return (
    <View style={styles.bg}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f4f8" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>V</Text>
          </View>
          <Text style={styles.headerTitle}>VTP Scanner</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Lịch sử</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} testID="logout-button" style={styles.avatarBtn}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.username || '?').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera / scan area */}
      {permission?.granted ? (
        cameraActive ? (
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
            {/* Corner frame overlay */}
            <View style={styles.frameOverlay} pointerEvents="none">
              {/* top-left */}
              <View style={[styles.corner, styles.cornerTL]} />
              {/* top-right */}
              <View style={[styles.corner, styles.cornerTR]} />
              {/* bottom-left */}
              <View style={[styles.corner, styles.cornerBL]} />
              {/* bottom-right */}
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.cameraHint}>Đưa mã vạch vào khung hình</Text>
          </View>
        ) : (
          <View style={[styles.cameraWrap, { backgroundColor: '#1a1f36', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Camera đã dừng</Text>
          </View>
        )
      ) : (
        <View style={styles.permissionBox}>
          <Text style={styles.permText}>Cần quyền truy cập camera để quét mã</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
            <Text style={styles.btnPrimaryText}>Cấp quyền camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual input footer */}
      <View style={styles.footer}>
        <TextInput
          style={styles.footerInput}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="Nhập tay mã đơn..."
          placeholderTextColor="rgba(255,255,255,0.35)"
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={handleManualSubmit}
          testID="manual-code-input"
        />
        <TouchableOpacity style={styles.footerBtn} onPress={handleManualSubmit} testID="manual-submit-button">
          <Text style={styles.footerBtnText}>Tra cứu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f2f4f8' },
  pad: { padding: 16, paddingBottom: 40 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaf2',
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#1a1f36', letterSpacing: -0.2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#e8f0ff',
  },
  headerBtnText: { fontSize: 12.5, fontWeight: '600', color: BLUE },
  avatarBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e8f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: BLUE },

  /* Camera */
  cameraWrap: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    position: 'relative',
  },
  frameOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: BLUE,
    borderWidth: 3,
  },
  cornerTL: { top: '20%', left: '15%', borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: '20%', right: '15%', borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: '20%', left: '15%', borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: '20%', right: '15%', borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  cameraHint: {
    position: 'absolute',
    bottom: 16,
    left: 0, right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },

  /* Permission box */
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  permText: { fontSize: 14, color: '#5c6479', textAlign: 'center' },

  /* Footer manual input */
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#1a1f36',
  },
  footerInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#fff',
  },
  footerBtn: {
    height: 44,
    paddingHorizontal: 18,
    backgroundColor: BLUE,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },

  /* Shared sections */
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
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

  /* Info rows */
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

  /* Scanned code display */
  scannedCode: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1f36',
    padding: 16,
    letterSpacing: 0.3,
  },

  /* Event type chips */
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#e4e8f0',
    backgroundColor: '#f7f9fc',
  },
  chipActive: { backgroundColor: BLUE, borderColor: BLUE },
  chipText: { fontSize: 13, color: '#1a1f36', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  /* Input inside sections */
  inputBox: {
    marginHorizontal: 16,
    marginVertical: 12,
    height: 44,
    backgroundColor: '#f7f9fc',
    borderWidth: 1.5,
    borderColor: '#e4e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1a1f36',
  },

  /* Error */
  error: {
    color: '#e53e3e',
    backgroundColor: '#fff0f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 13,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229,62,62,0.2)',
  },

  /* Result hero */
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8eaf2',
  },
  heroCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f36',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  resultBanner: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  resultBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },

  /* Buttons */
  btnPrimary: {
    backgroundColor: BLUE,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  btnLink: { alignItems: 'center', paddingVertical: 10 },
  btnLinkText: { color: BLUE, fontSize: 13, fontWeight: '600' },
});
