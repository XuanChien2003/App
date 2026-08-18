import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOrderDetail } from '../api/orders';
import { useToast } from '../ui/Toast';

const BLUE = '#2f6cf6';

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
    <View style={[styles.badgeWrap, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const EVENT_LABELS = {
  nhap_kho: 'Nhập kho',
  xuat_kho: 'Xuất kho',
  ban_giao: 'Bàn giao',
  tra_cuu: 'Tra cứu',
};
function eventLabel(type) {
  return EVENT_LABELS[type] || type || '-';
}

function formatDateTime(str) {
  if (!str) return '-';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleString('vi-VN');
}

export function HistoryDetailScreen({ route }) {
  const item = route.params?.item;
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!item?.order?.internalCode) {
        setLoading(false);
        return;
      }
      try {
        const detail = await getOrderDetail(item.order.internalCode);
        if (active) setOrder(detail);
      } catch (err) {
        if (active) toast.error(err.message || 'Không tải được thông tin đơn');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.order?.internalCode]);

  if (!item) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" backgroundColor="#f2f4f8" />
        <Text style={styles.emptyText}>Không có dữ liệu</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={[styles.pad, { paddingBottom: Math.max(40, insets.bottom + 24) }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f4f8" />

      {/* Hero card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroCode}>{item.order?.internalCode || '-'}</Text>
        <View style={styles.resultBanner}>
          <Text style={styles.resultBannerText}>{eventLabel(item.eventType)}</Text>
        </View>
      </View>

      {/* Thông tin sự kiện */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>THÔNG TIN SỰ KIỆN</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Loại sự kiện</Text>
          <Text style={styles.infoValue}>{eventLabel(item.eventType)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Thời gian</Text>
          <Text style={styles.infoValue}>{formatDateTime(item.eventTime)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vị trí</Text>
          <Text style={styles.infoValue}>{item.location || '-'}</Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.infoLabel}>Ghi chú</Text>
          <Text style={styles.infoValue}>{item.note || '-'}</Text>
        </View>
      </View>

      {/* Thông tin đơn */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={BLUE} />
      ) : order ? (
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
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f2f4f8' },
  pad: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f4f8' },
  emptyText: { fontSize: 14, color: '#9ca3b8' },

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
    backgroundColor: '#e8f0ff',
  },
  resultBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE,
  },

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

  badgeWrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
