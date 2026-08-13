import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getScanHistory } from '../api/scans';

const PAGE_SIZE = 20;
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
    <View style={[badge.wrap, { backgroundColor: bg }]}>
      <Text style={[badge.text, { color }]}>{label}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  text: { fontSize: 12, fontWeight: '600' },
});

/* ─── Format date ─── */
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${min}`;
}

/* ─── Event type label ─── */
const EVENT_LABELS = {
  nhap_kho: 'Nhập kho',
  xuat_kho: 'Xuất kho',
  ban_giao: 'Bàn giao',
};
function eventLabel(type) {
  return EVENT_LABELS[type] || type || '-';
}

export function HistoryScreen() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (targetPage, append) => {
    try {
      const res = await getScanHistory({ page: targetPage, limit: PAGE_SIZE });
      setTotal(res.total);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
      setPage(targetPage);
      setError('');
    } catch (err) {
      setError(err.message || 'Không tải được lịch sử quét');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(1, false).finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(1, false);
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    await load(page + 1, true);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" backgroundColor="#f2f4f8" />
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="history-screen">
      <StatusBar barStyle="dark-content" backgroundColor="#f2f4f8" />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item, index) =>
          `${item.order?.internalCode || 'x'}-${item.eventTime}-${index}`
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BLUE} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Chưa có lượt quét nào</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: 14 }} color={BLUE} />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            {/* Left: code + receiver */}
            <View style={styles.rowLeft}>
              <Text style={styles.rowCode}>
                {item.order?.internalCode || '-'}
              </Text>
              {item.order?.receiverName ? (
                <Text style={styles.rowReceiver}>{item.order.receiverName}</Text>
              ) : null}
              <Text style={styles.rowTime}>{formatDate(item.eventTime)}</Text>
            </View>

            {/* Right: status badge + event type */}
            <View style={styles.rowRight}>
              <StatusBadge status={item.order?.currentStatus} />
              <Text style={styles.rowEventType}>{eventLabel(item.eventType)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f4f8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f4f8' },
  listContent: { padding: 14, paddingBottom: 40 },

  error: {
    color: '#e53e3e',
    backgroundColor: '#fff0f0',
    padding: 12,
    margin: 14,
    borderRadius: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(229,62,62,0.2)',
  },

  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#9ca3b8' },

  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e8eaf2',
    shadowColor: '#0a0f28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  rowLeft: { flex: 1, marginRight: 10 },
  rowCode: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1a1f36',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  rowReceiver: {
    fontSize: 12.5,
    color: '#5c6479',
    marginBottom: 4,
  },
  rowTime: {
    fontSize: 11.5,
    color: '#9ca3b8',
    fontWeight: '500',
  },

  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowEventType: {
    fontSize: 11.5,
    color: '#9ca3b8',
    fontWeight: '500',
  },
});
